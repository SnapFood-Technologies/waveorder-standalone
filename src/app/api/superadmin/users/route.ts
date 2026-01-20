// app/api/superadmin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

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

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where: whereConditions })
    ])

    // Format response with auth method detection and filter users
    const formattedUsers = users
      .map(user => {
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
      .filter(user => {
        // Filter out users with no businesses or only inactive/deactivated businesses
        if (user.businesses.length === 0) {
          return false
        }
        
        // Find the original user to check deactivatedAt
        const originalUser = users.find(u => u.id === user.id)
        if (!originalUser) return false
        
        // Check if user has at least one active, non-deactivated business
        const hasActiveBusiness = originalUser.businesses.some(bu => 
          bu.business.isActive && 
          (!bu.business.deactivatedAt || bu.business.deactivatedAt === null)
        )
        
        return hasActiveBusiness
      })

    // Recalculate total count after filtering
    // We need to fetch all users and filter to get accurate count
    const allUsers = await prisma.user.findMany({
      where: whereConditions,
      include: {
        businesses: {
          include: {
            business: {
              select: {
                id: true,
                isActive: true,
                deactivatedAt: true
              }
            }
          }
        }
      }
    })

    const filteredTotalCount = allUsers.filter(user => {
      if (user.businesses.length === 0) {
        return false
      }
      
      const hasActiveBusiness = user.businesses.some(bu => 
        bu.business.isActive && 
        (!bu.business.deactivatedAt || bu.business.deactivatedAt === null)
      )
      
      return hasActiveBusiness
    }).length

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: filteredTotalCount,
        pages: Math.ceil(filteredTotalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}