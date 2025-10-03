// src/app/api/admin/stores/[businessId]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

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
      }
    }
    
    addressJson.street = cleanStreet
  }
  
  return addressJson
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
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const customerId = searchParams.get('customer') || ''

    const skip = (page - 1) * limit

    const whereClause: any = {
      businessId: businessId
    }

    if (search.trim()) {
      whereClause.OR = [
        { orderNumber: { contains: search.trim(), mode: 'insensitive' } },
        { customer: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { customer: { phone: { contains: search.trim() } } }
      ]
    }

    if (status) {
      whereClause.status = status
    }

    if (type) {
      whereClause.type = type
    }

    if (customerId) {
      whereClause.customerId = customerId
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true
                }
              },
              variant: {
                select: {
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              items: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ])

    const customerIds = [...new Set(orders.map(order => order.customer.id))]
    const customerOrderCounts = await prisma.order.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: customerIds },
        businessId: businessId
      },
      _count: {
        id: true
      }
    })

    const orderCountMap = customerOrderCounts.reduce((acc, item) => {
      acc[item.customerId] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { currency: true }
    })

    return NextResponse.json({
      orders: orders.map(order => {
        const customerOrderCount = orderCountMap[order.customer.id] || 1
        const isFirstOrder = customerOrderCount === 1

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          type: order.type,
          total: order.total,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          createdByAdmin: order.createdByAdmin,
          customer: {
            ...order.customer,
            isFirstOrder,
            orderCount: customerOrderCount
          },
          itemCount: order._count.items,
          items: order.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            productName: item.product.name,
            variantName: item.variant?.name || null
          })),
          deliveryAddress: order.deliveryAddress,
          notes: order.notes,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      currency: business?.currency || 'USD'
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
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

    const body = await request.json()
    
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { deliveryZones: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ message: 'Order must contain at least one item' }, { status: 400 })
    }

    if (body.orderType === 'DELIVERY' && !body.deliveryAddress) {
      return NextResponse.json({ message: 'Delivery address is required for delivery orders' }, { status: 400 })
    }

    let customerId: string

    if (body.customerId) {
      customerId = body.customerId
      
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          businessId: businessId
        }
      })

      if (!customer) {
        return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
      }
    } else if (body.newCustomer) {
      const newCustomerData = body.newCustomer

      if (!newCustomerData.name?.trim() || !newCustomerData.phone?.trim()) {
        return NextResponse.json({ message: 'Customer name and phone are required' }, { status: 400 })
      }

      const existingCustomer = await prisma.customer.findFirst({
        where: {
          phone: newCustomerData.phone.trim(),
          businessId: businessId
        }
      })

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        let customerAddressJson = null
        let customerAddress = null

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

          customerAddressJson = cleanedAddress

          const addressParts = [
            customerAddressJson.street,
            customerAddressJson.additional,
            customerAddressJson.city,
            customerAddressJson.zipCode
          ].filter(Boolean)
          customerAddress = addressParts.join(', ')
        }

        const newCustomer = await prisma.customer.create({
          data: {
            name: newCustomerData.name.trim(),
            phone: newCustomerData.phone.trim(),
            email: newCustomerData.email?.trim() || null,
            businessId: businessId,
            tier: newCustomerData.tier || 'REGULAR',
            addedByAdmin: true,
            addressJson: customerAddressJson,
            address: customerAddress
          }
        })

        customerId = newCustomer.id
      }
    } else {
      return NextResponse.json({ message: 'Customer information is required' }, { status: 400 })
    }

    const orderItems = []
    let subtotal = 0

    for (const item of body.items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          businessId: businessId,
          isActive: true
        },
        include: {
          variants: true,
          modifiers: true
        }
      })

      if (!product) {
        return NextResponse.json({ message: `Product not found: ${item.productId}` }, { status: 404 })
      }

      let availableStock = product.stock
      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId)
        if (!variant) {
          return NextResponse.json({ message: `Product variant not found: ${item.variantId}` }, { status: 404 })
        }
        availableStock = variant.stock
      }

      if (product.trackInventory && availableStock < item.quantity) {
        return NextResponse.json({ 
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}` 
        }, { status: 400 })
      }

      let itemPrice = item.variantId ? 
        product.variants.find(v => v.id === item.variantId)?.price || product.price : 
        product.price

      if (item.modifiers && item.modifiers.length > 0) {
        for (const modifierId of item.modifiers) {
          const modifier = product.modifiers.find(m => m.id === modifierId)
          if (modifier) {
            itemPrice += modifier.price
          }
        }
      }

      const totalItemPrice = itemPrice * item.quantity
      subtotal += totalItemPrice

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        price: itemPrice,
        modifiers: item.modifiers || []
      })
    }

    let deliveryFee = 0
    let customerLatitude = null
    let customerLongitude = null

    if (body.orderType === 'DELIVERY') {
      deliveryFee = body.deliveryFee || business.deliveryFee || 0

      if (body.addressJson?.latitude && body.addressJson?.longitude) {
        customerLatitude = body.addressJson.latitude
        customerLongitude = body.addressJson.longitude

        if (business.storeLatitude && business.storeLongitude) {
          const distance = calculateDistance(
            business.storeLatitude,
            business.storeLongitude,
            customerLatitude,
            customerLongitude
          )

          const applicableZone = business.deliveryZones
            .filter(zone => zone.isActive)
            .find(zone => distance <= zone.maxDistance)

          if (applicableZone) {
            deliveryFee = applicableZone.fee
          } else if (distance > business.deliveryRadius) {
            return NextResponse.json({ 
              message: `Delivery address is outside delivery radius (${business.deliveryRadius}km)` 
            }, { status: 400 })
          }
        }
      }
    }

    const total = subtotal + deliveryFee

    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const orderNumber = business.orderNumberFormat.replace('{number}', `${timestamp}${random}`)

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        type: body.orderType,
        customerId,
        businessId,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: body.orderType === 'DELIVERY' ? body.deliveryAddress : null,
        deliveryTime: body.scheduledTime ? new Date(body.scheduledTime) : null,
        notes: body.notes || null,
        paymentMethod: body.paymentMethod || null,
        paymentStatus: 'PENDING',
        customerLatitude,
        customerLongitude,
        createdByAdmin: true,
        createdBy: access.session.user.id,
        items: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      }
    })

    for (const item of orderItems) {
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId }
        })
        
        if (variant) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          })

          await prisma.inventoryActivity.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              businessId,
              type: 'ORDER_SALE',
              quantity: -item.quantity,
              oldStock: variant.stock,
              newStock: variant.stock - item.quantity,
              reason: `Order sale - ${orderNumber}`,
              changedBy: access.session.user.id
            }
          })
        }
      } else {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })

        if (product) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          })

          await prisma.inventoryActivity.create({
            data: {
              productId: item.productId,
              businessId,
              type: 'ORDER_SALE',
              quantity: -item.quantity,
              oldStock: product.stock,
              newStock: product.stock - item.quantity,
              reason: `Order sale - ${orderNumber}`,
              changedBy: access.session.user.id
            }
          })
        }
      }
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        total: order.total,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email
        },
        createdAt: order.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}