// app/api/admin/stores/[businessId]/products/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ businessId: string }> }
  ) {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
  
      const { businessId } = await params
      const { productIds, action, data } = await request.json()
  
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
  
      if (action === 'updateStatus') {
        await prisma.product.updateMany({
          where: {
            id: { in: productIds },
            businessId
          },
          data: { isActive: data.isActive }
        })
      }
  
      return NextResponse.json({ message: 'Products updated successfully' })
  
    } catch (error) {
      console.error('Error bulk updating products:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }
  