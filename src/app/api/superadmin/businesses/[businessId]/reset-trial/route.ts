// app/api/superadmin/businesses/[businessId]/reset-trial/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logSystemEvent } from '@/lib/systemLog'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Get the business and its owner
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: { user: true }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const owner = business.users[0]?.user

    // Reset business trial fields
    await prisma.business.update({
      where: { id: businessId },
      data: {
        trialEndsAt: null,
        graceEndsAt: null
      }
    })

    // Reset owner's trial fields if owner exists
    if (owner) {
      await prisma.user.update({
        where: { id: owner.id },
        data: {
          trialUsed: false,
          trialEndsAt: null,
          graceEndsAt: null
        }
      })
    }

    // Log the action
    await logSystemEvent({
      logType: 'admin_action',
      message: `Trial reset for business: ${business.name}`,
      severity: 'info',
      metadata: {
        businessId,
        businessName: business.name,
        ownerId: owner?.id,
        ownerEmail: owner?.email,
        resetBy: session.user.email
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Trial reset successfully. User can now start a new trial.' 
    })

  } catch (error) {
    console.error('Error resetting trial:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
