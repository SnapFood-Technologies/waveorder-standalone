// app/api/admin/stores/[businessId]/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - Fetch feedback status and history for this business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Check user has access to this business
    if (session.user.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.businessUser.findFirst({
        where: {
          userId: session.user.id,
          businessId: businessId
        }
      })
      
      if (!hasAccess) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        initialFeedbackCompletedAt: true,
        feedbackFormDismissedAt: true,
        feedbacks: {
          where: { type: 'INITIAL' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Calculate if we should show the feedback form
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Conditions to show feedback form:
    // 1. Onboarding completed at least 7 days ago
    // 2. No initial feedback submitted yet
    // 3. Form not dismissed OR dismissed more than 14 days ago
    const onboardingOldEnough = business.onboardingCompletedAt 
      ? new Date(business.onboardingCompletedAt) <= sevenDaysAgo 
      : business.onboardingCompleted // Fallback for existing businesses without timestamp

    const noFeedbackYet = !business.initialFeedbackCompletedAt

    const notRecentlyDismissed = !business.feedbackFormDismissedAt || 
      new Date(business.feedbackFormDismissedAt) <= fourteenDaysAgo

    const shouldShowFeedbackForm = onboardingOldEnough && noFeedbackYet && notRecentlyDismissed

    return NextResponse.json({
      shouldShowFeedbackForm,
      initialFeedbackCompleted: !!business.initialFeedbackCompletedAt,
      feedbackFormDismissedAt: business.feedbackFormDismissedAt,
      onboardingCompleted: business.onboardingCompleted,
      onboardingCompletedAt: business.onboardingCompletedAt,
      existingFeedback: business.feedbacks[0] || null
    })

  } catch (error) {
    console.error('Error fetching feedback status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Submit initial feedback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Check user has access to this business
    if (session.user.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.businessUser.findFirst({
        where: {
          userId: session.user.id,
          businessId: businessId
        }
      })
      
      if (!hasAccess) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { 
        id: true, 
        name: true,
        initialFeedbackCompletedAt: true 
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Check if initial feedback already submitted
    if (business.initialFeedbackCompletedAt) {
      return NextResponse.json(
        { message: 'Initial feedback has already been submitted' },
        { status: 400 }
      )
    }

    const data = await request.json()

    // Validate rating
    const rating = parseInt(data.rating)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Create feedback and update business in a transaction
    const [feedback] = await prisma.$transaction([
      prisma.businessFeedback.create({
        data: {
          businessId: businessId,
          type: 'INITIAL',
          source: 'ADMIN_FORM',
          rating: rating,
          feedback: data.feedback || null,
          submittedById: session.user.id,
          submittedByEmail: session.user.email,
          submittedByName: session.user.name
        }
      }),
      prisma.business.update({
        where: { id: businessId },
        data: {
          initialFeedbackCompletedAt: new Date(),
          feedbackFormDismissedAt: null // Clear dismissed state
        }
      })
    ])

    return NextResponse.json({
      success: true,
      feedback
    })

  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Dismiss the feedback form
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Check user has access to this business
    if (session.user.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.businessUser.findFirst({
        where: {
          userId: session.user.id,
          businessId: businessId
        }
      })
      
      if (!hasAccess) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
    }

    const data = await request.json()

    if (data.action === 'dismiss') {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          feedbackFormDismissedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Feedback form dismissed'
      })
    }

    return NextResponse.json(
      { message: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error dismissing feedback form:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
