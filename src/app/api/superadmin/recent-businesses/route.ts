// app/api/superadmin/recent-businesses/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businesses = await prisma.business.findMany({
      where: {
        isActive: true // Only show active businesses in recent registrations
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        subscriptionPlan: true,
        businessType: true,
        logo: true,
        whatsappNumber: true,
        address: true,
        createdByAdmin: true,
        users: {
          where: {
            role: 'OWNER'
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
                password: true,
                accounts: {
                  select: {
                    provider: true,
                    type: true
                  }
                }
              }
            }
          }
        }
      }
    })

    const formattedBusinesses = businesses.map(business => {
      const owner = business.users[0]?.user
      let authMethod = 'email'
      
      if (owner?.accounts?.length > 0) {
        const googleAccount = owner.accounts.find(acc => acc.provider === 'google')
        if (googleAccount) {
          authMethod = 'google'
        } else {
          authMethod = 'oauth'
        }
      } else if (owner?.password) {
        authMethod = 'email'
      } else {
        authMethod = 'magic-link'
      }

      return {
        id: business.id,
        name: business.name,
        owner: owner?.name || 'Unknown',
        ownerEmail: owner?.email || 'No email',
        whatsappNumber: business.whatsappNumber || 'Not provided',
        address: business.address || null,
        createdAt: business.createdAt.toISOString(),
        subscriptionPlan: business.subscriptionPlan,
        businessType: business.businessType,
        logo: business.logo,
        createdByAdmin: business.createdByAdmin,
        authMethod
      }
    })

    return NextResponse.json({ businesses: formattedBusinesses })

  } catch (error) {
    console.error('Error fetching recent businesses:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}