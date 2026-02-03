// app/api/superadmin/leads/route.ts
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'
    const source = searchParams.get('source') || 'all'
    const priority = searchParams.get('priority') || 'all'
    const assignedTo = searchParams.get('assignedTo') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status !== 'all') {
      whereConditions.status = status.toUpperCase()
    }

    if (source !== 'all') {
      whereConditions.source = source.toUpperCase()
    }

    if (priority !== 'all') {
      whereConditions.priority = priority.toUpperCase()
    }

    if (assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        whereConditions.assignedToId = null
      } else {
        whereConditions.assignedToId = assignedTo
      }
    }

    // Get leads with pagination
    const [leads, totalCount] = await Promise.all([
      prisma.lead.findMany({
        where: whereConditions,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          teamMember: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true
            }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          _count: {
            select: { activities: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.lead.count({ where: whereConditions })
    ])

    // Fetch converted businesses for leads that have convertedToId
    const convertedBusinessIds = leads
      .filter(lead => lead.convertedToId)
      .map(lead => lead.convertedToId as string)
    
    const convertedBusinesses = convertedBusinessIds.length > 0
      ? await prisma.business.findMany({
          where: { id: { in: convertedBusinessIds } },
          select: {
            id: true,
            name: true,
            slug: true,
            subscriptionPlan: true,
            createdAt: true
          }
        })
      : []
    
    // Map businesses to leads
    const businessMap = new Map(convertedBusinesses.map(b => [b.id, b]))
    const leadsWithBusinesses = leads.map(lead => ({
      ...lead,
      convertedTo: lead.convertedToId ? businessMap.get(lead.convertedToId) || null : null
    }))

    // Get summary statistics
    const stats = await prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    const statusCounts = stats.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status
      return acc
    }, {} as Record<string, number>)

    // Get total leads by source
    const sourceStats = await prisma.lead.groupBy({
      by: ['source'],
      _count: { source: true }
    })

    const sourceCounts = sourceStats.reduce((acc, item) => {
      acc[item.source.toLowerCase()] = item._count.source
      return acc
    }, {} as Record<string, number>)

    // Get all active team members for assignment dropdown
    const teamMembersFromModel = await prisma.teamMember.findMany({
      where: { 
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        _count: {
          select: { assignedLeads: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Also get SuperAdmin users for backwards compatibility
    const teamMembers = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: { assignedLeads: true }
        }
      }
    })

    return NextResponse.json({
      leads: leadsWithBusinesses,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        byStatus: statusCounts,
        bySource: sourceCounts
      },
      teamMembers,
      salesTeam: teamMembersFromModel
    })

  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      )
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        country: data.country || null,
        source: data.source || 'WEBSITE',
        sourceDetail: data.sourceDetail || null,
        referredBy: data.referredBy || null,
        status: data.status || 'NEW',
        priority: data.priority || 'MEDIUM',
        score: data.score || 0,
        assignedToId: data.assignedToId || null,
        assignedAt: data.assignedToId || data.teamMemberId ? new Date() : null,
        teamMemberId: data.teamMemberId || null,
        businessType: data.businessType || null,
        estimatedValue: data.estimatedValue || null,
        expectedPlan: data.expectedPlan || null,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        notes: data.notes || null,
        tags: data.tags || [],
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        landingPage: data.landingPage || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        teamMember: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Create initial activity
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'CREATED',
        title: 'Lead created',
        description: `Lead "${lead.name}" was created by ${session.user.name || session.user.email}`,
        performedById: session.user.id,
        performedBy: session.user.name || session.user.email || 'Unknown'
      }
    })

    return NextResponse.json(
      { success: true, lead },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
