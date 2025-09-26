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

    // Get recent businesses with owner info
    const businesses = await prisma.business.findMany({
      take: 5, // Limit to 5 most recent
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
        users: {
          where: {
            role: 'OWNER'
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Format response
    const formattedBusinesses = businesses.map(business => ({
      id: business.id,
      name: business.name,
      owner: business.users[0]?.user?.name || 'Unknown',
      createdAt: business.createdAt.toISOString(),
      subscriptionPlan: business.subscriptionPlan,
      businessType: business.businessType,
      logo: business.logo
    }))

    return NextResponse.json({ businesses: formattedBusinesses })

  } catch (error) {
    console.error('Error fetching recent businesses:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}