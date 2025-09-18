import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && isAuth) {
    // Check if user has businesses
    try {
      const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
        headers: {
          'Authorization': `Bearer ${token.sub}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        if (data.businesses?.length > 0) {
          if (data.businesses[0].setupWizardCompleted) {
          return NextResponse.redirect(new URL(`/admin/stores/${data.businesses[0].id}/dashboard`, request.url))
          }
        }
      }
    } catch (error) {
      console.error('Error checking businesses:', error)
    }
    
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // Protect setup route - only for authenticated users without businesses
  if (pathname.startsWith('/setup')) {

    const setupToken = request.nextUrl.searchParams.get('token')
  
  // Allow access if there's a valid setup token (even without auth session)
  if (setupToken) {
    return NextResponse.next()
  }
  
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    // Check if user already has businesses - if so, redirect to dashboard
    try {
      const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
        headers: {
          'Authorization': `Bearer ${token.sub}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        if (data.businesses?.length > 0) {
          if (data.businesses[0].setupWizardCompleted) {
            return NextResponse.redirect(new URL(`/admin/stores/${data.businesses[0].id}/dashboard`, request.url))
          }
        }
      }
    } catch (error) {
      console.error('Error checking businesses:', error)
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/setup/:path*', '/admin/:path*']
}