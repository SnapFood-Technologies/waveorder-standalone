import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// GET - List all postal pricing for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const cityName = searchParams.get('cityName')
    const postalId = searchParams.get('postalId')

    const where: any = {
      businessId
    }

    if (cityName) {
      where.cityName = cityName.trim()
    }

    if (postalId) {
      where.postalId = postalId
    }

    const pricing = await prisma.postalPricing.findMany({
      where,
      include: {
        postal: {
          select: {
            id: true,
            name: true,
            nameAl: true,
            type: true,
            logo: true
          }
        }
      },
      orderBy: [
        { cityName: 'asc' },
        { postal: { name: 'asc' } }
      ]
    })

    return NextResponse.json({ pricing })
  } catch (error: any) {
    console.error('Error fetching postal pricing:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
