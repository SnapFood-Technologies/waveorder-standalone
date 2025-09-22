// app/api/admin/stores/[businessId]/inventory/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const whereClause: any = {
      businessId
    }

    if (search) {
      whereClause.OR = [
        {
          product: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          reason: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    const total = await prisma.inventoryActivity.count({
      where: whereClause
    })

    const activities = await prisma.inventoryActivity.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true
          }
        },
        variant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      skip,
      take: limit
    })

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    })

  } catch (error) {
    console.error('Error fetching inventory activities:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}