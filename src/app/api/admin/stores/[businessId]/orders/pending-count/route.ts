// Pending orders count for sidebar badge (orders with status PENDING)
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

    const count = await prisma.order.count({
      where: {
        businessId,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('[orders] pending-count:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
