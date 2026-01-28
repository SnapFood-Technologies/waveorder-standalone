// lib/trackVisitorSession.ts - Track individual visitor sessions
import { getLocationFromIP, parseUserAgent, extractUTMParams, isPrivateIP, isBot } from './geolocation'
import { PrismaClient } from '@prisma/client'

// Reuse Prisma client - don't create new instance each time
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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
    
    // Skip bot/crawler traffic
    if (isBot(userAgent)) {
      return
    }
    
    // Skip private/bot IPs
    if (ipAddress && isPrivateIP(ipAddress)) {
      return
    }

    // Parse URL to extract UTM parameters and product share ID
    const searchParams = new URL(url).searchParams
    const utmParams = extractUTMParams(searchParams)
    const productShareId = searchParams.get('ps') || undefined // Product share tracking

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
      } catch (geoError) {
        // Silently fail - geolocation is optional
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
        // Product share tracking
        productShareId: productShareId || undefined,
        // Technical metadata
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        // Timestamps
        visitedAt: new Date()
      }
    })
  } catch (error) {
    // Silently fail - we don't want tracking to break the storefront
  }
  // Don't disconnect - reuse connection
}
