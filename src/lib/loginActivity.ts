// src/lib/loginActivity.ts
import { prisma } from './prisma'
import { headers } from 'next/headers'

interface DeviceInfo {
  device: string
  browser: string
  location: string
  ipAddress: string
  userAgent: string
}

function parseUserAgent(userAgent: string): { device: string; browser: string } {
  // Detect device
  let device = 'Desktop'
  if (/mobile/i.test(userAgent)) {
    if (/iPad/i.test(userAgent)) {
      device = 'iPad'
    } else if (/iPhone/i.test(userAgent)) {
      device = 'iPhone'
    } else if (/Android/i.test(userAgent)) {
      device = 'Android Device'
    } else {
      device = 'Mobile Device'
    }
  } else if (/tablet/i.test(userAgent)) {
    device = 'Tablet'
  }

  // Detect browser
  let browser = 'Unknown Browser'
  if (/Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent)) {
    browser = 'Chrome'
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = 'Safari'
  } else if (/Firefox/i.test(userAgent)) {
    browser = 'Firefox'
  } else if (/Edge|Edg/i.test(userAgent)) {
    browser = 'Edge'
  } else if (/MSIE|Trident/i.test(userAgent)) {
    browser = 'Internet Explorer'
  }

  return { device, browser }
}

async function getLocationFromIP(ip: string): Promise<string> {
try {
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'Unknown') {
    return 'Local'
    }
    
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
    headers: {
        'User-Agent': 'nodejs'
    },
    cache: 'no-store'
    })
    
    if (!response.ok) {
    return 'Unknown Location'
    }
    
    const data = await response.json()
    
    if (data.city && data.country_name) {
    return `${data.city}, ${data.country_name}`
    } else if (data.country_name) {
    return data.country_name
    }
    
    return 'Unknown Location'
} catch (error) {
    console.error('IP geolocation error:', error)
    return 'Unknown Location'
}
}

export async function trackLoginActivity(userId: string): Promise<void> {
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'Unknown'
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    
    // Get IP address
    let ipAddress = 'Unknown'
    if (forwardedFor) {
      ipAddress = forwardedFor.split(',')[0].trim()
    } else if (realIP) {
      ipAddress = realIP
    }

    // Parse user agent
    const { device, browser } = parseUserAgent(userAgent)
    
    // Get location from IP
    const location = await getLocationFromIP(ipAddress)

    // Store login activity
    await prisma.loginActivity.create({
      data: {
        userId,
        device,
        browser,
        location,
        ipAddress,
        userAgent
      }
    })

    // Clean up old activities (keep last 50)
    const activities = await prisma.loginActivity.findMany({
      where: { userId },
      orderBy: { loginAt: 'desc' },
      select: { id: true }
    })

    if (activities.length > 50) {
      const toDelete = activities.slice(50).map(a => a.id)
      await prisma.loginActivity.deleteMany({
        where: {
          id: { in: toDelete }
        }
      })
    }
  } catch (error) {
    console.error('Failed to track login activity:', error)
    // Don't throw - login should succeed even if tracking fails
  }
}