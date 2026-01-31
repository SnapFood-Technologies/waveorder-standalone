// src/app/api/admin/stores/[businessId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
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
        cartBadgeColor: true,
        featuredBadgeColor: true,
        coverBackgroundSize: true,
        coverBackgroundPosition: true,
        coverHeight: true,
        coverHeightMobile: true,
        coverHeightDesktop: true,
        logoPadding: true,
        logoObjectFit: true,
        
        // Business settings
        currency: true,
        language: true,
        timezone: true,
        timeFormat: true,
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
        seoTitleEl: true,
        seoDescriptionEl: true,
        seoKeywordsEl: true,
        descriptionEl: true,
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
        
        // Custom Features
        brandsFeatureEnabled: true,
        collectionsFeatureEnabled: true,
        groupsFeatureEnabled: true,
        customMenuEnabled: true,
        customFilteringEnabled: true,
        
        // Inventory display
        showStockBadge: true,
        
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
    console.log('error-business-data', error);
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
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    // For PUT operations, check if it's an impersonation or normal access
    // If impersonating, allow it (SuperAdmin has full access)
    // If normal user, verify they have proper permissions (OWNER/MANAGER)
    if (!access.isImpersonating) {
      const businessUser = await prisma.businessUser.findFirst({
        where: {
          userId: access.session.user.id,
          businessId: businessId,
          role: {
            in: ['OWNER', 'MANAGER']
          }
        }
      })

      if (!businessUser) {
        return NextResponse.json(
          { error: 'Insufficient permissions - requires OWNER or MANAGER role' },
          { status: 403 }
        )
      }
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
        cartBadgeColor: true,
        featuredBadgeColor: true,
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

// PATCH handler for partial updates (individual fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    const body = await request.json()
    
    // Whitelist of allowed fields for PATCH
    const allowedFields = ['showStockBadge', 'schedulingEnabled']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating business settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}