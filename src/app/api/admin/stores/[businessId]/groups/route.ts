import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - List all groups for a business
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

    // Check if groups feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'groups')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const groups = await prisma.group.findMany({
      where: { businessId },
      orderBy: { sortOrder: 'asc' }
    })

    // Get product counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const productCount = await prisma.product.count({
          where: {
            businessId,
            groupIds: {
              has: group.id
            }
          }
        })

        return {
          ...group,
          productCount
        }
      })
    )

    return NextResponse.json({ groups: groupsWithCounts })

  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if groups feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'groups')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    const body = await request.json()
    const { name, nameAl, description, sortOrder, isActive, metadata } = body

    if (!name) {
      return NextResponse.json({ message: 'Group name is required' }, { status: 400 })
    }

    // Check for duplicate name
    const existingGroup = await prisma.group.findFirst({
      where: {
        businessId,
        name
      }
    })

    if (existingGroup) {
      return NextResponse.json({ message: 'A group with this name already exists' }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: {
        businessId,
        name,
        nameAl: nameAl || null,
        description: description || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        metadata: metadata || null
      }
    })

    return NextResponse.json({ group }, { status: 201 })

  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
