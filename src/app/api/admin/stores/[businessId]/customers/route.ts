// src/app/api/admin/stores/[businessId]/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { normalizePhoneNumber, phoneNumbersMatch, isValidPhoneNumber } from '@/lib/phone-utils'


function parseAndCleanAddress(addressJson: any): any {
  if (!addressJson?.street) return addressJson

  const street = addressJson.street.trim()
  
  if (street.includes(',')) {
    const parts = street.split(',').map((part: string) => part.trim())
    const cleanStreet = parts[0]
    
    if (!addressJson.city && parts.length >= 2) {
      let cityPart = parts[1]
      cityPart = cityPart.replace(/\b\d{3,5}\s?\d{0,2}\b/g, '').trim()
      if (cityPart) {
        addressJson.city = cityPart
      }
    }
    
    if (!addressJson.zipCode) {
      const fullAddress = street
      const zipMatches = fullAddress.match(/\b\d{3,5}\s?\d{0,2}\b/g)
      if (zipMatches) {
        addressJson.zipCode = zipMatches[zipMatches.length - 1].replace(/\s+/g, ' ').trim()
      }
    }
    
    if (!addressJson.country || addressJson.country === 'US') {
      const lastPart = parts[parts.length - 1].toLowerCase()
      if (lastPart.includes('albania') || lastPart.includes('al')) {
        addressJson.country = 'AL'
      } else if (lastPart.includes('greece') || lastPart.includes('gr')) {
        addressJson.country = 'GR'
      } else if (lastPart.includes('italy') || lastPart.includes('it')) {
        addressJson.country = 'IT'
      } else if (lastPart.includes('spain') || lastPart.includes('es')) {
        addressJson.country = 'ES'
      }
    }
    
    addressJson.street = cleanStreet
  }
  
  return addressJson
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

    const body = await request.json()
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ message: 'Customer name is required' }, { status: 400 })
    }

    if (!body.phone?.trim()) {
      return NextResponse.json({ message: 'Phone number is required' }, { status: 400 })
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizePhoneNumber(body.phone.trim())
    
    if (!isValidPhoneNumber(normalizedPhone)) {
      return NextResponse.json({ 
        message: 'Invalid phone number format. Phone number must contain at least 10 digits.' 
      }, { status: 400 })
    }

    // Validate email format if provided
    if (body.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email.trim())) {
        return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
      }
    }

    // Check for existing customer using normalized phone matching
    // Get all customers for this business and check normalized phones
    const allCustomers = await prisma.customer.findMany({
      where: {
        businessId: businessId
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true
      }
    })

    // Find customer with matching normalized phone
    const existingCustomer = allCustomers.find(c => phoneNumbersMatch(c.phone, body.phone.trim()))

    if (existingCustomer) {
      return NextResponse.json({ 
        message: `A customer with this phone number already exists: ${existingCustomer.name}${existingCustomer.email ? ` (${existingCustomer.email})` : ''}`,
        existingCustomer: {
          id: existingCustomer.id,
          name: existingCustomer.name,
          phone: existingCustomer.phone,
          email: existingCustomer.email
        }
      }, { status: 409 })
    }

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
      address: null as string | null
    }

    if (body.addressJson && body.addressJson.street?.trim()) {
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

      const addressParts = [
        customerData.addressJson.street,
        customerData.addressJson.additional,
        customerData.addressJson.city,
        customerData.addressJson.zipCode
      ].filter(Boolean)
      customerData.address = addressParts.join(', ')
    }

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
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'recent' // orders, spent, recent, name
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc
    const repeatOnly = searchParams.get('repeatOnly') === 'true' // Only customers with 2+ orders

    const skip = (page - 1) * limit

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

    // Fetch customers with orders for aggregation
    const customersWithOrders = await prisma.customer.findMany({
      where: whereClause,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            paymentStatus: true,
            createdAt: true
          }
        }
      }
    })

    // Calculate aggregations for each customer
    const customersWithStats = customersWithOrders.map(customer => {
      // Only count completed orders for revenue (DELIVERED/PICKED_UP/READY + PAID)
      const completedOrders = customer.orders.filter(o => 
        ['DELIVERED', 'PICKED_UP', 'READY'].includes(o.status) && 
        o.paymentStatus === 'PAID'
      )
      
      const totalOrders = customer.orders.length
      const totalSpent = completedOrders.reduce((sum, o) => sum + o.total, 0)
      const orderDates = customer.orders.map(o => new Date(o.createdAt).getTime())
      const firstOrderDate = orderDates.length > 0 ? new Date(Math.min(...orderDates)) : null
      const lastOrderDate = orderDates.length > 0 ? new Date(Math.max(...orderDates)) : null
      const isRepeatCustomer = totalOrders >= 2

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        tier: customer.tier,
        totalOrders,
        totalSpent,
        firstOrderDate,
        lastOrderDate,
        isRepeatCustomer,
        addressJson: customer.addressJson,
        tags: customer.tags,
        notes: customer.notes,
        addedByAdmin: customer.addedByAdmin,
        createdAt: customer.createdAt
      }
    })

    // Filter for repeat customers if requested
    let filteredCustomers = repeatOnly 
      ? customersWithStats.filter(c => c.isRepeatCustomer)
      : customersWithStats

    // Sort customers based on sortBy parameter
    filteredCustomers.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'orders':
          comparison = a.totalOrders - b.totalOrders
          break
        case 'spent':
          comparison = a.totalSpent - b.totalSpent
          break
        case 'recent':
          const aDate = a.lastOrderDate?.getTime() || a.createdAt.getTime()
          const bDate = b.lastOrderDate?.getTime() || b.createdAt.getTime()
          comparison = aDate - bDate
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    // Paginate results
    const total = filteredCustomers.length
    const paginatedCustomers = filteredCustomers.slice(skip, skip + limit)

    return NextResponse.json({
      customers: paginatedCustomers,
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