// app/api/admin/stores/[businessId]/categories/route.ts
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const categoryData = await request.json()

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

    // Get the highest sort order to append new category at the end
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