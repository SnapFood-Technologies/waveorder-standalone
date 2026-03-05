// Global WaveOrder Flows overview for SuperAdmin
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const excludeTest = { NOT: { testMode: true } }

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    const now = new Date()
    const endDate = new Date(now)
    endDate.setHours(23, 59, 59, 999)
    let startDate: Date
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
        startDate = new Date(0)
        break
    }

    const dateFilter = { gte: startDate, lte: endDate }

    const [
      flowsEnabledCount,
      businessPlanCount,
      totalConversations,
      messagesInPeriod,
      businessesWithFlows
    ] = await Promise.all([
      prisma.whatsAppSettings.count({
        where: { isEnabled: true, business: excludeTest }
      }),
      prisma.business.count({
        where: {
          subscriptionPlan: 'BUSINESS',
          isActive: true,
          ...excludeTest
        }
      }),
      prisma.whatsAppConversation.count({
        where: { business: excludeTest }
      }),
      prisma.whatsAppMessage.count({
        where: {
          createdAt: dateFilter,
          conversation: { business: excludeTest }
        }
      }),
      prisma.business.findMany({
        where: {
          whatsappSettings: { isEnabled: true },
          ...excludeTest
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          subscriptionPlan: true,
          _count: {
            select: {
              whatsappConversations: true
            }
          }
        }
      })
    ])

    const adoptionRate =
      businessPlanCount > 0 ? Math.round((flowsEnabledCount / businessPlanCount) * 100) : 0

    const topBusinesses = businessesWithFlows
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo ?? null,
        subscriptionPlan: b.subscriptionPlan,
        conversationsCount: b._count.whatsappConversations
      }))
      .sort((a, b) => b.conversationsCount - a.conversationsCount)
      .slice(0, 20)

    return NextResponse.json({
      period,
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        flowsEnabled: flowsEnabledCount,
        businessPlanCount,
        adoptionRate,
        totalConversations,
        messagesInPeriod
      },
      topBusinesses
    })
  } catch (error) {
    console.error('[superadmin] flows-overview:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
