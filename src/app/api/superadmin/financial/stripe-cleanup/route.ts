// Stripe Cleanup API — find and cancel orphaned subscriptions for deactivated businesses
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, mapStripePlanToDb } from '@/lib/stripe'
import Stripe from 'stripe'

interface OrphanedRecord {
  businessId: string
  businessName: string
  ownerEmail: string | null
  deactivatedAt: string | null
  deactivationReason: string | null
  stripeCustomerId: string
  subscriptions: Array<{
    id: string
    status: string
    plan: string
    priceId: string
    amount: number
    interval: string
    currentPeriodEnd: string
    created: string
  }>
  totalMonthlyCost: number
}

/**
 * GET — Scan for deactivated businesses with active/trialing Stripe subscriptions
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const deactivatedBusinesses = await prisma.business.findMany({
      where: { isActive: false },
      select: {
        id: true,
        name: true,
        deactivatedAt: true,
        deactivationReason: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        users: {
          where: { role: 'OWNER' },
          select: {
            user: {
              select: { email: true, stripeCustomerId: true }
            }
          }
        }
      }
    })

    const orphaned: OrphanedRecord[] = []
    const clean: Array<{ businessId: string; businessName: string; reason: string }> = []
    const errors: Array<{ businessId: string; businessName: string; error: string }> = []

    for (const biz of deactivatedBusinesses) {
      const owner = biz.users[0]?.user
      const stripeCustomerId = owner?.stripeCustomerId

      if (!stripeCustomerId) {
        clean.push({
          businessId: biz.id,
          businessName: biz.name,
          reason: 'No Stripe customer ID'
        })
        continue
      }

      try {
        const stripeSubs = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 20,
        })

        // Only include non-canceled subscriptions (active, trialing, paused, past_due, unpaid)
        const liveSubs = stripeSubs.data.filter(s =>
          !['canceled', 'incomplete_expired'].includes(s.status)
        )

        if (liveSubs.length === 0) {
          clean.push({
            businessId: biz.id,
            businessName: biz.name,
            reason: 'All Stripe subscriptions already canceled'
          })
          continue
        }

        let totalMonthlyCost = 0
        const subDetails = liveSubs.map(s => {
          const price = s.items.data[0]?.price
          const amount = (price?.unit_amount || 0) / 100
          const interval = price?.recurring?.interval || 'month'
          const monthlyAmount = interval === 'year' ? amount / 12 : amount
          totalMonthlyCost += monthlyAmount

          return {
            id: s.id,
            status: s.status,
            plan: mapStripePlanToDb(price?.id),
            priceId: price?.id || '',
            amount,
            interval,
            currentPeriodEnd: new Date(((s as any).current_period_end || 0) * 1000).toISOString(),
            created: new Date(s.created * 1000).toISOString(),
          }
        })

        orphaned.push({
          businessId: biz.id,
          businessName: biz.name,
          ownerEmail: owner?.email || null,
          deactivatedAt: biz.deactivatedAt?.toISOString() || null,
          deactivationReason: biz.deactivationReason || null,
          stripeCustomerId,
          subscriptions: subDetails,
          totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
        })
      } catch (err: any) {
        if (err?.code === 'resource_missing') {
          clean.push({
            businessId: biz.id,
            businessName: biz.name,
            reason: 'Stripe customer does not exist'
          })
        } else {
          errors.push({
            businessId: biz.id,
            businessName: biz.name,
            error: err.message || 'Unknown error'
          })
        }
      }
    }

    const totalWastedMRR = orphaned.reduce((s, o) => s + o.totalMonthlyCost, 0)
    const totalOrphanedSubs = orphaned.reduce((s, o) => s + o.subscriptions.length, 0)

    return NextResponse.json({
      summary: {
        totalDeactivated: deactivatedBusinesses.length,
        withOrphanedSubs: orphaned.length,
        alreadyClean: clean.length,
        withErrors: errors.length,
        totalOrphanedSubs,
        wastedMRR: Math.round(totalWastedMRR * 100) / 100,
      },
      orphaned,
      clean,
      errors,
    })
  } catch (error: any) {
    console.error('Stripe cleanup scan error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST — Cancel selected subscriptions and optionally archive customers
 * Body: { subscriptionIds: string[], archiveCustomers?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscriptionIds, archiveCustomers } = body as {
      subscriptionIds: string[]
      archiveCustomers?: boolean
    }

    if (!subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      return NextResponse.json({ message: 'subscriptionIds array is required' }, { status: 400 })
    }

    const results: Array<{
      subscriptionId: string
      action: string
      success: boolean
      error?: string
    }> = []

    const customersToArchive = new Set<string>()

    for (const subId of subscriptionIds) {
      try {
        const canceled = await stripe.subscriptions.cancel(subId)
        results.push({
          subscriptionId: subId,
          action: 'canceled',
          success: true,
        })

        if (archiveCustomers && typeof canceled.customer === 'string') {
          customersToArchive.add(canceled.customer)
        }
      } catch (err: any) {
        results.push({
          subscriptionId: subId,
          action: 'cancel_failed',
          success: false,
          error: err.message || 'Unknown error',
        })
      }
    }

    // Archive customers if requested (deletes from active list but retains data)
    const archiveResults: Array<{
      customerId: string
      success: boolean
      error?: string
    }> = []

    if (archiveCustomers && customersToArchive.size > 0) {
      for (const custId of customersToArchive) {
        try {
          // Verify all subs for this customer are canceled before archiving
          const remaining = await stripe.subscriptions.list({
            customer: custId,
            status: 'active',
            limit: 1,
          })

          if (remaining.data.length > 0) {
            archiveResults.push({
              customerId: custId,
              success: false,
              error: 'Customer still has active subscriptions — skipped archive',
            })
            continue
          }

          await stripe.customers.del(custId)
          archiveResults.push({ customerId: custId, success: true })

          // Clear stripeCustomerId in our DB so it doesn't cause confusion
          await prisma.user.updateMany({
            where: { stripeCustomerId: custId },
            data: { stripeCustomerId: null },
          })
        } catch (err: any) {
          archiveResults.push({
            customerId: custId,
            success: false,
            error: err.message || 'Unknown error',
          })
        }
      }
    }

    const canceledCount = results.filter(r => r.success).length
    const archivedCount = archiveResults.filter(r => r.success).length

    return NextResponse.json({
      canceledSubscriptions: canceledCount,
      failedCancellations: results.length - canceledCount,
      archivedCustomers: archivedCount,
      failedArchives: archiveResults.length - archivedCount,
      details: results,
      archiveDetails: archiveResults.length > 0 ? archiveResults : undefined,
    })
  } catch (error: any) {
    console.error('Stripe cleanup error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
