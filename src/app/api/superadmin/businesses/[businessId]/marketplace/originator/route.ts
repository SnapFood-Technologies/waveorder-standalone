// src/app/api/superadmin/businesses/[businessId]/marketplace/originator/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId } = await params

    // Find businesses that have this business in their connectedBusinesses array
    // These are the originators for this business
    const originators = await prisma.business.findMany({
      where: {
        connectedBusinesses: { has: businessId }
      },
      select: {
        id: true,
        name: true
      },
      take: 1 // Should only be one originator per supplier
    })

    if (originators.length === 0) {
      return NextResponse.json({
        originator: null
      })
    }

    return NextResponse.json({
      originator: {
        id: originators[0].id,
        name: originators[0].name
      }
    })

  } catch (error: any) {
    console.error('Error fetching originator:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
