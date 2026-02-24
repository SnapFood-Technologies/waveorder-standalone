// app/api/admin/stores/[businessId]/services/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { canAddProduct, getPlanLimits } from '@/lib/stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Verify business is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true, connectedBusinesses: true }
    })

    if (business?.businessType !== 'SALON' && business?.businessType !== 'SERVICES') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || 'all'
    const skip = (page - 1) * limit

    // Business filter: own business + connected businesses
    const businessFilter = {
      OR: [
        { businessId: businessId },
        { businessId: { in: business?.connectedBusinesses || [] } }
      ]
    }

    // Build where clause: services only (isService: true)
    const whereClause: any = {
      ...businessFilter,
      isService: true
    }

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    if (category) {
      if (whereClause.AND) {
        whereClause.AND.push({ categoryId: category })
      } else {
        whereClause.categoryId = category
      }
    }

    if (status === 'active') {
      if (whereClause.AND) {
        whereClause.AND.push({ isActive: true })
      } else {
        whereClause.isActive = true
      }
    } else if (status === 'inactive') {
      if (whereClause.AND) {
        whereClause.AND.push({ isActive: false })
      } else {
        whereClause.isActive = false
      }
    }

    const total = await prisma.product.count({ where: whereClause })

    const services = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: { select: { id: true, name: true } },
        modifiers: true,
        business: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const pages = Math.ceil(total / limit)

    // Get stats
    const statsWhereClause: any = {
      ...businessFilter,
      isService: true
    }

    if (search) {
      statsWhereClause.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
    }

    if (category) {
      if (statsWhereClause.AND) {
        statsWhereClause.AND.push({ categoryId: category })
      } else {
        statsWhereClause.categoryId = category
      }
    }

    const [activeCount, featuredCount] = await Promise.all([
      prisma.product.count({
        where: {
          ...statsWhereClause,
          isActive: true
        }
      }),
      prisma.product.count({
        where: {
          ...statsWhereClause,
          featured: true
        }
      })
    ])

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total,
        pages
      },
      stats: {
        active: activeCount,
        featured: featuredCount
      }
    })

  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Verify business is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })

    if (business?.businessType !== 'SALON' && business?.businessType !== 'SERVICES') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    // Get business owner's plan to check product limit
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const planLimits = getPlanLimits(userPlan)
    
    // Count current services for this business
    const currentServiceCount = await prisma.product.count({
      where: { businessId, isService: true }
    })
    
    // Check if user can add more products/services
    if (!canAddProduct(userPlan, currentServiceCount)) {
      return NextResponse.json({ 
        message: `Service limit reached. Your ${userPlan} plan allows up to ${planLimits.products} services. Please upgrade to add more services.`,
        code: 'SERVICE_LIMIT_REACHED',
        currentCount: currentServiceCount,
        limit: planLimits.products,
        plan: userPlan
      }, { status: 403 })
    }

    const serviceData = await request.json()
    
    // Check if staff assignment is attempted on STARTER plan
    if (serviceData.staffIds && Array.isArray(serviceData.staffIds) && serviceData.staffIds.length > 0) {
      if (userPlan === 'STARTER') {
        return NextResponse.json({ 
          message: 'Staff assignment is only available on Pro or Business plans. Please upgrade to assign team members to services.',
          code: 'STAFF_ASSIGNMENT_NOT_AVAILABLE',
          plan: userPlan
        }, { status: 403 })
      }
    }

    const service = await prisma.product.create({
      data: {
        name: serviceData.name,
        nameAl: serviceData.nameAl || null,
        nameEl: serviceData.nameEl || null,
        description: serviceData.description || null,
        descriptionAl: serviceData.descriptionAl || null,
        descriptionEl: serviceData.descriptionEl || null,
        images: serviceData.images || [],
        price: serviceData.price,
        originalPrice: serviceData.originalPrice || null,
        isActive: serviceData.isActive ?? true,
        featured: serviceData.featured ?? false,
        metaTitle: serviceData.metaTitle || null,
        metaDescription: serviceData.metaDescription || null,
        businessId,
        categoryId: serviceData.categoryId,
        // Salon-specific fields
        isService: true,
        serviceDuration: serviceData.serviceDuration || null,
        requiresAppointment: serviceData.requiresAppointment ?? true,
        staffIds: serviceData.staffIds || [],
        // Services don't have inventory
        trackInventory: false,
        stock: 0,
        // Modifiers for add-ons (e.g., "Deep Conditioning +$20")
        modifiers: {
          create: serviceData.modifiers?.map((modifier: any) => ({
            name: modifier.name,
            price: modifier.price,
            required: modifier.required ?? false
          })) || []
        }
      },
      include: {
        category: true,
        modifiers: true
      }
    })

    return NextResponse.json({ service })

  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
