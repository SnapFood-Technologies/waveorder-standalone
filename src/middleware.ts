// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && isAuth) {
    try {
      const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
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
      // Only on API failure, fall back to setup
    }
    
    // Only redirect to setup if setup is actually incomplete or API failed
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

  // Protect admin routes - check auth and setup completion
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        
        if (data.businesses?.length === 0) {
          return NextResponse.redirect(new URL('/setup', request.url))
        }
        
        const business = data.businesses[0]
        if (!business.setupWizardCompleted || !business.onboardingCompleted) {
          return NextResponse.redirect(new URL('/setup', request.url))
        }
      } else {
        return NextResponse.redirect(new URL('/setup', request.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
    
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/setup/:path*', '/admin/:path*']
}