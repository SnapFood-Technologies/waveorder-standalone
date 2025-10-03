// app/api/superadmin/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { sendBusinessCreatedEmail } from '@/lib/email'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const plan = searchParams.get('plan') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { users: { some: { user: { name: { contains: search, mode: 'insensitive' } } } } },
        { users: { some: { user: { email: { contains: search, mode: 'insensitive' } } } } }
      ]
    }

    if (status !== 'all') {
      whereConditions.isActive = status === 'active'
    }

    if (plan !== 'all') {
      whereConditions.subscriptionPlan = plan.toUpperCase()
    }

    // Get businesses with pagination
    const [businesses, totalCount] = await Promise.all([
      prisma.business.findMany({
        where: whereConditions,
        include: {
          users: {
            where: { role: 'OWNER' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  createdAt: true,
                  password: true,
                  accounts: {
                    select: {
                      provider: true,
                      type: true
                    }
                  }
                }
              }
            }
          },
          orders: {
            select: { 
              total: true,
              status: true,
              paymentStatus: true
            }
          },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.business.count({ where: whereConditions })
    ])

    // Format response with auth method detection
    const formattedBusinesses = businesses.map(business => {
      const owner = business.users[0]?.user
      let authMethod = 'email'
      
      if (owner?.accounts?.length > 0) {
        const googleAccount = owner.accounts.find(acc => acc.provider === 'google')
        if (googleAccount) {
          authMethod = 'google'
        } else {
          authMethod = 'oauth'
        }
      } else if (owner?.password) {
        authMethod = 'email'
      } else {
        authMethod = 'magic-link'
      }

      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        businessType: business.businessType,
        subscriptionPlan: business.subscriptionPlan,
        subscriptionStatus: business.subscriptionStatus,
        isActive: business.isActive,
        currency: business.currency,
        language: business.language,
        whatsappNumber: business.whatsappNumber,
        address: business.address,
        logo: business.logo,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
        onboardingCompleted: business.onboardingCompleted,
        setupWizardCompleted: business.setupWizardCompleted,
        createdByAdmin: business.createdByAdmin,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          createdAt: owner.createdAt,
          authMethod
        } : null,
        stats: {
          totalOrders: business._count.orders,
          totalRevenue: business.orders
            .filter(order => 
              order.status === 'DELIVERED' && 
              order.paymentStatus === 'PAID'
            )
            .reduce((sum, order) => sum + order.total, 0),
          totalCustomers: 0,
          totalProducts: 0
        }
      }
    })

    return NextResponse.json({
      businesses: formattedBusinesses,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.businessName || !data.ownerName || !data.ownerEmail || !data.whatsappNumber) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password if not sending email
    if (!data.sendEmail && (!data.password || data.password.length < 8)) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters when not sending email' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.ownerEmail.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const baseSlug = data.businessName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    let slug = baseSlug
    let counter = 1
    
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Prepare user data
    let userData: any = {
      name: data.ownerName,
      email: data.ownerEmail.toLowerCase(),
      role: 'BUSINESS_OWNER',
      emailVerified: new Date(), // Mark as verified since SuperAdmin creates it
    }

    if (data.sendEmail) {
      const passwordSetupToken = crypto.randomBytes(32).toString('hex')
      const passwordSetupExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      userData.passwordSetupToken = passwordSetupToken
      userData.passwordSetupExpiry = passwordSetupExpiry
    } else {
      // Hash password for immediate login
      const hashedPassword = await bcrypt.hash(data.password, 10)
      userData.password = hashedPassword
    }

    // Create user
    const user = await prisma.user.create({ data: userData })

    // Get defaults based on business type
    const getDefaults = (businessType: string) => {
      switch (businessType) {
        case 'RESTAURANT':
        case 'CAFE':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '30-45 minutes',
            estimatedPickupTime: data.estimatedPickupTime || '15-20 minutes'
          }
        case 'RETAIL':
        case 'JEWELRY':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '2-5 business days',
            estimatedPickupTime: data.estimatedPickupTime || '1-2 hours'
          }
        case 'GROCERY':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '2-4 hours',
            estimatedPickupTime: data.estimatedPickupTime || '30 minutes'
          }
        case 'FLORIST':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '2-4 hours',
            estimatedPickupTime: data.estimatedPickupTime || '2-4 hours'
          }
        default:
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || '30-45 minutes',
            estimatedPickupTime: data.estimatedPickupTime || '15-20 minutes'
          }
      }
    }

    const defaults = getDefaults(data.businessType)

    // Create business with all data
    const business = await prisma.business.create({
      data: {
        name: data.businessName,
        slug: slug,
        businessType: data.businessType,
        subscriptionPlan: 'FREE', // Only FREE plan for now
        currency: data.currency || 'USD',
        language: data.language || 'en',
        timezone: data.timezone || 'UTC',
        whatsappNumber: data.whatsappNumber,
        address: data.address,
        storeLatitude: data.storeLatitude,
        storeLongitude: data.storeLongitude,
        
        // Mark as completed since SuperAdmin creates it
        onboardingCompleted: true,
        setupWizardCompleted: true,
        onboardingStep: 999,
        isActive: true,
        createdByAdmin: true,
        
        // Delivery settings
        deliveryEnabled: data.deliveryEnabled ?? true,
        pickupEnabled: data.pickupEnabled ?? false,
        deliveryFee: data.deliveryFee ?? 0,
        deliveryRadius: data.deliveryRadius ?? 10,
        estimatedDeliveryTime: defaults.estimatedDeliveryTime,
        estimatedPickupTime: defaults.estimatedPickupTime,
        
        // Payment methods - NOTE: Stripe integration for paid plans coming soon
        paymentMethods: data.paymentMethods || ['CASH'],
        
        // Business goals
        businessGoals: data.businessGoals || [],
        
        orderNumberFormat: 'WO-{number}',
        
        users: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        users: {
          include: { user: true }
        }
      }
    })

    // Send welcome email with setup instructions if requested
    if (data.sendEmail) {
      try {
        const setupUrl = `${process.env.NEXTAUTH_URL}/setup-password?token=${userData.passwordSetupToken}`
        const dashboardUrl = `${process.env.NEXTAUTH_URL}/admin/stores/${business.id}/dashboard`
        
        await sendBusinessCreatedEmail({
          to: data.ownerEmail,
          name: data.ownerName,
          businessName: data.businessName,
          setupUrl,
          dashboardUrl
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        business: {
          id: business.id,
          name: business.name,
          slug: business.slug,
          owner: business.users[0]?.user,
          createdByAdmin: business.createdByAdmin,
          setupMethod: data.sendEmail ? 'email' : 'password'
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
