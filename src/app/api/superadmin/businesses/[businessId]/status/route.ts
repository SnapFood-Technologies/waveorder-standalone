// app/api/superadmin/businesses/[businessId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, isWaveOrderSubscription } from '@/lib/stripe'


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const body = await request.json()
    const { isActive, deactivationReason } = body

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive must be a boolean value' }, { status: 400 })
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        users: {
          where: { role: 'OWNER' },
          include: { user: { select: { id: true, stripeCustomerId: true } } }
        }
      }
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    if (existingBusiness.isActive === isActive) {
      return NextResponse.json({ 
        message: `Business is already ${isActive ? 'active' : 'inactive'}` 
      }, { status: 400 })
    }

    const updateData: any = {
      isActive,
      updatedAt: new Date()
    }

    const stripeActions: string[] = []

    if (!isActive) {
      updateData.deactivatedAt = new Date()
      if (deactivationReason && deactivationReason.trim() !== '') {
        updateData.deactivationReason = deactivationReason.trim()
      }

      // Cancel active Stripe subscriptions for this business's owner
      const owner = existingBusiness.users[0]?.user
      if (owner?.stripeCustomerId) {
        try {
          const stripeSubs = await stripe.subscriptions.list({
            customer: owner.stripeCustomerId,
            limit: 20,
          })

          for (const sub of stripeSubs.data) {
            if (['active', 'trialing', 'paused', 'past_due'].includes(sub.status) && isWaveOrderSubscription(sub)) {
              await stripe.subscriptions.cancel(sub.id)
              stripeActions.push(`Canceled subscription ${sub.id} (${sub.status})`)
            }
          }
        } catch (err: any) {
          console.error('Failed to cancel Stripe subs on deactivation:', err.message)
          stripeActions.push(`Warning: Stripe cleanup failed — ${err.message}`)
        }
      }

      // Downgrade DB plan to STARTER
      updateData.subscriptionPlan = 'STARTER'
      updateData.subscriptionStatus = 'CANCELLED'
      updateData.trialEndsAt = null
      updateData.graceEndsAt = null
    } else {
      updateData.deactivatedAt = null
      updateData.deactivationReason = null
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        id: true,
        name: true,
        isActive: true,
        deactivatedAt: true,
        deactivationReason: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Business "${updatedBusiness.name}" has been ${isActive ? 'activated' : 'deactivated'} successfully`,
      business: updatedBusiness,
      stripeActions: stripeActions.length > 0 ? stripeActions : undefined,
    })

  } catch (error) {
    console.error('Error updating business status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
    }

    // Get business status
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
        createdAt: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        isActive: business.isActive,
        lastStatusUpdate: business.updatedAt,
        createdAt: business.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching business status:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}