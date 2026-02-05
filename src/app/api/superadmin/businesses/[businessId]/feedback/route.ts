// app/api/superadmin/businesses/[businessId]/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logSystemEvent } from '@/lib/systemLog'

// GET - Fetch all feedback for a specific business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        initialFeedbackCompletedAt: true,
        feedbackFormDismissedAt: true,
        onboardingCompletedAt: true,
        feedbacks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        initialFeedbackCompletedAt: business.initialFeedbackCompletedAt,
        feedbackFormDismissedAt: business.feedbackFormDismissedAt,
        onboardingCompletedAt: business.onboardingCompletedAt
      },
      feedbacks: business.feedbacks
    })

  } catch (error) {
    console.error('Error fetching business feedback:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Add feedback for a business (collected via email/phone/other)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

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

    const data = await request.json()

    // Validate rating
    const rating = parseInt(data.rating)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate source
    const validSources = ['SUPERADMIN_MANUAL', 'EMAIL', 'PHONE', 'OTHER']
    if (!validSources.includes(data.source)) {
      return NextResponse.json(
        { message: 'Invalid feedback source' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['INITIAL', 'PERIODIC', 'NPS', 'FEATURE_REQUEST', 'SUPPORT', 'OTHER']
    const feedbackType = data.type || 'INITIAL'
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { message: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Determine if we should mark initial feedback as completed
    const isInitialFeedback = feedbackType === 'INITIAL'
    const shouldMarkInitialComplete = isInitialFeedback && !business.initialFeedbackCompletedAt

    // Create feedback
    const feedback = await prisma.businessFeedback.create({
      data: {
        businessId: businessId,
        type: feedbackType,
        source: data.source,
        rating: rating,
        feedback: data.feedback || null,
        submittedById: session.user.id,
        submittedByEmail: session.user.email,
        submittedByName: data.submittedByName || session.user.name
      }
    })

    // If this is initial feedback and none was submitted before, mark it as completed
    if (shouldMarkInitialComplete) {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          initialFeedbackCompletedAt: new Date(),
          feedbackFormDismissedAt: null
        }
      })
    }

    // Construct actual URL from headers
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const protocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const actualUrl = host ? `${protocol}://${host}${new URL(request.url).pathname}` : request.url

    // Log the action
    await logSystemEvent({
      logType: 'admin_action',
      severity: 'info',
      endpoint: `/api/superadmin/businesses/${businessId}/feedback`,
      method: 'POST',
      statusCode: 200,
      url: actualUrl,
      businessId: businessId,
      metadata: {
        action: 'feedback_added',
        feedbackId: feedback.id,
        feedbackType: feedbackType,
        source: data.source,
        rating: rating,
        addedBy: session.user.email,
        markedInitialComplete: shouldMarkInitialComplete
      }
    })

    return NextResponse.json({
      success: true,
      feedback,
      markedInitialComplete: shouldMarkInitialComplete
    })

  } catch (error) {
    console.error('Error adding feedback:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
