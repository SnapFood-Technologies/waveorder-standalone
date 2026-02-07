/**
 * Domain Verification Utilities
 * 
 * DNS verification for custom domain setup using Node.js native dns module.
 */

import dns from 'dns'
import { promisify } from 'util'
import { getVerificationRecordName } from './domain-validation'

// Promisify DNS methods
const resolveTxt = promisify(dns.resolveTxt)
const resolve4 = promisify(dns.resolve4)
const resolveCname = promisify(dns.resolveCname)

// DNS lookup timeout (5 seconds)
const DNS_TIMEOUT = 5000

// Server IP address (should match your Azure VPS IP)
const SERVER_IP = process.env.SERVER_IP || ''

/**
 * Wrap a DNS operation with a timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise])
}

/**
 * Verify TXT record for domain ownership
 * @param domain - The custom domain to verify
 * @param expectedToken - The verification token to look for
 * @returns Verification result
 */
export async function verifyTXTRecord(
  domain: string,
  expectedToken: string
): Promise<{
  verified: boolean
  found: boolean
  records: string[]
  error?: string
}> {
  const recordName = getVerificationRecordName(domain)
  
  try {
    const records = await withTimeout(
      resolveTxt(recordName),
      DNS_TIMEOUT,
      'DNS lookup timed out'
    )
    
    // TXT records are arrays of arrays (each record can have multiple strings)
    const flatRecords = records.map(record => record.join(''))
    const hasToken = flatRecords.some(record => record === expectedToken)
    
    return {
      verified: hasToken,
      found: flatRecords.length > 0,
      records: flatRecords
    }
  } catch (error: any) {
    // ENODATA or ENOTFOUND means no record exists
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return {
        verified: false,
        found: false,
        records: [],
        error: 'Verification TXT record not found'
      }
    }
    
    return {
      verified: false,
      found: false,
      records: [],
      error: error.message || 'Failed to check TXT record'
    }
  }
}

/**
 * Verify A record points to our server
 * @param domain - The custom domain to verify
 * @param expectedIP - Expected IP address (defaults to SERVER_IP env var)
 * @returns Verification result
 */
export async function verifyARecord(
  domain: string,
  expectedIP?: string
): Promise<{
  verified: boolean
  found: boolean
  addresses: string[]
  error?: string
}> {
  const targetIP = expectedIP || SERVER_IP
  
  if (!targetIP) {
    return {
      verified: false,
      found: false,
      addresses: [],
      error: 'Server IP not configured'
    }
  }
  
  try {
    const addresses = await withTimeout(
      resolve4(domain),
      DNS_TIMEOUT,
      'DNS lookup timed out'
    )
    
    const hasCorrectIP = addresses.includes(targetIP)
    
    return {
      verified: hasCorrectIP,
      found: addresses.length > 0,
      addresses
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return {
        verified: false,
        found: false,
        addresses: [],
        error: 'A record not found'
      }
    }
    
    return {
      verified: false,
      found: false,
      addresses: [],
      error: error.message || 'Failed to check A record'
    }
  }
}

/**
 * Verify CNAME record (alternative to A record)
 * @param domain - The custom domain to verify
 * @param expectedTarget - Expected CNAME target (optional)
 * @returns Verification result
 */
export async function verifyCNAMERecord(
  domain: string,
  expectedTarget?: string
): Promise<{
  verified: boolean
  found: boolean
  target: string | null
  error?: string
}> {
  try {
    const records = await withTimeout(
      resolveCname(domain),
      DNS_TIMEOUT,
      'DNS lookup timed out'
    )
    
    const target = records[0] || null
    const verified = expectedTarget 
      ? target?.toLowerCase() === expectedTarget.toLowerCase()
      : !!target
    
    return {
      verified,
      found: !!target,
      target
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      return {
        verified: false,
        found: false,
        target: null,
        error: 'CNAME record not found'
      }
    }
    
    return {
      verified: false,
      found: false,
      target: null,
      error: error.message || 'Failed to check CNAME record'
    }
  }
}

/**
 * Check complete DNS configuration for a custom domain
 * @param domain - The custom domain to check
 * @param verificationToken - The verification token (for TXT record)
 * @returns Complete DNS status
 */
export async function checkDNSConfiguration(
  domain: string,
  verificationToken: string
): Promise<{
  txtVerified: boolean
  aRecordVerified: boolean
  cnameRecordVerified: boolean
  dnsConfigured: boolean
  errors: string[]
  details: {
    txt: { verified: boolean; records: string[] }
    aRecord: { verified: boolean; addresses: string[] }
    cname: { verified: boolean; target: string | null }
  }
}> {
  const errors: string[] = []
  
  // Check all records in parallel
  const [txtResult, aRecordResult, cnameResult] = await Promise.all([
    verifyTXTRecord(domain, verificationToken),
    verifyARecord(domain),
    verifyCNAMERecord(domain)
  ])
  
  if (!txtResult.verified) {
    errors.push(txtResult.error || 'TXT verification record not found or invalid')
  }
  
  // Either A record or CNAME should point to our server
  const domainPointsToUs = aRecordResult.verified || cnameResult.verified
  
  if (!domainPointsToUs) {
    errors.push('Domain does not point to WaveOrder server. Add an A record with our server IP.')
  }
  
  return {
    txtVerified: txtResult.verified,
    aRecordVerified: aRecordResult.verified,
    cnameRecordVerified: cnameResult.verified,
    dnsConfigured: txtResult.verified && domainPointsToUs,
    errors,
    details: {
      txt: { verified: txtResult.verified, records: txtResult.records },
      aRecord: { verified: aRecordResult.verified, addresses: aRecordResult.addresses },
      cname: { verified: cnameResult.verified, target: cnameResult.target }
    }
  }
}

/**
 * Simple check if domain resolves to our server (without full verification)
 * Used for middleware/quick checks
 * @param domain - Domain to check
 * @returns Whether domain points to our server
 */
export async function domainPointsToServer(domain: string): Promise<boolean> {
  try {
    const [aResult, cnameResult] = await Promise.all([
      verifyARecord(domain).catch(() => ({ verified: false })),
      verifyCNAMERecord(domain).catch(() => ({ verified: false }))
    ])
    
    return aResult.verified || cnameResult.verified
  } catch {
    return false
  }
}
