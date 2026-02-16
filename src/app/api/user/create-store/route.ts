// app/api/user/create-store/route.ts
// API for creating additional stores (multi-store feature)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canAddStore } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.storeName?.trim() || !data.slug?.trim()) {
      return NextResponse.json(
        { message: 'Store name and URL are required' },
        { status: 400 }
      )
    }

    // Check store limit
    const userPlan = (user.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const existingBusinessCount = await prisma.businessUser.count({
      where: { userId: user.id, role: 'OWNER' }
    })

    if (!canAddStore(userPlan, existingBusinessCount)) {
      const limitMap = { STARTER: 1, PRO: 5, BUSINESS: Infinity }
      return NextResponse.json({
        message: `Store limit reached. Your ${userPlan} plan allows ${limitMap[userPlan]} store(s). Upgrade your plan to add more stores.`,
        error: 'STORE_LIMIT_REACHED'
      }, { status: 403 })
    }

    // Validate and check slug availability
    const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    const existingSlug = await prisma.business.findUnique({ where: { slug } })
    
    if (existingSlug) {
      return NextResponse.json(
        { message: 'This store URL is already taken' },
        { status: 400 }
      )
    }

    // Get business-type specific defaults
    const getDefaults = (businessType: string) => {
      switch (businessType) {
        case 'RESTAURANT':
        case 'CAFE':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '30-45 minutes',
            estimatedPickupTime: data.estimatedPickupTime || '15-20 minutes'
          }
        case 'RETAIL':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '2-5 business days',
            estimatedPickupTime: data.estimatedPickupTime || '1-2 hours'
          }
        case 'GROCERY':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '2-4 hours',
            estimatedPickupTime: data.estimatedPickupTime || '30 minutes'
          }
        default:
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '30-45 minutes',
            estimatedPickupTime: data.estimatedPickupTime || '15-20 minutes'
          }
      }
    }

    const defaults = getDefaults(data.businessType || 'RETAIL')

    // Create business with all proper fields (matching SuperAdmin quality)
    const business = await prisma.business.create({
      data: {
        name: data.storeName.trim(),
        slug: slug,
        businessType: data.businessType || 'RETAIL',
        
        // Subscription inherits from user's plan
        subscriptionPlan: userPlan,
        subscriptionStatus: 'ACTIVE',
        
        // Regional settings
        currency: data.currency || 'USD',
        language: data.language || 'en',
        storefrontLanguage: data.language || 'en',
        timezone: data.timezone || 'UTC',
        
        // Contact & Location
        whatsappNumber: data.whatsappNumber || '',
        address: data.address || '',
        country: data.country || null,
        storeLatitude: data.storeLatitude || null,
        storeLongitude: data.storeLongitude || null,
        
        // Completion flags - fully complete
        onboardingCompleted: true,
        setupWizardCompleted: true,
        onboardingStep: 999,
        isActive: true,
        createdByAdmin: false, // Created by user, not admin
        
        // Delivery settings
        deliveryEnabled: data.deliveryEnabled ?? (data.businessType === 'SALON' ? false : true),
        pickupEnabled: data.pickupEnabled ?? false,
        dineInEnabled: data.businessType === 'SALON' ? true : false,
        deliveryFee: data.deliveryFee ?? 0,
        deliveryRadius: data.deliveryRadius ?? 10,
        estimatedDeliveryTime: defaults.estimatedDeliveryTime,
        estimatedPickupTime: defaults.estimatedPickupTime,
        
        // Payment & Goals
        paymentMethods: data.paymentMethods || ['CASH'],
        businessGoals: data.businessGoals || [],
        orderNumberFormat: 'WO-{number}',
        
        // Link to owner
        users: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      businessId: business.id,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        subscriptionPlan: business.subscriptionPlan
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
