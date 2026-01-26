import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update business settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { hideProductsWithoutPhotos } = body

    // Update business settings
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(hideProductsWithoutPhotos !== undefined && { hideProductsWithoutPhotos })
      }
    })

    return NextResponse.json({ business })
  } catch (error) {
    console.error('Error updating business settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
