// src/app/api/admin/stores/[businessId]/customers/[customerId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, customerId } = await params

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

    // Get customer with order statistics
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId
      },
      include: {
        orders: {
          select: {
            total: true,
            createdAt: true,
            status: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    // Calculate customer statistics
    const completedOrders = customer.orders.filter(order => 
      ['DELIVERED', 'READY'].includes(order.status)
    )
    
    const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0
    const lastOrderDate = customer.orders.length > 0 
      ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : null

    const stats = {
      totalOrders: customer._count.orders,
      totalSpent,
      averageOrderValue,
      lastOrderDate
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        tier: customer.tier,
        addressJson: customer.addressJson,
        tags: customer.tags,
        notes: customer.notes,
        addedByAdmin: customer.addedByAdmin,
        totalOrders: customer._count.orders,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      },
      stats
    })

  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, customerId } = await params

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

    // Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    // Check if phone number is taken by another customer
    if (body.phone.trim() !== existingCustomer.phone) {
      const phoneInUse = await prisma.customer.findFirst({
        where: {
          phone: body.phone.trim(),
          businessId: businessId,
          id: { not: customerId }
        }
      })

      if (phoneInUse) {
        return NextResponse.json({ message: 'A customer with this phone number already exists' }, { status: 409 })
      }
    }

    // Prepare customer data
    const customerData = {
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || null,
      tier: body.tier || 'REGULAR',
      tags: body.tags || [],
      notes: body.notes?.trim() || null,
      addressJson: null as any,
      address: null as string | null // Keep for backward compatibility
    }

    // Handle address data
    if (body.addressJson && body.addressJson.street?.trim()) {
      customerData.addressJson = {
        street: body.addressJson.street.trim(),
        additional: body.addressJson.additional?.trim() || '',
        zipCode: body.addressJson.zipCode?.trim() || '',
        city: body.addressJson.city?.trim() || '',
        country: body.addressJson.country || 'USA',
        latitude: body.addressJson.latitude || null,
        longitude: body.addressJson.longitude || null
      }

      // Create backward-compatible address string
      const addressParts = [
        customerData.addressJson.street,
        customerData.addressJson.additional,
        customerData.addressJson.city,
        customerData.addressJson.zipCode
      ].filter(Boolean)
      customerData.address = addressParts.join(', ')
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: customerId
      },
      data: customerData
    })

    return NextResponse.json({ 
      customer: {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        email: updatedCustomer.email,
        tier: updatedCustomer.tier,
        updatedAt: updatedCustomer.updatedAt
      }
    })

  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, customerId } = await params

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

    // Check if customer exists and get order count
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId: businessId
      },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    }

    // Check if customer has orders
    if (customer._count.orders > 0) {
      return NextResponse.json({ 
        message: 'Cannot delete customer with existing orders. Consider archiving instead.' 
      }, { status: 400 })
    }

    // Delete customer
    await prisma.customer.delete({
      where: {
        id: customerId
      }
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })

  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}