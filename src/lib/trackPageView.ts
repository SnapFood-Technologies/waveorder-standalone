// lib/trackPageView.ts - Track legal page views with geolocation
import { getLocationFromIP, parseUserAgent, isPrivateIP, isBot } from './geolocation'
import { PrismaClient } from '@prisma/client'

// Reuse Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

interface PageViewTrackingData {
  businessId: string
  pageId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
}

/**
 * Track a legal page view with geolocation
 * Similar to trackVisitorSession but for legal pages
 */
export async function trackPageView(
  trackingData: PageViewTrackingData
): Promise<void> {
  try {
    const { businessId, pageId, ipAddress, userAgent, referrer } = trackingData
    
    // Skip bot/crawler traffic
    if (userAgent && isBot(userAgent)) {
      return
    }
    
    // Skip private/bot IPs
    if (ipAddress && isPrivateIP(ipAddress)) {
      return
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

    // Create page view record
    await prisma.storePageView.create({
      data: {
        businessId,
        pageId,
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
        referrer: referrer || undefined,
      }
    })

    // Also increment the simple counter (for backward compatibility)
    await prisma.storePage.update({
      where: { id: pageId },
      data: { views: { increment: 1 } },
    })
  } catch (error) {
    // Silently fail - we don't want tracking to break the page
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracking page view:', error)
    }
  }
}
