// src/app/api/admin/stores/[businessId]/analytics/services/route.ts
// Service analytics API - tracks views, add-to-cart, and conversions for services/appointments
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

interface ServiceAnalyticsData {
  serviceId: string
  serviceName: string
  serviceImage: string | null
  categoryName: string
  views: number
  addToCarts: number
  appointmentsBooked: number      // All appointments (shows customer intent/demand)
  appointmentsCompleted: number   // Only completed appointments + paid
  revenue: number                 // Revenue from completed appointments only
  quantityBooked: number          // Total quantity booked
  quantityCompleted: number       // Quantity from completed appointments
  viewToCartRate: number
  cartToAppointmentRate: number   // Based on appointmentsBooked (customer action)
  conversionRate: number          // Based on appointmentsBooked (customer action)
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

    // Verify business is a salon
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })

    if (business?.businessType !== 'SALON') {
      return NextResponse.json({ message: 'This endpoint is only for salon businesses' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // today, week, month, all
    const limit = parseInt(searchParams.get('limit') || '10')

    // Calculate date range based on period
    let startDate: Date
    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    const now = new Date()
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'all':
      default:
        startDate = new Date(0) // Beginning of time
        break
    }

    // Fetch service events (views and add-to-cart) - filter by services only
    const productEvents = await prisma.productEvent.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        product: {
          isService: true
        }
      },
      select: {
        productId: true,
        eventType: true,
        sessionId: true,
        createdAt: true
      }
    })

    // Aggregate events by service and track which events led to appointments
    const eventsByService = new Map<string, { views: number; addToCarts: number; viewsThatLedToAppointments: number; addToCartsThatLedToAppointments: number }>()
    
    for (const event of productEvents) {
      const existing = eventsByService.get(event.productId) || { views: 0, addToCarts: 0, viewsThatLedToAppointments: 0, addToCartsThatLedToAppointments: 0 }
      if (event.eventType === 'view') {
        existing.views++
      } else if (event.eventType === 'add_to_cart') {
        existing.addToCarts++
      }
      eventsByService.set(event.productId, existing)
    }

    // Fetch ALL orders with service items in the date range (for "Appointments Booked" metric)
    // For salons, orders contain services and appointments are linked to orders
    const allOrders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        items: {
          some: {
            product: {
              isService: true
            }
          }
        }
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        sessionId: true,
        items: {
          where: {
            product: {
              isService: true
            }
          },
          select: {
            productId: true,
            quantity: true,
            price: true
          }
        },
        appointments: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    // Separate completed appointments (for revenue calculation)
    // Completed = appointments with status COMPLETED and order paymentStatus PAID
    const completedOrders = allOrders.filter(order => {
      const hasCompletedAppointment = order.appointments.some(apt => apt.status === 'COMPLETED')
      return hasCompletedAppointment && order.paymentStatus === 'PAID'
    })
    
    // Use allOrders for abandoned cart check (any order counts as conversion)
    const orders = allOrders

    // Aggregate appointment data by service - track both booked and completed separately
    const appointmentsByService = new Map<string, { 
      appointmentsBooked: number; 
      appointmentsCompleted: number; 
      quantityBooked: number;
      quantityCompleted: number; 
      revenue: number 
    }>()
    
    // Count ALL appointments (Appointments Booked) - each order with appointments counts
    for (const order of allOrders) {
      // Count appointments per service in this order
      const serviceAppointments = new Map<string, number>()
      for (const item of order.items) {
        // Each item represents a service booking
        const existing = appointmentsByService.get(item.productId) || { 
          appointmentsBooked: 0, 
          appointmentsCompleted: 0, 
          quantityBooked: 0,
          quantityCompleted: 0, 
          revenue: 0 
        }
        existing.appointmentsBooked += item.quantity // Each quantity = 1 appointment
        existing.quantityBooked += item.quantity
        appointmentsByService.set(item.productId, existing)
      }
    }
    
    // Count completed appointments and revenue separately
    for (const order of completedOrders) {
      for (const item of order.items) {
        const existing = appointmentsByService.get(item.productId) || { 
          appointmentsBooked: 0, 
          appointmentsCompleted: 0, 
          quantityBooked: 0,
          quantityCompleted: 0, 
          revenue: 0 
        }
        existing.appointmentsCompleted += item.quantity
        existing.quantityCompleted += item.quantity
        existing.revenue += item.price * item.quantity
        appointmentsByService.set(item.productId, existing)
      }
    }

    // Calculate abandoned cart rate
    // Definition: Sessions with add_to_cart but no order with matching sessionId
    const addToCartSessions = new Map<string, { serviceIds: Set<string> }>()
    
    for (const event of productEvents) {
      if (event.eventType === 'add_to_cart' && event.sessionId) {
        const existing = addToCartSessions.get(event.sessionId) || { 
          serviceIds: new Set<string>()
        }
        existing.serviceIds.add(event.productId)
        addToCartSessions.set(event.sessionId, existing)
      }
    }

    // Create a set of sessionIds that have orders (for fast lookup)
    const sessionsWithOrders = new Set<string>()
    // Also track which services were booked per session for accurate conversion tracking
    const sessionsWithOrdersByService = new Map<string, Set<string>>()
    for (const order of orders) {
      if (order.sessionId) {
        sessionsWithOrders.add(order.sessionId)
        // Track which services were booked in this session
        const serviceIds = new Set(order.items.map(item => item.productId))
        sessionsWithOrdersByService.set(order.sessionId, serviceIds)
      }
    }

    // Track which events led to appointments (for accurate conversion rates)
    for (const event of productEvents) {
      if (!event.sessionId) continue
      
      const serviceId = event.productId
      const existing = eventsByService.get(serviceId)
      if (!existing) continue
      
      // Check if this sessionId has an order that includes this service
      const sessionServiceIds = sessionsWithOrdersByService.get(event.sessionId)
      if (sessionServiceIds && sessionServiceIds.has(serviceId)) {
        if (event.eventType === 'view') {
          existing.viewsThatLedToAppointments++
        } else if (event.eventType === 'add_to_cart') {
          existing.addToCartsThatLedToAppointments++
        }
        eventsByService.set(serviceId, existing)
      }
    }

    // Check which sessions resulted in orders (direct link via sessionId)
    let abandonedCarts = 0
    let convertedCarts = 0

    for (const [sessionId, cartData] of addToCartSessions) {
      // Direct link: check if this sessionId has any order
      if (sessionsWithOrders.has(sessionId)) {
        // Verify the order contains at least one service from the cart
        const hasMatchingOrder = orders.some(order => 
          order.sessionId === sessionId && 
          order.items.some(item => cartData.serviceIds.has(item.productId))
        )
        
        if (hasMatchingOrder) {
          convertedCarts++
        } else {
          // Session has order but not for these services - still counts as converted
          convertedCarts++
        }
      } else {
        abandonedCarts++
      }
    }

    const totalCartSessions = abandonedCarts + convertedCarts
    const abandonedCartRate = totalCartSessions > 0
      ? Math.round((abandonedCarts / totalCartSessions) * 1000) / 10
      : 0

    // Get all service IDs that have any activity
    const allServiceIds = new Set([
      ...eventsByService.keys(),
      ...appointmentsByService.keys()
    ])

    // Fetch service details (services are products with isService: true)
    const services = await prisma.product.findMany({
      where: {
        id: { in: Array.from(allServiceIds) },
        businessId,
        isService: true
      },
      select: {
        id: true,
        name: true,
        images: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    const serviceMap = new Map(services.map(s => [s.id, s]))

    // Build analytics data for each service
    const analyticsData: ServiceAnalyticsData[] = []
    
    for (const serviceId of allServiceIds) {
      const service = serviceMap.get(serviceId)
      if (!service) continue // Skip if service no longer exists

      const events = eventsByService.get(serviceId) || { views: 0, addToCarts: 0, viewsThatLedToAppointments: 0, addToCartsThatLedToAppointments: 0 }
      const appointmentData = appointmentsByService.get(serviceId) || { 
        appointmentsBooked: 0, 
        appointmentsCompleted: 0, 
        quantityBooked: 0,
        quantityCompleted: 0, 
        revenue: 0 
      }

      const viewToCartRate = events.views > 0 
        ? (events.addToCarts / events.views) * 100 
        : 0
      
      // Use sessionId linking for accurate conversion rates (direct link via sessionId)
      const cartToAppointmentRate = events.addToCarts > 0 
        ? (events.addToCartsThatLedToAppointments / events.addToCarts) * 100 
        : 0
      
      const conversionRate = events.views > 0 
        ? (events.viewsThatLedToAppointments / events.views) * 100 
        : 0

      analyticsData.push({
        serviceId,
        serviceName: service.name,
        serviceImage: service.images[0] || null,
        categoryName: service.category?.name || 'Uncategorized',
        views: events.views,
        addToCarts: events.addToCarts,
        appointmentsBooked: appointmentData.appointmentsBooked,
        appointmentsCompleted: appointmentData.appointmentsCompleted,
        revenue: appointmentData.revenue,
        quantityBooked: appointmentData.quantityBooked,
        quantityCompleted: appointmentData.quantityCompleted,
        viewToCartRate: Math.round(viewToCartRate * 10) / 10,
        cartToAppointmentRate: Math.round(cartToAppointmentRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10
      })
    }

    // Calculate totals
    const totalViews = analyticsData.reduce((sum, s) => sum + s.views, 0)
    const totalAddToCarts = analyticsData.reduce((sum, s) => sum + s.addToCarts, 0)
    // Count unique appointments (orders with appointments)
    const totalAppointmentsBooked = allOrders.length
    const totalAppointmentsCompleted = completedOrders.length
    const totalRevenue = analyticsData.reduce((sum, s) => sum + s.revenue, 0)
    
    const overallViewToCartRate = totalViews > 0 
      ? Math.round((totalAddToCarts / totalViews) * 1000) / 10 
      : 0
    
    // Use appointmentsBooked for conversion rates (customer action)
    const overallCartToAppointmentRate = totalAddToCarts > 0 
      ? Math.round((totalAppointmentsBooked / totalAddToCarts) * 1000) / 10 
      : 0
    
    const overallConversionRate = totalViews > 0 
      ? Math.round((totalAppointmentsBooked / totalViews) * 1000) / 10 
      : 0

    // Sort and slice for different lists - use appointmentsBooked for sorting
    const bestSellers = [...analyticsData]
      .sort((a, b) => b.appointmentsBooked - a.appointmentsBooked)
      .slice(0, limit)

    const mostViewed = [...analyticsData]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    // Opportunity services: high views (>10) but low conversion (<5%)
    const opportunityServices = [...analyticsData]
      .filter(s => s.views >= 10 && s.conversionRate < 5)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    // Low performing: services with add-to-carts but no appointments booked
    const lowPerforming = [...analyticsData]
      .filter(s => s.addToCarts > 0 && s.appointmentsBooked === 0)
      .sort((a, b) => b.addToCarts - a.addToCarts)
      .slice(0, limit)

    return NextResponse.json({
      data: {
        summary: {
          totalViews,
          totalAddToCarts,
          totalAppointmentsBooked,     // All appointments (customer intent)
          totalAppointmentsCompleted,  // Completed appointments only
          totalRevenue,                // From completed appointments only
          overallViewToCartRate,
          overallCartToAppointmentRate,
          overallConversionRate,
          uniqueServices: analyticsData.length,
          // Abandoned cart metrics
          abandonedCarts,
          convertedCarts,
          totalCartSessions,
          abandonedCartRate
        },
        bestSellers,
        mostViewed,
        opportunityServices,
        lowPerforming,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error fetching service analytics:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
