// app/api/superadmin/leads/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get date ranges
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total leads
    const totalLeads = await prisma.lead.count()

    // Leads by status
    const statusStats = await prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    // Leads by source
    const sourceStats = await prisma.lead.groupBy({
      by: ['source'],
      _count: { source: true }
    })

    // Leads by priority
    const priorityStats = await prisma.lead.groupBy({
      by: ['priority'],
      _count: { priority: true }
    })

    // Leads created today
    const leadsToday = await prisma.lead.count({
      where: { createdAt: { gte: startOfDay } }
    })

    // Leads created this week
    const leadsThisWeek = await prisma.lead.count({
      where: { createdAt: { gte: startOfWeek } }
    })

    // Leads created this month
    const leadsThisMonth = await prisma.lead.count({
      where: { createdAt: { gte: startOfMonth } }
    })

    // Conversion rate (WON / (WON + LOST))
    const wonCount = await prisma.lead.count({ where: { status: 'WON' } })
    const lostCount = await prisma.lead.count({ where: { status: 'LOST' } })
    const conversionRate = wonCount + lostCount > 0 
      ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(1)
      : '0'

    // Leads due for follow-up today
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)
    const followUpsToday = await prisma.lead.count({
      where: {
        nextFollowUpAt: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: {
          notIn: ['WON', 'LOST', 'STALE']
        }
      }
    })

    // Overdue follow-ups
    const overdueFollowUps = await prisma.lead.count({
      where: {
        nextFollowUpAt: {
          lt: startOfDay
        },
        status: {
          notIn: ['WON', 'LOST', 'STALE']
        }
      }
    })

    // Unassigned leads
    const unassignedLeads = await prisma.lead.count({
      where: {
        assignedToId: null,
        status: {
          notIn: ['WON', 'LOST', 'STALE']
        }
      }
    })

    // Stale leads count
    const staleLeads = await prisma.lead.count({
      where: { status: 'STALE' }
    })

    // Leads by team member
    const teamStats = await prisma.lead.groupBy({
      by: ['assignedToId'],
      where: {
        assignedToId: { not: null }
      },
      _count: { assignedToId: true }
    })

    // Get team member names
    const teamMemberIds = teamStats.map(t => t.assignedToId).filter(Boolean) as string[]
    const teamMembers = await prisma.user.findMany({
      where: { id: { in: teamMemberIds } },
      select: { id: true, name: true, email: true }
    })

    const teamStatsWithNames = teamStats.map(stat => {
      const member = teamMembers.find(m => m.id === stat.assignedToId)
      return {
        id: stat.assignedToId,
        name: member?.name || member?.email || 'Unknown',
        count: stat._count.assignedToId
      }
    })

    // Leads created per day (last 30 days)
    const leadsLast30Days = await prisma.lead.findMany({
      where: { createdAt: { gte: last30Days } },
      select: { createdAt: true }
    })

    // Group by day
    const leadsByDay: Record<string, number> = {}
    leadsLast30Days.forEach(lead => {
      const day = lead.createdAt.toISOString().split('T')[0]
      leadsByDay[day] = (leadsByDay[day] || 0) + 1
    })

    // Estimated pipeline value (exclude closed and stale leads)
    const pipelineValue = await prisma.lead.aggregate({
      where: {
        status: { notIn: ['WON', 'LOST', 'STALE'] },
        estimatedValue: { not: null }
      },
      _sum: { estimatedValue: true }
    })

    // Average lead score
    const avgScore = await prisma.lead.aggregate({
      _avg: { score: true }
    })

    // Recent conversions
    const recentConversions = await prisma.lead.findMany({
      where: {
        status: 'WON',
        convertedAt: { not: null }
      },
      orderBy: { convertedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        company: true,
        convertedAt: true,
        estimatedValue: true
      }
    })

    return NextResponse.json({
      overview: {
        totalLeads,
        leadsToday,
        leadsThisWeek,
        leadsThisMonth,
        conversionRate: `${conversionRate}%`,
        followUpsToday,
        overdueFollowUps,
        unassignedLeads,
        staleLeads,
        pipelineValue: pipelineValue._sum.estimatedValue || 0,
        avgScore: Math.round(avgScore._avg.score || 0)
      },
      byStatus: statusStats.reduce((acc, item) => {
        acc[item.status.toLowerCase()] = item._count.status
        return acc
      }, {} as Record<string, number>),
      bySource: sourceStats.reduce((acc, item) => {
        acc[item.source.toLowerCase()] = item._count.source
        return acc
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, item) => {
        acc[item.priority.toLowerCase()] = item._count.priority
        return acc
      }, {} as Record<string, number>),
      byTeamMember: teamStatsWithNames,
      leadsByDay,
      recentConversions
    })

  } catch (error) {
    console.error('Error fetching lead stats:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
