// lib/geolocation.ts - Enhanced IP geolocation utilities

export interface LocationData {
  country: string | null
  city: string | null
  region: string | null
  latitude: number | null
  longitude: number | null
}

export interface DeviceData {
  deviceType: 'mobile' | 'desktop' | 'tablet'
  browser: string
  os: string
}

/**
 * Parse User-Agent string to extract device information
 */
export function parseUserAgent(userAgent: string): DeviceData {
  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    if (/ipad/i.test(ua)) {
      deviceType = 'tablet'
    } else {
      deviceType = 'mobile'
    }
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet'
  }

  // Detect browser
  let browser = 'Unknown'
  if (/chrome/i.test(ua) && !/edge|edg|opr/i.test(ua)) {
    browser = 'Chrome'
  } else if (/safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)) {
    browser = 'Safari'
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox'
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge'
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera'
  } else if (/msie|trident/i.test(ua)) {
    browser = 'Internet Explorer'
  }

  // Detect OS
  let os = 'Unknown'
  if (/windows/i.test(ua)) {
    os = 'Windows'
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS'
  } else if (/linux/i.test(ua)) {
    os = 'Linux'
  } else if (/android/i.test(ua)) {
    os = 'Android'
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS'
  }

  return {
    deviceType,
    browser,
    os
  }
}

/**
 * Check if IP address is private/local or a known bot/crawler IP
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip || ip === 'Unknown' || ip === 'unknown') return true
  
  // Localhost
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') return true
  
  // Private IP ranges
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return true
  
  // IPv6 local
  if (ip.startsWith('fe80:') || ip.startsWith('::')) return true
  
  // Known bot/crawler IPs (Microsoft Azure bots, etc.)
  // Microsoft Azure crawler IPs (Boydton, Virginia data center)
  if (ip.startsWith('20.84.') || ip.startsWith('40.76.') || ip.startsWith('52.167.')) return true
  
  return false
}

/**
 * Check if a User-Agent is a known bot/crawler
 */
export function isBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false
  
  const ua = userAgent.toLowerCase()
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python-requests',
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'slack',
    'googlebot', 'bingbot', 'yandex', 'baiduspider', 'duckduckbot',
    'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot', 'rogerbot'
  ]
  
  return botPatterns.some(pattern => ua.includes(pattern))
}

/**
 * Get location data from IP address using ipapi.co (primary) and ip-api.com (fallback)
 * Returns structured location data or null if unavailable
 */
export async function getLocationFromIP(ip: string): Promise<LocationData | null> {
  try {
    console.log('[Geolocation] Starting lookup for IP:', ip)
    
    // Skip private/local IPs
    if (isPrivateIP(ip)) {
      console.warn('[Geolocation] ⚠️ IP is private/local, skipping:', ip)
      return null
    }

    console.log('[Geolocation] ✅ IP is public, proceeding with lookup')

    // Primary: Try ipapi.co
    try {
      console.log('[Geolocation] Trying PRIMARY service: ipapi.co')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const url = `https://ipapi.co/${ip}/json/`
      console.log('[Geolocation] Fetching:', url)
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WaveOrder Analytics',
          'Accept': 'application/json'
        },
        signal: controller.signal,
        cache: 'no-store'
      })
      
      clearTimeout(timeoutId)
      
      console.log('[Geolocation] ipapi.co response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Geolocation] ipapi.co RAW response:', JSON.stringify(data, null, 2))
        
        // Check for errors in response
        if (data.error) {
          throw new Error(`ipapi.co error: ${data.reason || 'Unknown error'}`)
        }
        
        const locationData = {
          country: data.country_name || null,
          city: data.city || null,
          region: data.region || data.region_code || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null
        }
        
        console.log('[Geolocation] ✅ ipapi.co SUCCESS:', locationData)
        return locationData
      }
    } catch (primaryError: any) {
      // If timeout or network error, try fallback
      console.error('[Geolocation] ❌ PRIMARY service failed:', primaryError.message)
      if (primaryError.name === 'AbortError' || primaryError.message.includes('fetch')) {
        console.warn('[Geolocation] Trying FALLBACK service...')
      } else {
        throw primaryError
      }
    }

    // Fallback: Try ip-api.com
    try {
      console.log('[Geolocation] Trying FALLBACK service: ip-api.com')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const url = `http://ip-api.com/json/${ip}?fields=status,message,country,city,regionName,lat,lon`
      console.log('[Geolocation] Fetching:', url)
      
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store'
      })
      
      clearTimeout(timeoutId)
      
      console.log('[Geolocation] ip-api.com response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Geolocation] ip-api.com RAW response:', JSON.stringify(data, null, 2))
        
        if (data.status === 'success') {
          const locationData = {
            country: data.country || null,
            city: data.city || null,
            region: data.regionName || null,
            latitude: data.lat || null,
            longitude: data.lon || null
          }
          
          console.log('[Geolocation] ✅ ip-api.com SUCCESS:', locationData)
          return locationData
        } else {
          console.error('[Geolocation] ❌ ip-api.com returned failure:', data.message)
        }
      }
    } catch (fallbackError: any) {
      console.error('[Geolocation] ❌ FALLBACK service also failed:', fallbackError.message)
    }

    // Both services failed
    console.error('[Geolocation] ❌ ALL geolocation services failed for IP:', ip)
    return null
  } catch (error: any) {
    console.error('[Geolocation] Error getting location from IP:', error.message)
    return null
  }
}

/**
 * Extract UTM parameters and other query parameters from URL
 */
export function extractUTMParams(searchParams: URLSearchParams): {
  source?: string
  campaign?: string
  medium?: string
  term?: string
  content?: string
  placement?: string
} {
  return {
    source: searchParams.get('source') || searchParams.get('utm_source') || undefined,
    campaign: searchParams.get('campaign') || searchParams.get('utm_campaign') || undefined,
    medium: searchParams.get('medium') || searchParams.get('utm_medium') || undefined,
    term: searchParams.get('term') || searchParams.get('utm_term') || undefined,
    content: searchParams.get('content') || searchParams.get('utm_content') || undefined,
    placement: searchParams.get('placement') || undefined
  }
}
