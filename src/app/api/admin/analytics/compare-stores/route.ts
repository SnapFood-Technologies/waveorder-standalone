// src/app/api/admin/analytics/compare-stores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get all businesses for this user
    const businessUsers = await prisma.businessUser.findMany({
      where: { userId: session.user.id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            currency: true,
            businessType: true
          }
        }
      }
    })

    if (businessUsers.length < 2) {
      return NextResponse.json({ 
        message: 'Need at least 2 stores to compare',
        stores: []
      })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get stats for each business
    const storeStats = await Promise.all(
      businessUsers.map(async (bu) => {
        const businessId = bu.business.id
        const isSalon = bu.business.businessType === 'SALON' || bu.business.businessType === 'SERVICES'

        // Get orders/appointments in period
        const orders = await prisma.order.findMany({
          where: {
            businessId,
            createdAt: { gte: startDate }
          },
          select: {
            total: true,
            status: true,
            paymentStatus: true,
            type: true
          }
        })

        // For salons, count appointments instead of orders
        let totalOrders = orders.length
        let totalAppointments = 0
        if (isSalon) {
          totalAppointments = await prisma.appointment.count({
            where: {
              businessId,
              appointmentDate: { gte: startDate }
            }
          })
          totalOrders = totalAppointments
        }

        // Calculate revenue - for salons, use appointment-linked orders
        let totalRevenue = 0
        if (isSalon) {
          // Get revenue from orders linked to COMPLETED appointments with PAID status
          const appointmentOrders = await prisma.appointment.findMany({
            where: {
              businessId,
              appointmentDate: { gte: startDate },
              status: 'COMPLETED' // Only completed appointments count as revenue
            },
            include: {
              order: {
                select: {
                  total: true,
                  status: true,
                  paymentStatus: true
                }
              }
            }
          })
          // Filter for paid orders only
          totalRevenue = appointmentOrders
            .filter(apt => apt.order && apt.order.paymentStatus === 'PAID')
            .reduce((sum, apt) => sum + (apt.order?.total || 0), 0)
        } else {
          // For non-salons: Revenue from paid orders that are completed/fulfilled
          // - DELIVERY orders: DELIVERED + PAID
          // - PICKUP orders: PICKED_UP + PAID
          // - DINE_IN orders: PICKED_UP + PAID
          totalRevenue = orders
            .filter(o => {
              if (o.paymentStatus !== 'PAID') return false
              if (o.status === 'CANCELLED' || o.status === 'RETURNED' || o.status === 'REFUNDED') return false
              
              if (o.type === 'DELIVERY') {
                return o.status === 'DELIVERED'
              } else if (o.type === 'PICKUP' || o.type === 'DINE_IN') {
                return o.status === 'PICKED_UP'
              }
              
              return false
            })
            .reduce((sum, o) => sum + o.total, 0)
        }

        // Get product/service count
        let productCount = await prisma.product.count({
          where: { 
            businessId, 
            isActive: true,
            ...(isSalon ? { isService: true } : { isService: false })
          }
        })
        let serviceCount = isSalon ? productCount : 0

        // Get customer count
        const customerCount = await prisma.customer.count({
          where: { businessId }
        })

        // Get page views (if tracking exists)
        const pageViews = await prisma.visitorSession.count({
          where: {
            businessId,
            createdAt: { gte: startDate }
          }
        })

        return {
          id: bu.business.id,
          name: bu.business.name,
          slug: bu.business.slug,
          logo: bu.business.logo,
          currency: bu.business.currency,
          businessType: bu.business.businessType,
          stats: {
            orders: totalOrders,
            appointments: totalAppointments,
            revenue: totalRevenue,
            products: productCount,
            services: serviceCount,
            customers: customerCount,
            views: pageViews,
            avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            avgAppointmentValue: isSalon && totalAppointments > 0 ? totalRevenue / totalAppointments : 0
          }
        }
      })
    )

    return NextResponse.json({
      stores: storeStats,
      period: parseInt(period),
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching store comparison:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
