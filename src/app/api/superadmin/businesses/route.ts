// app/api/superadmin/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { hash } from 'bcryptjs'

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

    // Create user with password (if provided) or without password for magic link
    const userData: any = {
      name: data.ownerName,
      email: data.ownerEmail.toLowerCase(),
      role: 'BUSINESS_OWNER',
      emailVerified: new Date()
    }

    if (data.password) {
      userData.password = await hash(data.password, 12)
    }

    const user = await prisma.user.create({ data: userData })

    // Get default values based on business type
    const getDefaults = (businessType: string) => {
      switch (businessType) {
        case 'RESTAURANT':
        case 'CAFE':
          return {
            estimatedDeliveryTime: '30-45 minutes',
            estimatedPickupTime: '15-20 minutes'
          }
        case 'RETAIL':
        case 'JEWELRY':
          return {
            estimatedDeliveryTime: '2-5 business days',
            estimatedPickupTime: '1-2 hours'
          }
        case 'GROCERY':
          return {
            estimatedDeliveryTime: '2-4 hours',
            estimatedPickupTime: '30 minutes'
          }
        case 'FLORIST':
          return {
            estimatedDeliveryTime: '2-4 hours',
            estimatedPickupTime: '2-4 hours'
          }
        default:
          return {
            estimatedDeliveryTime: '30-45 minutes',
            estimatedPickupTime: '15-20 minutes'
          }
      }
    }

    const defaults = getDefaults(data.businessType)

    // Create business with defaults
    const business = await prisma.business.create({
      data: {
        name: data.businessName,
        slug: slug,
        businessType: data.businessType,
        subscriptionPlan: data.subscriptionPlan || 'FREE',
        currency: data.currency || 'USD',
        language: data.language || 'en',
        whatsappNumber: data.whatsappNumber,
        
        // Mark as completed since SuperAdmin creates it
        onboardingCompleted: true,
        setupWizardCompleted: true,
        onboardingStep: 999,
        isActive: true,
        
        // Default settings
        deliveryEnabled: true,
        pickupEnabled: false,
        deliveryFee: 0,
        deliveryRadius: 10,
        estimatedDeliveryTime: defaults.estimatedDeliveryTime,
        estimatedPickupTime: defaults.estimatedPickupTime,
        paymentMethods: ['CASH'],
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

    // Send email notification if requested
    if (data.sendEmail && data.password) {
      try {
        // Add your email sending logic here
        console.log('Sending welcome email to:', data.ownerEmail)
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        owner: business.users[0]?.user
      }
    })

  } catch (error) {
    console.error('Error creating business:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
