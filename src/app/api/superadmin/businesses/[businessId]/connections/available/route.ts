import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get list of available businesses to connect to
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin access required' }, { status: 403 })
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Get current business to exclude it and already connected businesses
    const currentBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        connectedBusinesses: true
      }
    })

    if (!currentBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get all businesses except current and already connected
    const availableBusinesses = await prisma.business.findMany({
      where: {
        id: {
          notIn: [businessId, ...currentBusiness.connectedBusinesses]
        },
        isActive: true,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        businessType: true,
        description: true
      },
      take: 20
    })

    return NextResponse.json({ 
      businesses: availableBusinesses 
    })

  } catch (error) {
    console.error('Error fetching available businesses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
