// app/api/admin/stores/[businessId]/categories/route.ts
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

    const categories = await prisma.category.findMany({
      where: { businessId },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

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

    const categoryData = await request.json()

    const lastCategory = await prisma.category.findFirst({
      where: { businessId },
      orderBy: { sortOrder: 'desc' }
    })

    const nextSortOrder = (lastCategory?.sortOrder || 0) + 1

    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        description: categoryData.description || null,
        image: categoryData.image || null,
        isActive: categoryData.isActive,
        sortOrder: nextSortOrder,
        businessId
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({ category })

  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}