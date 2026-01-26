// app/api/superadmin/users/route.ts
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build where conditions - exclude SUPER_ADMIN users
    const whereConditions: any = {
      role: {
        not: 'SUPER_ADMIN'
      }
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role !== 'all') {
      whereConditions.role = role
    }

    // Get ALL users first (without pagination) to filter properly
    const allUsers = await prisma.user.findMany({
      where: whereConditions,
      include: {
        accounts: {
          select: {
            provider: true,
            type: true
          }
        },
        businesses: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                deactivatedAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filter users first (before formatting and pagination) to ensure we only process users with active businesses
    const filteredUsers = allUsers.filter(user => {
      // Filter out users with no businesses or only inactive/deactivated businesses
      if (!user.businesses || user.businesses.length === 0) {
        return false
      }
      
      // Check if user has at least one active, non-deactivated business
      const hasActiveBusiness = user.businesses.some(bu => 
        bu.business.isActive && 
        (!bu.business.deactivatedAt || bu.business.deactivatedAt === null)
      )
      
      return hasActiveBusiness
    })

    // Apply pagination after filtering
    const totalCount = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    // Format response with auth method detection
    const formattedUsers = paginatedUsers.map(user => {
      // Determine auth method
      let authMethod: 'google' | 'email' | 'magic-link' | 'oauth' = 'email'
      
      if (user.accounts?.length > 0) {
        const googleAccount = user.accounts.find(acc => acc.provider === 'google')
        if (googleAccount) {
          authMethod = 'google'
        } else {
          authMethod = 'oauth'
        }
      } else if (user.password) {
        authMethod = 'email'
      } else {
        authMethod = 'magic-link'
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authMethod,
        createdAt: user.createdAt,
        businesses: user.businesses.map(bu => ({
          businessId: bu.business.id,
          businessName: bu.business.name,
          businessSlug: bu.business.slug,
          role: bu.role,
          isActive: bu.business.isActive
        }))
      }
    })

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
  }
}