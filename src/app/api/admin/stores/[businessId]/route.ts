// src/app/api/admin/stores/[businessId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { businessId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId
      }
    })

    if (!businessUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get business data
    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        description: true,
        logo: true,
        coverImage: true,
        phone: true,
        email: true,
        address: true,
        website: true,
        whatsappNumber: true,
        
        // Appearance settings
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        whatsappButtonColor: true,
        mobileCartStyle: true,
        
        // Business settings
        currency: true,
        language: true,
        timezone: true,
        deliveryFee: true,
        minimumOrder: true,
        deliveryRadius: true,
        
        // Features
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        estimatedDeliveryTime: true,
        estimatedPickupTime: true,
        
        // Payment & messaging
        paymentMethods: true,
        paymentInstructions: true,
        messageTemplate: true,
        autoReply: true,
        autoReplyMessage: true,
        greetingMessage: true,
        orderNumberFormat: true,
        
        // Business hours
        businessHours: true,
        
        // Store closure
        isTemporarilyClosed: true,
        closureReason: true,
        closureMessage: true,
        closureStartDate: true,
        closureEndDate: true,
        
        // SEO
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        seoTitleAl: true,
        seoDescriptionAl: true,
        seoKeywordsAl: true,
        descriptionAl: true,
        favicon: true,
        ogImage: true,
        canonicalUrl: true,
        noIndex: true,
        noFollow: true,
        schemaType: true,
        schemaData: true,
        isIndexable: true,
        
        // Subscription & domain
        subscriptionPlan: true,
        subscriptionStatus: true,
        customDomain: true,
        domainStatus: true,
        subdomainEnabled: true,
        
        // Onboarding
        onboardingCompleted: true,
        onboardingStep: true,
        setupWizardCompleted: true,
        
        // Status
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      business
    })

  } catch (error) {
    console.error('Error fetching business data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business data' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { businessId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has access to this business with proper permissions
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId,
        role: {
          in: ['OWNER', 'MANAGER']
        }
      }
    })

    if (!businessUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Update business data
    const updatedBusiness = await prisma.business.update({
      where: {
        id: businessId
      },
      data: {
        ...body,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        whatsappButtonColor: true,
        mobileCartStyle: true,
        currency: true,
        language: true,
        description: true,
        logo: true,
        coverImage: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Business updated successfully',
      business: updatedBusiness
    })

  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    )
  }
}