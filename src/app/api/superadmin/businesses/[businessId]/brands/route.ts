import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { businessId } = await params

  try {
    // Get all brands for this business (including from connected suppliers)
    const brands = await prisma.brand.findMany({
      where: {
        businessId: businessId
      },
      select: {
        id: true,
        name: true,
        businessId: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ brands })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}
