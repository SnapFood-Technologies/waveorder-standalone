// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Define PRO-only routes
const PRO_ROUTES = [
  '/admin/stores/[id]/inventory',
  '/admin/stores/[id]/discounts', 
  '/admin/stores/[id]/analytics',
  '/admin/stores/[id]/team',
  '/admin/stores/[id]/domains'
]

// Helper function to check if route requires PRO subscription
function requiresProSubscription(pathname: string): boolean {
  return PRO_ROUTES.some(route => {
    // Convert route pattern to regex
    const pattern = route.replace(/\[id\]/g, '[^/]+')
    const regex = new RegExp(`^${pattern}`)
    return regex.test(pathname)
  })
}

// Helper function to get business ID from pathname
function getBusinessIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/admin\/stores\/([^\/]+)/)
  return match ? match[1] : null
}

// Helper function to check if user has access to business
async function checkBusinessAccess(
  request: NextRequest, 
  token: any, 
  businessId: string
): Promise<{ hasAccess: boolean; userBusinesses?: any[] }> {
  try {
    const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
      headers: {
        'Authorization': `Bearer ${token.sub}`,
        'Cookie': request.headers.get('cookie') || ''
      }
    })
    
    if (businessesResponse.ok) {
      const data = await businessesResponse.json()
      const hasAccess = data.businesses?.some((business: any) => business.id === businessId)
      return { hasAccess, userBusinesses: data.businesses }
    }
    
    return { hasAccess: false }
  } catch (error) {
    console.error('Error checking business access:', error)
    return { hasAccess: false }
  }
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && isAuth) {
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
          'Authorization': `Bearer ${token.sub}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        if (data.businesses?.length > 0) {
          // Check if setup is already completed
          if (data.businesses[0].setupWizardCompleted) {
            return NextResponse.redirect(new URL(`/admin/stores/${data.businesses[0].id}/dashboard`, request.url))
          }
          // If onboarding is not completed, stay on setup
          if (!data.businesses[0].onboardingCompleted) {
            return NextResponse.next()
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

    const businessId = getBusinessIdFromPath(pathname)
    
    if (businessId) {
      // Check if user has access to this business
      const { hasAccess, userBusinesses } = await checkBusinessAccess(request, token, businessId)
      
      if (!hasAccess) {
        // Redirect to their actual business or setup if they have none
        if (userBusinesses && userBusinesses.length > 0) {
          const userBusiness = userBusinesses[0]
          
          // If their business setup is not completed, redirect to setup
          if (!userBusiness.setupWizardCompleted || !userBusiness.onboardingCompleted) {
            return NextResponse.redirect(new URL('/setup', request.url))
          }
          
          // Otherwise redirect to their business dashboard
          return NextResponse.redirect(new URL(`/admin/stores/${userBusiness.id}/dashboard`, request.url))
        } else {
          // No businesses found, redirect to setup
          return NextResponse.redirect(new URL('/setup', request.url))
        }
      }

      // User has access to the business, now check if they need to complete setup
      if (userBusinesses && userBusinesses.length > 0) {
        const currentBusiness = userBusinesses.find((b: any) => b.id === businessId)
        if (currentBusiness && (!currentBusiness.setupWizardCompleted || !currentBusiness.onboardingCompleted)) {
          return NextResponse.redirect(new URL('/setup', request.url))
        }
      }

      // Check subscription plan for PRO routes
      if (requiresProSubscription(pathname)) {
        try {
          // Check business subscription plan
          const businessResponse = await fetch(`${request.nextUrl.origin}/api/businesses/${businessId}/subscription`, {
            headers: {
              'Authorization': `Bearer ${token.sub}`,
              'Cookie': request.headers.get('cookie') || ''
            }
          })
          
          if (businessResponse.ok) {
            const businessData = await businessResponse.json()
            
            // If business doesn't have PRO plan, redirect to dashboard
            if (businessData.subscriptionPlan !== 'PRO') {
              return NextResponse.redirect(new URL(`/admin/stores/${businessId}/dashboard`, request.url))
            }
          } else {
            // If we can't verify subscription, redirect to dashboard
            return NextResponse.redirect(new URL(`/admin/stores/${businessId}/dashboard`, request.url))
          }
        } catch (error) {
          console.error('Error checking subscription:', error)
          // Fail safely - redirect to dashboard
          return NextResponse.redirect(new URL(`/admin/stores/${businessId}/dashboard`, request.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/setup/:path*', '/admin/:path*']
}