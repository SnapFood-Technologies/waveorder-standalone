// lib/trackVisitorSession.ts - Track individual visitor sessions
import { PrismaClient } from '@prisma/client'
import { getLocationFromIP, parseUserAgent, extractUTMParams } from './geolocation'

const prisma = new PrismaClient()

interface TrackingData {
  ipAddress?: string
  userAgent?: string
  referrer?: string
  url: string
}

/**
 * Extract referrer information
 */
function extractReferrerData(referrer: string | undefined): {
  referrer?: string
  referrerHost?: string
  source?: string
} {
  if (!referrer) {
    return {}
  }

  try {
    const url = new URL(referrer)
    return {
      referrer: referrer,
      referrerHost: url.hostname,
      source: url.hostname // Use hostname as source if no UTM source
    }
  } catch {
    return { referrer }
  }
}

/**
 * Track a visitor session - creates individual record for each visit
 * This function captures IP, location, device info, and UTM parameters
 */
export async function trackVisitorSession(
  businessId: string,
  trackingData: TrackingData
): Promise<void> {
  try {
    const { ipAddress, userAgent, referrer, url } = trackingData
    
    console.log('[trackVisitorSession] Received tracking data:', {
      businessId,
      ipAddress,
      url,
      referrer,
      hasUserAgent: !!userAgent
    })

    // Parse URL to extract UTM parameters
    const searchParams = new URL(url).searchParams
    const utmParams = extractUTMParams(searchParams)
    console.log('[trackVisitorSession] Extracted UTM params:', utmParams)

    // Parse referrer data
    const referrerData = extractReferrerData(referrer)
    console.log('[trackVisitorSession] Extracted referrer data:', referrerData)

    // Determine source (priority: UTM source > referrer host > "direct")
    let source = utmParams.source || referrerData.source || 'direct'
    console.log('[trackVisitorSession] Determined source:', source)

    // Determine medium (if not from UTM)
    let medium = utmParams.medium
    if (!medium && referrerData.referrerHost) {
      // Infer medium from referrer
      const host = referrerData.referrerHost.toLowerCase()
      if (host.includes('google') || host.includes('bing') || host.includes('yahoo')) {
        medium = 'organic'
      } else if (host.includes('facebook') || host.includes('instagram') || host.includes('twitter') || host.includes('linkedin')) {
        medium = 'social'
      } else {
        medium = 'referral'
      }
    }

    // Parse device data from user agent
    const deviceData = userAgent ? parseUserAgent(userAgent) : null

    // Get location from IP (async, non-blocking)
    let locationData = null
    if (ipAddress) {
      try {
        console.log('[trackVisitorSession] Calling getLocationFromIP with IP:', ipAddress)
        locationData = await getLocationFromIP(ipAddress)
        console.log('[trackVisitorSession] getLocationFromIP returned:', locationData)
        if (locationData) {
          console.log(`[VisitorSession] ✅ IP ${ipAddress} resolved to: ${locationData.city}, ${locationData.country}`)
        } else {
          console.warn(`[VisitorSession] ❌ IP ${ipAddress} returned NULL location data`)
        }
      } catch (geoError) {
        console.error('[VisitorSession] ❌ Failed to get location for IP:', ipAddress, geoError)
      }
    } else {
      console.warn('[trackVisitorSession] ⚠️ No IP address provided, skipping geolocation')
    }

    // Create visitor session record
    const sessionData = {
      businessId,
      // UTM parameters
      source: source || 'direct',
      medium: medium || undefined,
      campaign: utmParams.campaign || undefined,
      term: utmParams.term || undefined,
      content: utmParams.content || undefined,
      placement: utmParams.placement || undefined,
      // Referrer
      referrer: referrerData.referrer || undefined,
      referrerHost: referrerData.referrerHost || undefined,
      // Geographic data
      country: locationData?.country || undefined,
      city: locationData?.city || undefined,
      region: locationData?.region || undefined,
      latitude: locationData?.latitude || undefined,
      longitude: locationData?.longitude || undefined,
      // Device data
      deviceType: deviceData?.deviceType || undefined,
      browser: deviceData?.browser || undefined,
      os: deviceData?.os || undefined,
      // Technical metadata
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      // Timestamps
      visitedAt: new Date()
    }
    
    console.log('[trackVisitorSession] Creating session with data:', JSON.stringify(sessionData, null, 2))
    
    await prisma.visitorSession.create({
      data: sessionData
    })

    console.log(`[VisitorSession] ✅ SAVED: business=${businessId}, source=${source}, country=${locationData?.country || 'NONE'}, city=${locationData?.city || 'NONE'}, ip=${ipAddress}`)
  } catch (error) {
    // Log error but don't throw - we don't want tracking to break the storefront
    console.error('Error tracking visitor session:', error)
  } finally {
    await prisma.$disconnect()
  }
}
