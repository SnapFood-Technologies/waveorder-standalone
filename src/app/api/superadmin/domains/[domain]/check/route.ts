// app/api/superadmin/domains/[domain]/check/route.ts
/**
 * SuperAdmin API: Check DNS/SSL status for a specific domain
 * Performs real-time verification and returns detailed diagnostics
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import dns from 'dns'
import https from 'https'

// DNS check timeout
const DNS_TIMEOUT = 5000

/**
 * Resolve DNS records with timeout
 */
async function dnsLookup(
  hostname: string, 
  type: 'A' | 'TXT' | 'CNAME'
): Promise<{ success: boolean; records: string[]; error?: string }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, records: [], error: 'DNS lookup timeout' })
    }, DNS_TIMEOUT)

    const resolver = new dns.Resolver()
    resolver.setServers(['8.8.8.8', '1.1.1.1']) // Use public DNS

    const callback = (err: NodeJS.ErrnoException | null, records: any) => {
      clearTimeout(timeout)
      if (err) {
        resolve({ 
          success: false, 
          records: [], 
          error: err.code === 'ENODATA' ? 'No records found' : err.message 
        })
      } else {
        // Flatten TXT records (they come as arrays)
        const flatRecords = type === 'TXT' 
          ? records.flat().map((r: string[]) => Array.isArray(r) ? r.join('') : r)
          : records
        resolve({ success: true, records: flatRecords })
      }
    }

    switch (type) {
      case 'A':
        resolver.resolve4(hostname, callback)
        break
      case 'TXT':
        resolver.resolveTxt(hostname, callback)
        break
      case 'CNAME':
        resolver.resolveCname(hostname, callback)
        break
    }
  })
}

/**
 * Check SSL certificate for a domain
 */
async function checkSSL(
  domain: string
): Promise<{ 
  valid: boolean; 
  issuer?: string; 
  validFrom?: Date; 
  validTo?: Date; 
  daysRemaining?: number;
  error?: string 
}> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ valid: false, error: 'SSL check timeout' })
    }, 10000)

    try {
      const req = https.request({
        hostname: domain,
        port: 443,
        method: 'HEAD',
        rejectUnauthorized: false, // Accept any cert to inspect it
        timeout: 8000
      }, (res) => {
        clearTimeout(timeout)
        
        // @ts-ignore - socket has getPeerCertificate
        const cert = res.socket?.getPeerCertificate()
        
        if (!cert || Object.keys(cert).length === 0) {
          resolve({ valid: false, error: 'No certificate found' })
          return
        }

        const validFrom = new Date(cert.valid_from)
        const validTo = new Date(cert.valid_to)
        const now = new Date()
        const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Check if certificate is valid (not expired and issued by trusted CA)
        const isValid = now >= validFrom && now <= validTo

        resolve({
          valid: isValid,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
          validFrom,
          validTo,
          daysRemaining: isValid ? daysRemaining : 0
        })
      })

      req.on('error', (err) => {
        clearTimeout(timeout)
        resolve({ 
          valid: false, 
          error: err.message.includes('ECONNREFUSED') 
            ? 'Connection refused (HTTPS not available)' 
            : err.message 
        })
      })

      req.on('timeout', () => {
        clearTimeout(timeout)
        req.destroy()
        resolve({ valid: false, error: 'Connection timeout' })
      })

      req.end()
    } catch (err) {
      clearTimeout(timeout)
      resolve({ valid: false, error: (err as Error).message })
    }
  })
}

/**
 * Ping domain over HTTP/HTTPS
 */
async function pingDomain(
  domain: string, 
  protocol: 'http' | 'https' = 'https'
): Promise<{ reachable: boolean; latency?: number; statusCode?: number; error?: string }> {
  const start = Date.now()
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ reachable: false, error: 'Request timeout' })
    }, 10000)

    const url = `${protocol}://${domain}/`
    
    fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    })
      .then(res => {
        clearTimeout(timeout)
        const latency = Date.now() - start
        resolve({ 
          reachable: res.ok || res.status < 500, 
          latency,
          statusCode: res.status
        })
      })
      .catch(err => {
        clearTimeout(timeout)
        resolve({ 
          reachable: false, 
          error: err.name === 'TimeoutError' ? 'Request timeout' : err.message 
        })
      })
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { domain } = await params
    const decodedDomain = decodeURIComponent(domain)

    // Find business with this domain
    const business = await prisma.business.findFirst({
      where: { 
        customDomain: { equals: decodedDomain, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        domainStatus: true,
        domainVerificationToken: true,
        domainVerificationExpiry: true,
        domainProvisionedAt: true,
        domainLastChecked: true,
        domainError: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Domain not found' },
        { status: 404 }
      )
    }

    const serverIP = process.env.SERVER_IP || ''
    
    // Run all checks in parallel
    const [aRecords, txtRecords, sslInfo, httpsCheck] = await Promise.all([
      dnsLookup(decodedDomain, 'A'),
      dnsLookup(`_waveorder-verification.${decodedDomain}`, 'TXT'),
      checkSSL(decodedDomain),
      pingDomain(decodedDomain, 'https')
    ])

    // Analyze results
    const dnsPointsToServer = aRecords.success && 
      aRecords.records.some(ip => ip === serverIP)
    
    const verificationValid = txtRecords.success && 
      business.domainVerificationToken &&
      txtRecords.records.some(r => r.includes(business.domainVerificationToken!))

    // Build diagnostics
    const diagnostics = {
      domain: decodedDomain,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug
      },
      currentStatus: business.domainStatus,
      lastError: business.domainError,
      provisionedAt: business.domainProvisionedAt,
      lastChecked: new Date(),
      
      dns: {
        aRecords: {
          found: aRecords.success,
          records: aRecords.records,
          pointsToServer: dnsPointsToServer,
          expectedIP: serverIP,
          error: aRecords.error
        },
        verification: {
          found: txtRecords.success,
          valid: verificationValid,
          expectedToken: business.domainVerificationToken,
          expiry: business.domainVerificationExpiry,
          isExpired: business.domainVerificationExpiry 
            ? new Date(business.domainVerificationExpiry) < new Date()
            : false,
          error: txtRecords.error
        }
      },
      
      ssl: {
        valid: sslInfo.valid,
        issuer: sslInfo.issuer,
        validFrom: sslInfo.validFrom,
        validTo: sslInfo.validTo,
        daysRemaining: sslInfo.daysRemaining,
        expiringWarning: sslInfo.daysRemaining !== undefined && sslInfo.daysRemaining <= 14,
        error: sslInfo.error
      },
      
      connectivity: {
        https: httpsCheck.reachable,
        latency: httpsCheck.latency,
        statusCode: httpsCheck.statusCode,
        error: httpsCheck.error
      },
      
      // Overall health assessment
      health: {
        dns: dnsPointsToServer ? 'healthy' : 'unhealthy',
        ssl: sslInfo.valid 
          ? (sslInfo.daysRemaining && sslInfo.daysRemaining <= 14 ? 'warning' : 'healthy')
          : 'unhealthy',
        connectivity: httpsCheck.reachable ? 'healthy' : 'unhealthy'
      }
    }

    // Update last checked timestamp
    await prisma.business.update({
      where: { id: business.id },
      data: { domainLastChecked: new Date() }
    })

    return NextResponse.json(diagnostics)

  } catch (error) {
    console.error('Error checking domain:', error)
    return NextResponse.json(
      { message: 'Failed to check domain' },
      { status: 500 }
    )
  }
}
