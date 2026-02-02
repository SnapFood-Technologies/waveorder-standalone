// app/api/superadmin/businesses/[businessId]/account-managers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

    // Get the business with its account manager
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        accountManagerId: true,
        accountManager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Return array for future expansion (multiple managers)
    const accountManagers = business.accountManager 
      ? [business.accountManager] 
      : []

    return NextResponse.json({ accountManagers })

  } catch (error) {
    console.error('Error fetching account managers:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
