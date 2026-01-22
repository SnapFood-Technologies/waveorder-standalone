// lib/analytics.ts - Utility function for tracking views with geographic and UTM data
import { PrismaClient } from '@prisma/client'
import { getLocationFromIP, parseUserAgent, extractUTMParams, type LocationData, type DeviceData } from './geolocation'

const prisma = new PrismaClient()

interface TrackingData {
  ipAddress?: string
  userAgent?: string
  referrer?: string
  location?: LocationData | null
  device?: DeviceData | null
  utmParams?: {
    source?: string
    campaign?: string
    medium?: string
    term?: string
    content?: string
    placement?: string
  }
}

/**
 * Track a business view with enhanced analytics data
 * This function captures IP, location, device info, and UTM parameters
 */
export async function trackBusinessView(
  businessId: string,
  trackingData?: TrackingData
): Promise<void> {
  try {
    // Get today's date in YYYY-MM-DD format (normalized to start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Try to find existing analytics record for today
    const existingAnalytics = await prisma.analytics.findUnique({
      where: {
        businessId_date: {
          businessId: businessId,
          date: today
        }
      }
    }) as any // Type assertion needed until Prisma types are regenerated after schema update

    // Prepare update data
    const updateData: any = {
      visitors: {
        increment: 1
      },
      updatedAt: new Date()
    }

    // Add geographic data if available (only update if not already set or if new data is more specific)
    if (trackingData?.location) {
      const loc = trackingData.location
      // Only update if existing record doesn't have location data, or if new data is more complete
      if (!existingAnalytics?.country || (loc.country && !existingAnalytics.country)) {
        if (loc.country) updateData.country = loc.country
        if (loc.city) updateData.city = loc.city
        if (loc.region) updateData.region = loc.region
        if (loc.latitude !== null) updateData.latitude = loc.latitude
        if (loc.longitude !== null) updateData.longitude = loc.longitude
      }
    }

    // Add device data if available
    if (trackingData?.device) {
      const dev = trackingData.device
      if (!existingAnalytics?.deviceType || (dev.deviceType && !existingAnalytics.deviceType)) {
        updateData.deviceType = dev.deviceType
        updateData.browser = dev.browser
        updateData.os = dev.os
      }
    }

    // Add UTM parameters if available
    if (trackingData?.utmParams) {
      const utm = trackingData.utmParams
      if (utm.source && (!existingAnalytics?.source || existingAnalytics.source !== utm.source)) {
        updateData.source = utm.source
      }
      if (utm.campaign && (!existingAnalytics?.campaign || existingAnalytics.campaign !== utm.campaign)) {
        updateData.campaign = utm.campaign
      }
      if (utm.medium && (!existingAnalytics?.medium || existingAnalytics.medium !== utm.medium)) {
        updateData.medium = utm.medium
      }
      if (utm.term && (!existingAnalytics?.term || existingAnalytics.term !== utm.term)) {
        updateData.term = utm.term
      }
      if (utm.content && (!existingAnalytics?.content || existingAnalytics.content !== utm.content)) {
        updateData.content = utm.content
      }
      if (utm.placement && (!existingAnalytics?.placement || existingAnalytics.placement !== utm.placement)) {
        updateData.placement = utm.placement
      }
    }

    // Add technical metadata
    if (trackingData?.ipAddress && (!existingAnalytics?.ipAddress || existingAnalytics.ipAddress === 'Unknown')) {
      updateData.ipAddress = trackingData.ipAddress
    }
    if (trackingData?.referrer && (!existingAnalytics?.referrer || !existingAnalytics.referrer)) {
      updateData.referrer = trackingData.referrer
    }
    if (trackingData?.userAgent && (!existingAnalytics?.userAgent || !existingAnalytics.userAgent)) {
      updateData.userAgent = trackingData.userAgent
    }

    if (existingAnalytics) {
      // Update existing record
      await prisma.analytics.update({
        where: {
          id: existingAnalytics.id
        },
        data: updateData
      })
    } else {
      // Create new analytics record for today
      await (prisma.analytics.create as any)({
        data: {
          businessId: businessId,
          date: today,
          visitors: 1,
          orders: 0,
          revenue: 0,
          // Geographic data
          country: trackingData?.location?.country || null,
          city: trackingData?.location?.city || null,
          region: trackingData?.location?.region || null,
          latitude: trackingData?.location?.latitude || null,
          longitude: trackingData?.location?.longitude || null,
          ipAddress: trackingData?.ipAddress || null,
          // Device data
          deviceType: trackingData?.device?.deviceType || null,
          browser: trackingData?.device?.browser || null,
          os: trackingData?.device?.os || null,
          // UTM parameters
          source: trackingData?.utmParams?.source || null,
          campaign: trackingData?.utmParams?.campaign || null,
          medium: trackingData?.utmParams?.medium || null,
          term: trackingData?.utmParams?.term || null,
          content: trackingData?.utmParams?.content || null,
          placement: trackingData?.utmParams?.placement || null,
          // Technical metadata
          referrer: trackingData?.referrer || null,
          userAgent: trackingData?.userAgent || null
        }
      })
    }
  } catch (error) {
    // Log error but don't throw - we don't want view tracking to break the storefront
    console.error('Error tracking business view:', error)
  } finally {
    await prisma.$disconnect()
  }
}