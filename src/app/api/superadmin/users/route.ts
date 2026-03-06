// app/api/superadmin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getBillingTypeFromPriceId } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'
    const payingOnly = searchParams.get('payingOnly') === 'true'
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
        subscription: {
          select: {
            priceId: true
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
                deactivatedAt: true,
                subscriptionPlan: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filter users: active businesses required; optionally paying only
    const filteredUsers = allUsers.filter(user => {
      if (!user.businesses || user.businesses.length === 0) return false

      const hasActiveBusiness = user.businesses.some(bu =>
        bu.business.isActive &&
        (!bu.business.deactivatedAt || bu.business.deactivatedAt === null)
      )
      if (!hasActiveBusiness) return false

      if (payingOnly) {
        const billingType = user.subscription?.priceId
          ? getBillingTypeFromPriceId(user.subscription.priceId)
          : null
        const isPaying = billingType === 'monthly' || billingType === 'yearly'
        if (!isPaying) return false
      }

      return true
    })

    const totalCount = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    const formattedUsers = paginatedUsers.map(user => {
      let authMethod: 'google' | 'email' | 'magic-link' | 'oauth' = 'email'
      if (user.accounts?.length > 0) {
        const googleAccount = user.accounts.find(acc => acc.provider === 'google')
        authMethod = googleAccount ? 'google' : 'oauth'
      } else if (user.password) {
        authMethod = 'email'
      } else {
        authMethod = 'magic-link'
      }

      const billingType = user.subscription?.priceId
        ? getBillingTypeFromPriceId(user.subscription.priceId)
        : null
      const primaryBusiness = user.businesses[0]?.business
      const subscriptionPlan = primaryBusiness?.subscriptionPlan ?? 'STARTER'

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authMethod,
        createdAt: user.createdAt,
        subscriptionPlan,
        billingType,
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
  }
}