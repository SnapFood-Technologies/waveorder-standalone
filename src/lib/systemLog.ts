// lib/systemLog.ts - System logging for errors, 404s, and system events
import { getLocationFromIP, isPrivateIP, isBot } from './geolocation'
import { PrismaClient } from '@prisma/client'

// Reuse Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export type LogType = 'storefront_404' | 'storefront_error' | 'products_error' | 'system_error' | 'storefront_success' | 'order_created' | 'order_error' | 'order_validation_error' | 'appointment_created' | 'appointment_error' | 'appointment_validation_error' | 'service_request_created' | 'service_request_error' | 'trial_error' | 'trial_started' | 'subscription_error' | 'admin_action' | 'product_created' | 'product_updated' | 'onboarding_step_completed' | 'onboarding_step_error' | 'onboarding_completed' | 'integration_api_call' | 'user_registered' | 'user_login' | 'subscription_changed' | 'password_reset_requested' | 'password_reset_completed' | 'password_reset_error' | 'order_status_changed' | 'appointment_status_changed' | 'twilio_message_sent' | 'twilio_message_error'
export type LogSeverity = 'error' | 'warning' | 'info'

interface SystemLogData {
  logType: LogType
  severity: LogSeverity
  slug?: string
  businessId?: string
  endpoint: string
  method: string
  statusCode?: number
  errorMessage?: string  // Message for the log (also used for admin actions)
  errorStack?: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  url: string
  metadata?: Record<string, any>
}

/**
 * Extract IP address from request headers
 */
export function extractIPAddress(request: Request): string | undefined {
  const headers = (request as any).headers || new Headers()
  
  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP.trim()
  }
  
  // Vercel/other proxies - x-real-ip is usually the client IP
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // x-forwarded-for - FIRST IP in chain is the original client
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim()).filter((ip: string) => ip)
    // Use FIRST IP (original client), not last (which is the final proxy/CDN)
    return ips.length > 0 ? ips[0] : undefined
  }
  
  return undefined
}

/**
 * Log system events (errors, 404s, etc.)
 * Runs async in background to not block requests
 */
export async function logSystemEvent(data: SystemLogData): Promise<void> {
  try {
    const { ipAddress, userAgent } = data
    
    // Skip bot/crawler traffic for error logs (but log 404s from bots)
    if (data.logType !== 'storefront_404' && userAgent && isBot(userAgent)) {
      return
    }
    
    // Skip private/bot IPs for error logs (but log 404s)
    if (data.logType !== 'storefront_404' && ipAddress && isPrivateIP(ipAddress)) {
      return
    }

    // Get location from IP (async, non-blocking)
    let locationData = null
    if (ipAddress && !isPrivateIP(ipAddress)) {
      try {
        locationData = await getLocationFromIP(ipAddress)
      } catch (geoError) {
        // Silently fail - geolocation is optional
      }
    }

    // Create system log record
    await prisma.systemLog.create({
      data: {
        logType: data.logType,
        severity: data.severity,
        slug: data.slug,
        businessId: data.businessId,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        errorMessage: data.errorMessage,
        errorStack: data.errorStack,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        referrer: data.referrer || undefined,
        url: data.url,
        country: locationData?.country || undefined,
        city: locationData?.city || undefined,
        region: locationData?.region || undefined,
        metadata: data.metadata || undefined
      }
    })
  } catch (error) {
    // Silently fail - we don't want logging to break the application
    // But log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logging system event:', error)
    }
  }
}
