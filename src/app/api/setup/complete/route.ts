// app/api/setup/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { sendTeamInvitationEmail } from '@/lib/email'
import { authOptions } from '@/lib/auth'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'


export async function POST(request: NextRequest) {
  try {
    const { setupToken } = await request.json()
    
    let user = null

    // Try to get user via session first
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
    }
    
    // If no session, try setup token
    if (!user && setupToken) {
      user = await prisma.user.findFirst({
        where: {
          setupToken: setupToken,
          setupExpiry: {
            gt: new Date()
          }
        }
      })
    }

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Find the business that should already exist from progress API
    const business = await prisma.business.findFirst({
      where: {
        users: {
          some: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        TeamInvitation: {
          where: {
            status: 'PENDING'
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found. Please complete the setup steps first.' }, { status: 404 })
    }

    // Mark setup as completed
    await prisma.business.update({
      where: { id: business.id },
      data: {
        setupWizardCompleted: true,
        onboardingCompleted: true,
        onboardingStep: 999, // Completed
        isActive: true
      }
    })

    // Log onboarding_completed for funnel (Store Ready = step 11). The client never
    // calls onComplete on Store Ready — it hits this API and redirects — so we log here.
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url
    logSystemEvent({
      logType: 'onboarding_completed',
      severity: 'info',
      endpoint: '/api/setup/complete',
      method: 'POST',
      statusCode: 200,
      url: actualUrl,
      businessId: business.id,
      ipAddress: extractIPAddress(request),
      userAgent: request.headers.get('user-agent') || undefined,
      errorMessage: `Onboarding completed: ${business.name}`,
      metadata: {
        step: 11,
        stepName: 'Store Ready',
        userId: user.id,
        userEmail: user.email,
        businessName: business.name
      }
    })

    // // Clear setup token if used
    // if (setupToken) {
    //   await prisma.user.update({
    //     where: { id: user.id },
    //     data: {
    //       setupToken: null,
    //       setupExpiry: null
    //     }
    //   })
    // }

    // Send team invitations if any exist
    for (const invitation of business.TeamInvitation) {
      try {
        const inviteUrl = `${process.env.NEXTAUTH_URL}/team/invite/${invitation.token}`
        await sendTeamInvitationEmail({
          to: invitation.email,
          businessName: business.name,
          inviterName: user.name || 'Team Admin',
          role: invitation.role,
          inviteUrl
        })
        
      } catch (emailError) {
        console.error(`Failed to send invitation to ${invitation.email}:`, emailError)
      }
    }

    if (setupToken) {
      // Token user - needs auto-login
      return NextResponse.json({
        success: true,
        autoLogin: true,
        email: user.email,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug
        },
        redirectUrl: `/admin/stores/${business.id}/dashboard`
      })
    } else {
      // Session user (Google OAuth) - normal response
      return NextResponse.json({
        success: true,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug
        },
        redirectUrl: `/admin/stores/${business.id}/dashboard`
      })
    }

  } catch (error) {
    console.error('Complete setup error:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}