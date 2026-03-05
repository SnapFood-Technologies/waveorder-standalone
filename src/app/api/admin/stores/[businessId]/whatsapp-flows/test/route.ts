// WaveOrder Flows - Connection test
// Verifies Twilio credentials and connectivity

import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkTwilioHealth } from '@/lib/twilio'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { subscriptionPlan: true }
    })
    if (!business || business.subscriptionPlan !== 'BUSINESS') {
      return NextResponse.json({ message: 'WaveOrder Flows requires Business plan' }, { status: 403 })
    }

    const result = await checkTwilioHealth()

    return NextResponse.json({
      status: result.status,
      message: result.message,
      latency: result.latency
    })
  } catch (error) {
    console.error('[whatsapp-flows] test POST:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
