// app/api/superadmin/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendBusinessCreatedEmail } from '@/lib/email'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { createStripeCustomer, createSubscriptionByPlan, getPriceId, getBillingTypeFromPriceId } from '@/lib/stripe'


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
    const country = searchParams.get('country') || 'all'
    const includeTest = searchParams.get('includeTest') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}
    
    // Exclude test businesses by default (unless includeTest is true)
    // Use NOT to handle null/missing testMode field (existing businesses before this field was added)
    if (!includeTest) {
      whereConditions.NOT = { testMode: true }
    }
    
    // Country filter - case-insensitive match
    if (country !== 'all') {
      whereConditions.country = { equals: country, mode: 'insensitive' }
    }

    // Handle incomplete filter separately - filter in memory due to Prisma/MongoDB null handling issues
    // Skip building whereConditions for incomplete - we'll handle it in the query section
    if (status !== 'incomplete') {
      // Regular status filter (active/inactive/all) - NOT incomplete
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
    }

    // Apply plan filter to all queries (works with incomplete, active, inactive, all)
    if (plan !== 'all') {
      const planCondition = { subscriptionPlan: plan.toUpperCase() }
      
      // If we have AND conditions, add plan to AND array
      if (whereConditions.AND) {
        whereConditions.AND.push(planCondition)
      } 
      // If we have OR conditions (incomplete filter or search), wrap in AND
      else if (whereConditions.OR) {
        const existingOR = whereConditions.OR
        delete whereConditions.OR
        whereConditions.AND = [
          { OR: existingOR },
          planCondition
        ]
      } 
      // Otherwise, add plan as a direct condition
      else {
        whereConditions.subscriptionPlan = plan.toUpperCase()
      }
    }

    // For incomplete filter, we need to fetch all and filter in memory
    // because Prisma/MongoDB has issues with null checks in OR conditions
    let businesses: any[]
    let totalCount: number

    if (status === 'incomplete') {
      // Fetch ALL businesses first (with search and plan filters applied)
      const baseConditions: any = {}
      
      // Exclude test businesses by default (use NOT to handle null/missing field)
      if (!includeTest) {
        baseConditions.NOT = { testMode: true }
      }
      
      if (search) {
        baseConditions.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { users: { some: { user: { name: { contains: search, mode: 'insensitive' } } } } },
          { users: { some: { user: { email: { contains: search, mode: 'insensitive' } } } } }
        ]
      }
      if (plan !== 'all') {
        baseConditions.subscriptionPlan = plan.toUpperCase()
      }
      // Country filter applied via baseConditions - case-insensitive
      if (country !== 'all') {
        baseConditions.country = { equals: country, mode: 'insensitive' }
      }

      // Get all businesses matching search/plan/country
      const allBusinesses = await prisma.business.findMany({
        where: Object.keys(baseConditions).length > 0 ? baseConditions : undefined,
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  createdAt: true,
                  password: true,
                  accounts: {
                    select: {
                      provider: true,
                      type: true
                    }
                  },
                  subscription: {
                    select: {
                      priceId: true
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
              paymentStatus: true,
              type: true
            }
          },
          _count: {
            select: { 
              orders: true,
              customers: true,
              products: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Filter for incomplete businesses in memory
      const incompleteBusinesses = allBusinesses.filter(business => {
        const whatsappNumber = (business.whatsappNumber || '').trim()
        const address = business.address ? business.address.trim() : null
        
        const hasWhatsApp = whatsappNumber !== '' && whatsappNumber !== 'Not provided'
        const hasAddress = address !== null && address !== '' && address !== 'Not set'
        
        return !hasWhatsApp || !hasAddress
      })

      totalCount = incompleteBusinesses.length
      
      // Apply pagination
      businesses = incompleteBusinesses.slice(offset, offset + limit)
    } else {
      // Regular query for active/inactive/all - country filter already in whereConditions
      const result = await Promise.all([
        prisma.business.findMany({
          where: whereConditions,
          include: {
            users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  createdAt: true,
                  password: true,
                  accounts: {
                    select: {
                      provider: true,
                      type: true
                    }
                  },
                  subscription: {
                    select: {
                      priceId: true
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
                paymentStatus: true,
                type: true
              }
            },
            _count: {
              select: { 
                orders: true,
                customers: true,
                products: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.business.count({ where: whereConditions })
      ])
      businesses = result[0]
      totalCount = result[1]
      
      // Fetch connectedBusinesses separately for each business
      const businessesWithConnections = await Promise.all(
        businesses.map(async (business: any) => {
          const businessData = await prisma.business.findUnique({
            where: { id: business.id },
            select: { connectedBusinesses: true }
          })
          return {
            ...business,
            connectedBusinesses: businessData?.connectedBusinesses || []
          }
        })
      )
      businesses = businessesWithConnections
    }

    // Format response with auth method detection
    // @ts-ignore
    const formattedBusinesses = await Promise.all(businesses.map(async (business) => {
      // @ts-ignore
      const owner = business.users.find(u => u.role === 'OWNER')?.user
      let authMethod = 'email'
      
      // @ts-ignore
      if (owner?.accounts?.length > 0) {
        // @ts-ignore
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

      // Format all users for the business
      // @ts-ignore
      const users = business.users.map(businessUser => ({
        id: businessUser.user.id,
        name: businessUser.user.name,
        email: businessUser.user.email,
        role: businessUser.user.role
      }))

      // Get billing type from subscription priceId
      // @ts-ignore
      const subscriptionPriceId = owner?.subscription?.priceId
      const billingType = subscriptionPriceId ? getBillingTypeFromPriceId(subscriptionPriceId) : null

      // Determine marketplace role
      // @ts-ignore
      const isOriginator = business.connectedBusinesses && business.connectedBusinesses.length > 0
      
      // Check if supplier (find businesses that have this business in their connectedBusinesses)
      let isSupplier = false
      if (!isOriginator) {
        const originatorCount = await prisma.business.count({
          where: {
            connectedBusinesses: { has: business.id }
          }
        })
        isSupplier = originatorCount > 0
      }

      // Count only own products (exclude supplier products for originators)
      // For originators: only count products where businessId = business.id (not supplier products)
      // For suppliers: count all products where businessId = business.id (their own products)
      // The _count already does this correctly, but we'll be explicit
      const ownProductCount = await prisma.product.count({
        where: {
          businessId: business.id
        }
      })

      // For originators, also count total products from suppliers
      let supplierProductCount = 0
      if (isOriginator && business.connectedBusinesses && business.connectedBusinesses.length > 0) {
        supplierProductCount = await prisma.product.count({
          where: {
            businessId: { in: business.connectedBusinesses }
          }
        })
      }

      // Check if owner has multiple stores (multi-store user)
      let storeCount = 1
      let isMultiStore = false
      if (owner?.id) {
        storeCount = await prisma.businessUser.count({
          where: { userId: owner.id }
        })
        isMultiStore = storeCount > 1
      }

      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        businessType: business.businessType,
        industry: business.industry,
        subscriptionPlan: business.subscriptionPlan,
        billingType: billingType,
        subscriptionStatus: business.subscriptionStatus,
        isActive: business.isActive,
        testMode: business.testMode,
        trialEndsAt: business.trialEndsAt,
        graceEndsAt: business.graceEndsAt,
        deactivatedAt: business.deactivatedAt,
        deactivationReason: business.deactivationReason,
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
        marketplaceRole: isOriginator ? 'originator' : (isSupplier ? 'supplier' : null),
        users: users,
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          createdAt: owner.createdAt,
          authMethod
        } : null,
        isMultiStore,
        storeCount,
        stats: {
          totalOrders: business._count.orders,
          // Revenue: Paid orders that are completed/fulfilled
          // - DELIVERY orders: DELIVERED + PAID
          // - PICKUP orders: PICKED_UP + PAID (only when actually picked up)
          // - DINE_IN orders: PICKED_UP + PAID (only when actually picked up)
          totalRevenue: business.orders
            .filter((order: any) => {
              if (order.paymentStatus !== 'PAID') return false
              if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return false
              
              // Order-type specific revenue calculation
              if (order.type === 'DELIVERY') {
                return order.status === 'DELIVERED'
              } else if (order.type === 'PICKUP') {
                return order.status === 'PICKED_UP'
              } else if (order.type === 'DINE_IN') {
                return order.status === 'PICKED_UP'
              }
              
              return false
            })
            // @ts-ignore
            .reduce((sum, order) => sum + order.total, 0),
          totalCustomers: business._count.customers || 0,
          totalProducts: ownProductCount, // Use explicit count of own products only
          supplierProductCount: supplierProductCount // For originators: total products from suppliers
        }
      }
    }))

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

    // Handle slug - either provided or auto-generated
    let slug = data.slug
    
    if (slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { message: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens' },
          { status: 400 }
        )
      }
      
      const existingSlug = await prisma.business.findUnique({ where: { slug } })
      if (existingSlug) {
        return NextResponse.json(
          { message: 'This store URL is already taken' },
          { status: 400 }
        )
      }
    } else {
      const baseSlug = data.businessName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      slug = baseSlug
      let counter = 1
      
      while (await prisma.business.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    // Create Stripe customer and subscription based on selected plan
    let stripeCustomerId: string | undefined
    let subscriptionId: string | undefined
    
    const subscriptionPlan = data.subscriptionPlan || 'STARTER'
    const billingType = data.billingType || 'free'

    try {
      console.log('Creating Stripe customer for:', data.ownerEmail)
      const stripeCustomer = await createStripeCustomer(data.ownerEmail, data.ownerName)
      stripeCustomerId = stripeCustomer.id
      
      console.log(`Creating ${subscriptionPlan} subscription (${billingType}) for customer:`, stripeCustomerId)
      const stripeSubscription = await createSubscriptionByPlan(
        stripeCustomerId,
        subscriptionPlan,
        billingType
      )
      
      const priceId = getPriceId(subscriptionPlan, billingType)
      
      // Create subscription in database
      const subscription = await prisma.subscription.create({
        data: {
          stripeId: stripeSubscription.id,
          status: stripeSubscription.status,
          priceId: priceId,
          plan: subscriptionPlan as any,
          // @ts-ignore
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          // @ts-ignore
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        }
      })
      
      subscriptionId = subscription.id
      console.log('✅ Subscription created:', subscription.id)
    } catch (stripeError) {
      console.error('❌ Stripe error:', stripeError)
      // Continue without Stripe - can be fixed later
    }

    // Prepare user data
    let userData: any = {
      name: data.ownerName,
      email: data.ownerEmail.toLowerCase(),
      role: 'BUSINESS_OWNER',
      emailVerified: new Date(),
      plan: subscriptionPlan as any,
      stripeCustomerId,
      subscriptionId,
    }

    if (data.sendEmail) {
      const passwordSetupToken = crypto.randomBytes(32).toString('hex')
      const passwordSetupExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      userData.passwordSetupToken = passwordSetupToken
      userData.passwordSetupExpiry = passwordSetupExpiry
    } else {
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
        case 'SALON':
          return {
            estimatedDeliveryTime: data.estimatedDeliveryTime || 'N/A',
            estimatedPickupTime: data.estimatedPickupTime || 'N/A'
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
        industry: data.industry || null,
        subscriptionPlan: subscriptionPlan as any,
        subscriptionStatus: 'ACTIVE',
        currency: data.currency || 'USD',
        language: data.language || 'en',
        timezone: data.timezone || 'UTC',
        whatsappNumber: data.whatsappNumber,
        address: data.address,
        country: data.country || null,
        storeLatitude: data.storeLatitude,
        storeLongitude: data.storeLongitude,
        
        onboardingCompleted: true,
        setupWizardCompleted: true,
        onboardingStep: 999,
        isActive: true,
        createdByAdmin: true,
        
        deliveryEnabled: data.deliveryEnabled ?? (data.businessType === 'SALON' ? false : true),
        pickupEnabled: data.pickupEnabled ?? false,
        dineInEnabled: data.dineInEnabled ?? (data.businessType === 'SALON' ? true : false),
        deliveryFee: data.deliveryFee ?? 0,
        deliveryRadius: data.deliveryRadius ?? 10,
        estimatedDeliveryTime: defaults.estimatedDeliveryTime,
        estimatedPickupTime: defaults.estimatedPickupTime,
        
        paymentMethods: data.paymentMethods || ['CASH'],
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
          dashboardUrl,
          subscriptionPlan: 'STARTER' // Add this
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
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
          setupMethod: data.sendEmail ? 'email' : 'password',
          subscriptionPlan: 'STARTER',
          stripeCustomerId,
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
