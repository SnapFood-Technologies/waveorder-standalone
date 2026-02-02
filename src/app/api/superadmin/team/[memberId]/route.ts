// app/api/superadmin/team/[memberId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params

    const teamMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        assignedLeads: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            company: true,
            status: true,
            priority: true,
            createdAt: true
          }
        },
        assignedBusinesses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            assignedLeads: true,
            assignedBusinesses: true
          }
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ message: 'Team member not found' }, { status: 404 })
    }

    // Calculate performance metrics
    const leadStats = await prisma.lead.groupBy({
      by: ['status'],
      where: { teamMemberId: memberId },
      _count: { status: true }
    })

    const wonLeads = leadStats.find(s => s.status === 'WON')?._count.status || 0
    const lostLeads = leadStats.find(s => s.status === 'LOST')?._count.status || 0
    const totalClosed = wonLeads + lostLeads
    const conversionRate = totalClosed > 0 ? ((wonLeads / totalClosed) * 100).toFixed(1) : '0'

    return NextResponse.json({
      teamMember,
      performance: {
        leadsByStatus: leadStats.reduce((acc, item) => {
          acc[item.status.toLowerCase()] = item._count.status
          return acc
        }, {} as Record<string, number>),
        conversionRate: `${conversionRate}%`,
        totalWon: wonLeads,
        totalLost: lostLeads
      }
    })

  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params
    const data = await request.json()

    // Check if team member exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { id: memberId }
    })

    if (!existingMember) {
      return NextResponse.json({ message: 'Team member not found' }, { status: 404 })
    }

    // If email changed, check for duplicates
    if (data.email && data.email.toLowerCase() !== existingMember.email) {
      const emailExists = await prisma.teamMember.findUnique({
        where: { email: data.email.toLowerCase() }
      })
      if (emailExists) {
        return NextResponse.json(
          { message: 'A team member with this email already exists' },
          { status: 400 }
        )
      }
    }

    // If userId changed, check it's not already linked
    if (data.userId && data.userId !== existingMember.userId) {
      const existingLink = await prisma.teamMember.findFirst({
        where: { userId: data.userId }
      })
      if (existingLink) {
        return NextResponse.json(
          { message: 'This user is already linked to another team member' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    
    const allowedFields = [
      'name', 'email', 'phone', 'avatar', 'title', 'role', 'department',
      'userId', 'country', 'city', 'timezone', 'territory', 'region', 'countries', 
      'monthlyLeadQuota', 'monthlyRevenueTarget', 'quarterlyTarget', 'isActive', 
      'startDate', 'bio', 'skills', 'notes', 'totalLeadsAssigned', 
      'totalLeadsConverted', 'totalRevenue', 'conversionRate'
    ]

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'email') {
          updateData[field] = data[field].toLowerCase()
        } else if (field === 'startDate' && data[field]) {
          updateData[field] = new Date(data[field])
        } else if (field === 'userId' && data[field] === '') {
          updateData[field] = null
        } else {
          updateData[field] = data[field]
        }
      }
    })

    // Update team member
    const teamMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            assignedLeads: true,
            assignedBusinesses: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, teamMember })

  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params

    // Check if team member exists
    const teamMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        _count: {
          select: {
            assignedLeads: true,
            assignedBusinesses: true
          }
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ message: 'Team member not found' }, { status: 404 })
    }

    // Check if member has assignments
    if (teamMember._count.assignedLeads > 0 || teamMember._count.assignedBusinesses > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete team member with assigned leads or businesses. Please reassign them first.',
          assignedLeads: teamMember._count.assignedLeads,
          assignedBusinesses: teamMember._count.assignedBusinesses
        },
        { status: 400 }
      )
    }

    // Delete team member
    await prisma.teamMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true, message: 'Team member deleted successfully' })

  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
