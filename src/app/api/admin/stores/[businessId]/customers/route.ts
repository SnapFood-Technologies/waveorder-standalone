// src/app/api/admin/stores/[businessId]/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Server-side address parsing function
function parseAndCleanAddress(addressJson: any): any {
  if (!addressJson?.street) return addressJson

  const street = addressJson.street.trim()
  
  // If street contains commas, it's likely the full formatted address
  if (street.includes(',')) {
    const parts = street.split(',').map((part: string) => part.trim())
    
    // First part is usually the actual street
    const cleanStreet = parts[0]
    
    // Try to extract city from parts if not already provided
    if (!addressJson.city && parts.length >= 2) {
      let cityPart = parts[1]
      // Remove postal codes from city part
      cityPart = cityPart.replace(/\b\d{3,5}\s?\d{0,2}\b/g, '').trim()
      if (cityPart) {
        addressJson.city = cityPart
      }
    }
    
    // Try to extract postal code if not already provided
    if (!addressJson.zipCode) {
      const fullAddress = street
      const zipMatches = fullAddress.match(/\b\d{3,5}\s?\d{0,2}\b/g)
      if (zipMatches) {
        addressJson.zipCode = zipMatches[zipMatches.length - 1].replace(/\s+/g, ' ').trim()
      }
    }
    
    // Try to extract country if not already provided
    if (!addressJson.country || addressJson.country === 'US') {
      const lastPart = parts[parts.length - 1].toLowerCase()
      if (lastPart.includes('albania') || lastPart.includes('al')) {
        addressJson.country = 'AL'
      } else if (lastPart.includes('greece') || lastPart.includes('gr')) {
        addressJson.country = 'GR'
      } else if (lastPart.includes('italy') || lastPart.includes('it')) {
        addressJson.country = 'IT'
      }
    }
    
    // Update street to clean version
    addressJson.street = cleanStreet
  }
  
  return addressJson
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Await params before using
    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validation
    if (!body.name?.trim()) {
      return NextResponse.json({ message: 'Customer name is required' }, { status: 400 })
    }

    if (!body.phone?.trim()) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 })
    }

    // Validate phone format
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(body.phone.trim())) {
      return NextResponse.json({ message: 'Invalid phone number format' }, { status: 400 })
    }

    // Validate email if provided
    if (body.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
      }
    }

    // Check if customer with this phone already exists for this business
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: body.phone.trim(),
        businessId: businessId
      }
    })

    if (existingCustomer) {
      return NextResponse.json({ message: 'A customer with this phone number already exists' }, { status: 409 })
    }

    // Prepare customer data
    const customerData = {
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || null,
      businessId: businessId,
      tier: body.tier || 'REGULAR',
      addedByAdmin: body.addedByAdmin || true,
      tags: body.tags || [],
      notes: body.notes?.trim() || null,
      addressJson: null as any,
      address: null as string | null // Keep for backward compatibility
    }

    // Handle address data with parsing and cleaning
    if (body.addressJson && body.addressJson.street?.trim()) {
      // Parse and clean the address on the server side
      const cleanedAddress = parseAndCleanAddress({
        street: body.addressJson.street.trim(),
        additional: body.addressJson.additional?.trim() || '',
        zipCode: body.addressJson.zipCode?.trim() || '',
        city: body.addressJson.city?.trim() || '',
        country: body.addressJson.country || 'US',
        latitude: body.addressJson.latitude || null,
        longitude: body.addressJson.longitude || null
      })

      customerData.addressJson = cleanedAddress

      // Create backward-compatible address string
      const addressParts = [
        customerData.addressJson.street,
        customerData.addressJson.additional,
        customerData.addressJson.city,
        customerData.addressJson.zipCode
      ].filter(Boolean)
      customerData.address = addressParts.join(', ')
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: customerData
    })

    return NextResponse.json({ 
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        tier: customer.tier,
        createdAt: customer.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Await params before using
    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId: businessId,
        userId: session.user.id
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      businessId: businessId
    }

    if (search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { phone: { contains: search.trim() } },
        { email: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }

    // Get customers with order counts
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              orders: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.customer.count({ where: whereClause })
    ])

    return NextResponse.json({
      customers: customers.map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        tier: customer.tier,
        totalOrders: customer._count.orders,
        addressJson: customer.addressJson,
        tags: customer.tags,
        notes: customer.notes,
        addedByAdmin: customer.addedByAdmin,
        createdAt: customer.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}