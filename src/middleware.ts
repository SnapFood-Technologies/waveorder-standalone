// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  // Protect SuperAdmin routes
  if (pathname.startsWith('/superadmin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && isAuth) {
    if (token.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }

    try {
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
          
          if (business.setupWizardCompleted && business.onboardingCompleted) {
            return NextResponse.redirect(new URL(`/admin/stores/${business.id}/dashboard`, request.url))
          }
        }
      }
    } catch (error) {
      // API failure fallback
    }
    
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // Protect setup route - BLOCK SuperAdmins
  if (pathname.startsWith('/setup')) {
    if (isAuth && token.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }

    const setupToken = request.nextUrl.searchParams.get('token')
  
    if (setupToken) {
      return NextResponse.next()
    }
  
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    return NextResponse.next()
  }

  // Protect admin routes - BLOCK SuperAdmins from accessing business admin
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // NEW: Block SuperAdmins from accessing business admin areas
    if (token.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }
    
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/setup/:path*', '/admin/:path*', '/superadmin/:path*']
}