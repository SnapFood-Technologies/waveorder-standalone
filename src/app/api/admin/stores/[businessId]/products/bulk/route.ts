// app/api/admin/stores/[businessId]/products/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const { productIds, action, data } = await request.json()

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