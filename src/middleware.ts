// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname
  console.log('pathname', pathname)

  // Check for impersonation
  const isImpersonating = request.nextUrl.searchParams.get('impersonate') === 'true'
  const impersonateBusinessId = request.nextUrl.searchParams.get('businessId')

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

  // EXCEPTION: Allow authenticated users to access email verification pages
  // They need to verify their email change even if they're logged in
  if (pathname.startsWith('/auth/verify-email-change')) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from other auth pages
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

  // MUST BE BEFORE /setup CHECK - Allow /setup-password with token only
  if (pathname.startsWith('/setup-password')) {
    const setupToken = request.nextUrl.searchParams.get('token')
    if (!setupToken) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  //  Allow /team/invite with token (unauthenticated access)
  if (pathname.startsWith('/team/invite/')) {
    // Allow anyone to access invitation page (they're not logged in yet)
    return NextResponse.next()
  }
  
  // Protect setup route - Require auth (no token allowed anymore)
  if (pathname.startsWith('/setup')) {
    // Block SuperAdmins
    if (isAuth && token.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }
  
    // Require authentication (no token access)
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    return NextResponse.next()
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (token.role === 'SUPER_ADMIN') {
      const pathBusinessId = pathname.split('/')[3] // /admin/stores/{businessId}/...
      
      if (isImpersonating && impersonateBusinessId) {
        
        if (pathBusinessId === impersonateBusinessId) {
          const response = NextResponse.next()
          
          response.cookies.set('impersonating', impersonateBusinessId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60
          })
          
          return response
        }
      }
      
      return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
    }
    
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/auth/:path*', 
    '/setup-password/:path*', 
    '/team/invite/:path*',
    '/setup/:path*', 
    '/admin/:path*', 
    '/superadmin/:path*'
  ]
}