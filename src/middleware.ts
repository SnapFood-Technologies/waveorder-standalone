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
    console.log('🔍 Checking business access for businessId:', businessId)
    const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
      headers: {
        'Authorization': `Bearer ${token.sub}`,
        'Cookie': request.headers.get('cookie') || ''
      }
    })
    
    console.log('📡 Business access response status:', businessesResponse.status)
    
    if (businessesResponse.ok) {
      const data = await businessesResponse.json()
      console.log('📊 Business access data:', JSON.stringify(data, null, 2))
      const hasAccess = data.businesses?.some((business: any) => business.id === businessId)
      console.log('✅ Has access:', hasAccess)
      return { hasAccess, userBusinesses: data.businesses }
    }
    
    return { hasAccess: false }
  } catch (error) {
    console.error('❌ Error checking business access:', error)
    return { hasAccess: false }
  }
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const pathname = request.nextUrl.pathname

  console.log('🚀 ==> MIDDLEWARE START <==')
  console.log('🔗 Pathname:', pathname)
  console.log('🔐 IsAuth:', isAuth)

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth') && isAuth) {
    console.log('🔀 Processing auth redirect...')
    try {
      const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
        headers: {
          'Authorization': `Bearer ${token.sub}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      console.log('📡 Auth redirect - businesses response status:', businessesResponse.status)
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        console.log('📊 Auth redirect - businesses data:', JSON.stringify(data, null, 2))
        
        if (data.businesses?.length > 0) {
          console.log('✨ Setup wizard completed:', data.businesses[0].setupWizardCompleted)
          if (data.businesses[0].setupWizardCompleted) {
            const redirectUrl = `/admin/stores/${data.businesses[0].id}/dashboard`
            console.log('🎯 Redirecting to:', redirectUrl)
            return NextResponse.redirect(new URL(redirectUrl, request.url))
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking businesses:', error)
    }
    
    console.log('🔄 Redirecting to setup')
    // return NextResponse.redirect(new URL('/setup', request.url))
  }

  // Protect setup route
  if (pathname.startsWith('/setup')) {
    console.log('🛠️ Processing setup route...')
    const setupToken = request.nextUrl.searchParams.get('token')
    console.log('🎫 Setup token:', setupToken ? 'present' : 'not present')
  
    if (setupToken) {
      console.log('✅ Setup token present, allowing access')
      return NextResponse.next()
    }
  
    if (!isAuth) {
      console.log('🚫 Not authenticated, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    
    try {
      const businessesResponse = await fetch(`${request.nextUrl.origin}/api/user/businesses`, {
        headers: {
          'Authorization': `Bearer ${token.sub}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      console.log('📡 Setup - businesses response status:', businessesResponse.status)
      
      if (businessesResponse.ok) {
        const data = await businessesResponse.json()
        console.log('📊 Setup - businesses data:', JSON.stringify(data, null, 2))
        
        if (data.businesses?.length > 0) {
          // Check if setup is already completed
          console.log('🔍 Setup wizard completed:', data.businesses[0].setupWizardCompleted)
          if (data.businesses[0].setupWizardCompleted) {
            const redirectUrl = `/admin/stores/${data.businesses[0].id}/dashboard`
            console.log('🎯 Setup complete, redirecting to:', redirectUrl)
            return NextResponse.redirect(new URL(redirectUrl, request.url))
          }
          // If onboarding is not completed, stay on setup
          console.log('🔍 Onboarding completed:', data.businesses[0].onboardingCompleted)
          if (!data.businesses[0].onboardingCompleted) {
            console.log('⏳ Onboarding not complete, staying on setup')
            return NextResponse.next()
          }
        }
      }
    } catch (error) {
      console.error('❌ Error checking businesses in setup:', error)
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    console.log('👑 Processing admin route...')
    
    if (!isAuth) {
      console.log('🚫 Not authenticated for admin, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const businessId = getBusinessIdFromPath(pathname)
    console.log('🏢 Business ID from path:', businessId)
    
    if (businessId) {
      // Check if user has access to this business
      const { hasAccess, userBusinesses } = await checkBusinessAccess(request, token, businessId)
      
      if (!hasAccess) {
        console.log('🚫 No access to business')
        // Redirect to their actual business or setup if they have none
        if (userBusinesses && userBusinesses.length > 0) {
          const userBusiness = userBusinesses[0]
          console.log('🔄 Redirecting to user\'s business:', JSON.stringify(userBusiness, null, 2))
          
          // If their business setup is not completed, redirect to setup
          if (!userBusiness.setupWizardCompleted || !userBusiness.onboardingCompleted) {
            console.log('🛠️ User business setup incomplete, redirecting to setup -- bugy')
            return NextResponse.redirect(new URL('/setup', request.url))
          }
          
          // Otherwise redirect to their business dashboard
          const redirectUrl = `/admin/stores/${userBusiness.id}/dashboard`
          console.log('🎯 Redirecting to user business dashboard:', redirectUrl)
          return NextResponse.redirect(new URL(redirectUrl, request.url))
        } else {
          // No businesses found, redirect to setup
          console.log('🚫 No businesses found, redirecting to setup')
          // return NextResponse.redirect(new URL('/setup', request.url))
        }
      }

      // User has access to the business, now check if they need to complete setup
      console.log('🔍 === SETUP CHECK DEBUG ===')
      console.log('🆔 BusinessId from URL:', businessId)
      console.log('📋 UserBusinesses:', JSON.stringify(userBusinesses, null, 2))
      
      if (userBusinesses && userBusinesses.length > 0) {
        const currentBusiness = userBusinesses.find((b: any) => b.id === businessId)
        console.log('🎯 Found currentBusiness:', JSON.stringify(currentBusiness, null, 2))
        
        if (currentBusiness) {
          console.log('✨ Setup wizard completed:', currentBusiness.setupWizardCompleted)
          console.log('🎓 Onboarding completed:', currentBusiness.onboardingCompleted)
          console.log('❓ Should redirect to setup:', !currentBusiness.setupWizardCompleted || !currentBusiness.onboardingCompleted)
        }
        
        if (currentBusiness && (!currentBusiness.setupWizardCompleted || !currentBusiness.onboardingCompleted)) {
          console.log('🚨 REDIRECTING TO SETUP -- working')
          return NextResponse.redirect(new URL('/setup', request.url))
        }
        console.log('✅ NOT REDIRECTING TO SETUP')
      }

      // Check subscription plan for PRO routes
      if (requiresProSubscription(pathname)) {
        console.log('💎 Checking PRO subscription for route:', pathname)
        try {
          // Check business subscription plan
          const businessResponse = await fetch(`${request.nextUrl.origin}/api/businesses/${businessId}/subscription`, {
            headers: {
              'Authorization': `Bearer ${token.sub}`,
              'Cookie': request.headers.get('cookie') || ''
            }
          })
          
          console.log('📡 Subscription response status:', businessResponse.status)
          
          if (businessResponse.ok) {
            const businessData = await businessResponse.json()
            console.log('📊 Subscription data:', JSON.stringify(businessData, null, 2))
            
            // If business doesn't have PRO plan, redirect to dashboard
            if (businessData.subscriptionPlan !== 'PRO') {
              console.log('🚫 Not PRO plan, redirecting to dashboard')
              return NextResponse.redirect(new URL(`/admin/stores/${businessId}/dashboard`, request.url))
            }
          } else {
            // If we can't verify subscription, redirect to dashboard
            console.log('❌ Cannot verify subscription, redirecting to dashboard')
            return NextResponse.redirect(new URL(`/admin/stores/${businessId}/dashboard`, request.url))
          }
        } catch (error) {
          console.error('❌ Error checking subscription:', error)
          // Fail safely - redirect to dashboard
          console.log('🛡️ Failing safely, redirecting to dashboard')
          return NextResponse.redirect(new URL(`/admin/stores/${businessId}/dashboard`, request.url))
        }
      }
    }
  }

  console.log('✅ === MIDDLEWARE END - Next() ===')
  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/setup/:path*', '/admin/:path*']
}