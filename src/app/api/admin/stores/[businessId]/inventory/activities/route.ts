// app/api/admin/stores/[businessId]/inventory/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

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