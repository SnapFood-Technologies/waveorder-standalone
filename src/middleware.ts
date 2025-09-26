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
          if (data.businesses[0].setupWizardCompleted) {
            const redirectUrl = `/admin/stores/${data.businesses[0].id}/dashboard`
            return NextResponse.redirect(new URL(redirectUrl, request.url))
          }
        }
      }
    } catch (error) {
      // Fall through to setup redirect
    }
    
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
    
    try {
      const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        
        if (data.businesses?.length > 0) {
          if (data.businesses[0].setupWizardCompleted) {
            const redirectUrl = `/admin/stores/${data.businesses[0].id}/dashboard`
            return NextResponse.redirect(new URL(redirectUrl, request.url))
          }
          
          if (!data.businesses[0].onboardingCompleted) {
            return NextResponse.next()
          }
        }
      }
    } catch (error) {
      // Continue to next()
    }
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