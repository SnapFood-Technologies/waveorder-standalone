// app/api/admin/stores/[businessId]/inventory/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'


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

    // Populate user information for activities where changedBy is a user ID
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        // Check if changedBy looks like a MongoDB ObjectId (24 hex characters)
        const isObjectId = activity.changedBy ? /^[0-9a-fA-F]{24}$/.test(activity.changedBy) : false
        
        if (isObjectId && activity.changedBy) {
          try {
            const user = await prisma.user.findUnique({
              where: { id: activity.changedBy },
              select: {
                id: true,
                name: true,
                email: true
              }
            })
            
            if (user) {
              return {
                ...activity,
                user: {
                  id: user.id,
                  name: user.name || user.email || 'Unknown User'
                },
                changedBy: user.name || user.email || activity.changedBy || undefined // Keep original for backward compatibility
              }
            }
          } catch (error) {
            // If user not found, continue with original changedBy
            console.error(`User not found for changedBy: ${activity.changedBy}`, error)
          }
        }
        
        return activity
      })
    )

    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      activities: activitiesWithUsers,
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