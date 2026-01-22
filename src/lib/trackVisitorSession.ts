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

    // Parse URL to extract UTM parameters
    const searchParams = new URL(url).searchParams
    const utmParams = extractUTMParams(searchParams)

    // Parse referrer data
    const referrerData = extractReferrerData(referrer)

    // Determine source (priority: UTM source > referrer host > "direct")
    let source = utmParams.source || referrerData.source || 'direct'

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
        locationData = await getLocationFromIP(ipAddress)
        if (locationData) {
          console.log(`[VisitorSession] IP ${ipAddress} resolved to: ${locationData.city}, ${locationData.country}`)
        }
      } catch (geoError) {
        console.warn('[VisitorSession] Failed to get location for IP:', ipAddress, geoError)
      }
    }

    // Create visitor session record
    await prisma.visitorSession.create({
      data: {
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
    })

    console.log(`[VisitorSession] Tracked visit for business ${businessId} from source: ${source}`)
  } catch (error) {
    // Log error but don't throw - we don't want tracking to break the storefront
    console.error('Error tracking visitor session:', error)
  } finally {
    await prisma.$disconnect()
  }
}
