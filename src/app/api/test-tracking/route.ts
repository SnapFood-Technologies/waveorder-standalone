// Test endpoint to verify IP detection and geolocation
import { NextRequest, NextResponse } from 'next/server'
import { getLocationFromIP, parseUserAgent, extractUTMParams } from '@/lib/geolocation'

export async function GET(request: NextRequest) {
  const logs: string[] = []
  
  try {
    // Extract IP
    logs.push('=== IP EXTRACTION ===')
    logs.push(`cf-connecting-ip: ${request.headers.get('cf-connecting-ip')}`)
    logs.push(`x-real-ip: ${request.headers.get('x-real-ip')}`)
    logs.push(`x-forwarded-for: ${request.headers.get('x-forwarded-for')}`)
    
    let ipAddress: string | undefined
    const cfIP = request.headers.get('cf-connecting-ip')
    if (cfIP) {
      ipAddress = cfIP.trim()
      logs.push(`Using Cloudflare IP: ${ipAddress}`)
    } else {
      const realIP = request.headers.get('x-real-ip')
      if (realIP) {
        ipAddress = realIP.trim()
        logs.push(`Using x-real-ip: ${ipAddress}`)
      } else {
        const forwardedFor = request.headers.get('x-forwarded-for')
        if (forwardedFor) {
          const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(ip => ip)
          ipAddress = ips.length > 0 ? ips[0] : undefined
          logs.push(`x-forwarded-for chain: ${ips.join(', ')}`)
          logs.push(`Using FIRST IP: ${ipAddress}`)
        }
      }
    }
    
    if (!ipAddress) {
      // @ts-ignore
      ipAddress = request.ip || undefined
      logs.push(`Using request.ip fallback: ${ipAddress}`)
    }
    
    logs.push(`FINAL IP: ${ipAddress}`)
    
    // Test geolocation
    logs.push('\n=== GEOLOCATION TEST ===')
    if (ipAddress) {
      const location = await getLocationFromIP(ipAddress)
      logs.push(`Location result: ${JSON.stringify(location, null, 2)}`)
    } else {
      logs.push('No IP address to lookup')
    }
    
    // Test UTM params
    logs.push('\n=== UTM PARAMS TEST ===')
    const { searchParams } = new URL(request.url)
    const utmParams = extractUTMParams(searchParams)
    logs.push(`UTM params: ${JSON.stringify(utmParams, null, 2)}`)
    
    // Test User Agent
    logs.push('\n=== USER AGENT TEST ===')
    const userAgent = request.headers.get('user-agent')
    const deviceData = userAgent ? parseUserAgent(userAgent) : null
    logs.push(`Device data: ${JSON.stringify(deviceData, null, 2)}`)
    
    return NextResponse.json({
      success: true,
      ipAddress,
      logs: logs.join('\n')
    })
    
  } catch (error: any) {
    logs.push(`\n=== ERROR ===`)
    logs.push(error.message)
    logs.push(error.stack)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      logs: logs.join('\n')
    }, { status: 500 })
  }
}
