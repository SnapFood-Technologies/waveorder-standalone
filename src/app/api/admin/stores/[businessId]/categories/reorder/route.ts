// app/api/admin/stores/[businessId]/categories/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
  
      const { businessId } = await params
      const { categories } = await request.json()
  
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
  
      // Update sort orders for all categories
      const updatePromises = categories.map((cat: { id: string; sortOrder: number }) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { sortOrder: cat.sortOrder }
        })
      )
  
      await Promise.all(updatePromises)
  
      return NextResponse.json({ message: 'Categories reordered successfully' })
  
    } catch (error) {
      console.error('Error reordering categories:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }
  