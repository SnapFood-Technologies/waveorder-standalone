// app/api/superadmin/team/route.ts
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
    const role = searchParams.get('role') || 'all'
    const department = searchParams.get('department') || 'all'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where conditions
    const whereConditions: any = {}

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { territory: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role !== 'all') {
      whereConditions.role = role.toUpperCase()
    }

    if (department !== 'all') {
      whereConditions.department = department.toUpperCase()
    }

    if (status !== 'all') {
      whereConditions.isActive = status === 'active'
    }

    // Get team members with pagination
    const [teamMembers, totalCount] = await Promise.all([
      prisma.teamMember.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              assignedLeads: true,
              assignedBusinesses: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { name: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.teamMember.count({ where: whereConditions })
    ])

    // Get summary by role
    const roleStats = await prisma.teamMember.groupBy({
      by: ['role'],
      where: { isActive: true },
      _count: { role: true }
    })

    // Get summary by department
    const departmentStats = await prisma.teamMember.groupBy({
      by: ['department'],
      where: { isActive: true, department: { not: null } },
      _count: { department: true }
    })

    // Get available users (SuperAdmins not linked to team members)
    const linkedUserIds = await prisma.teamMember.findMany({
      where: { userId: { not: null } },
      select: { userId: true }
    })
    
    const availableUsers = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        id: { notIn: linkedUserIds.map(t => t.userId!).filter(Boolean) }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return NextResponse.json({
      teamMembers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: totalCount,
        active: await prisma.teamMember.count({ where: { isActive: true } }),
        byRole: roleStats.reduce((acc, item) => {
          acc[item.role.toLowerCase()] = item._count.role
          return acc
        }, {} as Record<string, number>),
        byDepartment: departmentStats.reduce((acc, item) => {
          if (item.department) {
            acc[item.department.toLowerCase()] = item._count.department
          }
          return acc
        }, {} as Record<string, number>)
      },
      availableUsers
    })

  } catch (error) {
    console.error('Error fetching team members:', error)
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
    if (!data.name || !data.email || !data.role) {
      return NextResponse.json(
        { message: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { email: data.email.toLowerCase() }
    })

    if (existingMember) {
      return NextResponse.json(
        { message: 'A team member with this email already exists' },
        { status: 400 }
      )
    }

    // If userId provided, check it's not already linked
    if (data.userId) {
      const existingLink = await prisma.teamMember.findUnique({
        where: { userId: data.userId }
      })
      if (existingLink) {
        return NextResponse.json(
          { message: 'This user is already linked to another team member' },
          { status: 400 }
        )
      }
    }

    // Create the team member
    const teamMember = await prisma.teamMember.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        avatar: data.avatar || null,
        title: data.title || null,
        role: data.role,
        department: data.department || null,
        userId: data.userId || null,
        country: data.country || null,
        city: data.city || null,
        timezone: data.timezone || null,
        territory: data.territory || null,
        region: data.region || null,
        countries: data.countries || [],
        monthlyLeadQuota: data.monthlyLeadQuota || null,
        monthlyRevenueTarget: data.monthlyRevenueTarget || null,
        quarterlyTarget: data.quarterlyTarget || null,
        isActive: data.isActive ?? true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        bio: data.bio || null,
        skills: data.skills || [],
        notes: data.notes || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(
      { success: true, teamMember },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
