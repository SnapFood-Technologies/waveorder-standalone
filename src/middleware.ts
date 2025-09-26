// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && isAuth) {
    // PRIORITY 1: Check token data first (instant, no API call needed)
    if (token.businessId && token.setupCompleted && token.onboardingCompleted) {
      return NextResponse.redirect(new URL(`/admin/stores/${token.businessId}/dashboard`, request.url))
    }
    
    // PRIORITY 2: Fallback to API call with delay (handles edge cases)
    try {
      await new Promise(resolve => setTimeout(resolve, 200)) // Small delay for session establishment
      
      const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
      const businessesResponse = await fetch(`${baseUrl}/api/user/businesses`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        
        if (data.businesses?.length > 0) {
          const business = data.businesses[0]
          
          // If setup is complete, go directly to dashboard
          if (business.setupWizardCompleted && business.onboardingCompleted) {
            return NextResponse.redirect(new URL(`/admin/stores/${business.id}/dashboard`, request.url))
          }
        }
      }
    } catch (error) {
      // If API fails, fall back to setup
    }
    
    // PRIORITY 3: Final fallback to setup (safe default)
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // Protect setup route
  if (pathname.startsWith('/setup')) {
    const setupToken = request.nextUrl.searchParams.get('token')
  
    if (setupToken) {
      return NextResponse.next()
    }
  
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    return NextResponse.next()
  }

  // Simple auth protection for admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/setup/:path*', '/admin/:path*']
}