// Financial Subscriptions API — WaveOrder-only Stripe subscriptions (live data)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  stripe,
  mapStripePlanToDb,
  getBillingTypeFromPriceId,
  fetchAllStripeRecords,
  isWaveOrderSubscription,
} from '@/lib/stripe'
import Stripe from 'stripe'

export interface SubscriptionItem {
  id: string
  customerId: string
  customerEmail: string | null
  customerName: string | null
  businessNames: string[]
  plan: string
  billingType: string
  status: string
  renewalDate: string
  amount: number
  currency: string
  stripeSubscriptionId: string
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Build customer lookup from our DB (for name/email + businesses when Stripe customer not expanded)
    const waveOrderUsers = await prisma.user.findMany({
      where: {
        stripeCustomerId: { not: null },
        businesses: { some: { business: { testMode: { not: true } } } },
      },
      select: {
        stripeCustomerId: true,
        name: true,
        email: true,
        businesses: {
          select: { business: { select: { name: true } } },
        },
      },
    })
    const customerIdToInfo = new Map<string, { name: string | null; email: string; businessNames: string[] }>()
    waveOrderUsers.forEach((u) => {
      if (u.stripeCustomerId) {
        const businessNames = u.businesses.map((bu) => bu.business.name)
        customerIdToInfo.set(u.stripeCustomerId, {
          name: u.name || null,
          email: u.email,
          businessNames,
        })
      }
    })

    // Fetch all subscriptions from Stripe (live data — no sync delay)
    const rawSubscriptions = await fetchAllStripeRecords(
      (p) =>
        stripe.subscriptions.list({
          ...p,
          expand: ['data.customer'],
          status: 'all',
        }),
      {}
    ).catch((err) => {
      console.error('Subscriptions fetch error:', err)
      return [] as Stripe.Subscription[]
    })

    // Filter to WaveOrder-only subscriptions
    const waveOrderSubs = rawSubscriptions.filter((s) => isWaveOrderSubscription(s))

    const items: SubscriptionItem[] = waveOrderSubs.map((sub) => {
      const customerId =
        typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? ''
      const customer =
        typeof sub.customer === 'object' && sub.customer
          ? (sub.customer as Stripe.Customer)
          : null
      const dbInfo = customerId ? customerIdToInfo.get(customerId) : null

      const customerEmail =
        customer?.email ?? dbInfo?.email ?? null
      const customerName =
        customer?.name ?? dbInfo?.name ?? null
      const businessNames = dbInfo?.businessNames ?? []

      const price = sub.items.data[0]?.price
      const unitAmount = price?.unit_amount ?? 0
      const interval = price?.recurring?.interval ?? 'month'
      const amount =
        interval === 'year' ? (unitAmount / 100 / 12) : unitAmount / 100
      const currency = price?.currency ?? 'usd'

      const priceId = price?.id ?? ''
      const plan = mapStripePlanToDb(priceId)
      const billingType = getBillingTypeFromPriceId(priceId) ?? 'monthly'

      const periodEnd = (sub as any).current_period_end
      const renewalDate = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : ''

      return {
        id: sub.id,
        stripeSubscriptionId: sub.id,
        customerId,
        customerEmail,
        customerName,
        businessNames,
        plan,
        billingType,
        status: sub.status,
        renewalDate,
        amount: Math.round(amount * 100) / 100,
        currency,
      }
    })

    // Sort by renewal date (soonest first)
    items.sort((a, b) => {
      if (!a.renewalDate) return 1
      if (!b.renewalDate) return -1
      return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    })

    return NextResponse.json({
      subscriptions: items,
      meta: {
        total: items.length,
        active: items.filter((s) => s.status === 'active').length,
        trialing: items.filter((s) => s.status === 'trialing').length,
        canceled: items.filter((s) =>
          ['canceled', 'incomplete_expired'].includes(s.status)
        ).length,
        source: 'stripe',
      },
    })
  } catch (error: unknown) {
    console.error('Subscriptions API error:', error)
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
