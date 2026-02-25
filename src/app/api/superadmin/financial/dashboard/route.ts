// Financial Dashboard API — WaveOrder-only Stripe data
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  stripe, mapStripePlanToDb, getBillingTypeFromPriceId, PLANS,
  fetchAllStripeRecords, isWaveOrderSubscription, getWaveOrderPriceIds,
} from '@/lib/stripe'
import Stripe from 'stripe'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const errors: string[] = []

    // Build set of known WaveOrder customer IDs and maps: name/email, plan, billing (for display and recent transactions)
    const waveOrderUsers = await prisma.user.findMany({
      where: {
        stripeCustomerId: { not: null },
        businesses: { some: { business: { testMode: { not: true } } } },
      },
      select: {
        stripeCustomerId: true, name: true, email: true,
        subscription: { select: { priceId: true } },
        businesses: {
          where: { role: 'OWNER' },
          select: { business: { select: { subscriptionPlan: true, trialEndsAt: true } } },
          take: 1,
        },
      },
    })
    const knownCustomerIds = new Set(
      waveOrderUsers.map(u => u.stripeCustomerId).filter(Boolean) as string[]
    )
    const customerIdToInfo = new Map<string, { name: string | null; email: string }>()
    const customerPlanMap = new Map<string, string>()
    const customerBillingMap = new Map<string, string>()
    const now = new Date()
    waveOrderUsers.forEach(u => {
      if (u.stripeCustomerId) {
        customerIdToInfo.set(u.stripeCustomerId, {
          name: u.name || null,
          email: u.email,
        })
        const plan = u.businesses[0]?.business?.subscriptionPlan
        if (plan) customerPlanMap.set(u.stripeCustomerId, plan)
        const trialEndsAt = u.businesses[0]?.business?.trialEndsAt
        const onTrial = trialEndsAt && new Date(trialEndsAt) > now
        const billing = onTrial ? 'trial' : (u.subscription?.priceId ? getBillingTypeFromPriceId(u.subscription.priceId) : null)
        customerBillingMap.set(u.stripeCustomerId, billing || 'free')
      }
    })

    // Fetch Stripe data with auto-pagination + DB data in parallel
    const [
      rawSubscriptions,
      rawCharges,
      dbBusinesses,
      dbTransactions
    ] = await Promise.all([
      fetchAllStripeRecords(
        (p) => stripe.subscriptions.list({ ...p, expand: ['data.default_payment_method'] }),
        {}
      ).catch(err => {
        errors.push(`Subscriptions: ${err.message}`)
        return [] as Stripe.Subscription[]
      }),
      fetchAllStripeRecords(
        (p) => stripe.charges.list(p),
        { created: { gte: getMonthsAgo(12) } }
      ).catch(err => {
        errors.push(`Charges: ${err.message}`)
        return [] as Stripe.Charge[]
      }),
      prisma.business.findMany({
        where: { testMode: { not: true } },
        select: {
          id: true, name: true, subscriptionPlan: true, subscriptionStatus: true,
          trialEndsAt: true, graceEndsAt: true, createdAt: true, isActive: true,
        }
      }),
      prisma.stripeTransaction.findMany({
        where: { plan: { in: ['STARTER', 'PRO', 'BUSINESS'] } },
        orderBy: { stripeCreatedAt: 'desc' },
        take: 10
      }).catch(() => [])
    ])

    // Filter to WaveOrder-only data
    const allSubscriptions = rawSubscriptions.filter(s => isWaveOrderSubscription(s))
    const allCharges = rawCharges.filter(c => {
      const custId = typeof c.customer === 'string' ? c.customer : null
      return custId && knownCustomerIds.has(custId)
    })

    // Categorize subscriptions — "paid" means actually paying money (unit_amount > 0)
    const activePaid = allSubscriptions.filter(s => {
      if (s.status !== 'active') return false
      const price = s.items.data[0]?.price
      return price && (price.unit_amount || 0) > 0
    })
    const trialing = allSubscriptions.filter(s => s.status === 'trialing')
    const paused = allSubscriptions.filter(s => s.status === 'paused')
    const canceled = allSubscriptions.filter(s => ['canceled', 'incomplete_expired'].includes(s.status))
    const freeSubs = allSubscriptions.filter(s => {
      if (s.status !== 'active') return false
      const price = s.items.data[0]?.price
      return !price || (price.unit_amount || 0) === 0
    })

    // Calculate MRR from active paid subscriptions (group by plan + billing type for clarity)
    let mrr = 0
    const revenueByPlan: Record<string, { subscribers: number; mrr: number; billingType: string }> = {}

    for (const sub of activePaid) {
      const priceId = sub.items.data[0]?.price?.id
      const price = sub.items.data[0]?.price
      if (!price) continue

      const plan = mapStripePlanToDb(priceId)
      const billingType = getBillingTypeFromPriceId(priceId) || 'monthly'
      const key = `${plan}_${billingType}`
      let monthlyAmount = 0

      if (price.recurring?.interval === 'year') {
        monthlyAmount = (price.unit_amount || 0) / 100 / 12
      } else {
        monthlyAmount = (price.unit_amount || 0) / 100
      }

      mrr += monthlyAmount

      if (!revenueByPlan[key]) {
        revenueByPlan[key] = { subscribers: 0, mrr: 0, billingType }
      }
      revenueByPlan[key].subscribers++
      revenueByPlan[key].mrr += monthlyAmount
    }

    const arr = mrr * 12
    const arpu = activePaid.length > 0 ? mrr / activePaid.length : 0

    // Revenue from WaveOrder charges only (last 12 months)
    const succeededCharges = allCharges.filter(c => c.status === 'succeeded')
    const totalRevenue = succeededCharges.reduce((sum, c) => sum + c.amount, 0) / 100
    const totalRefunded = succeededCharges.reduce((sum, c) => sum + (c.amount_refunded || 0), 0) / 100
    const netRevenue = totalRevenue - totalRefunded

    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)
    const thisMonthCharges = succeededCharges.filter(c => new Date(c.created * 1000) >= thisMonthStart)
    const thisMonthRevenue = thisMonthCharges.reduce((sum, c) => sum + c.amount, 0) / 100

    const lastMonthStart = new Date(thisMonthStart)
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    const lastMonthCharges = succeededCharges.filter(c => {
      const d = new Date(c.created * 1000)
      return d >= lastMonthStart && d < thisMonthStart
    })
    const lastMonthRevenue = lastMonthCharges.reduce((sum, c) => sum + c.amount, 0) / 100
    const monthOverMonthChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0

    const monthlyRevenue = buildMonthlyRevenue(succeededCharges, 6)

    // Inactive former paying: known customers with past charges but no active paid subscription
    const activePaidCustomerIds = new Set(
      activePaid.map(s => (typeof s.customer === 'string' ? s.customer : null)).filter(Boolean) as string[]
    )
    const inactiveFormerPaying: Array<{
      customerId: string
      customerName: string | null
      customerEmail: string
      lastPaymentDate: string
      lastPaymentAmount: number
      totalPaidLast12Months: number
    }> = []
    for (const custId of knownCustomerIds) {
      if (activePaidCustomerIds.has(custId)) continue
      const custCharges = succeededCharges.filter(
        c => (typeof c.customer === 'string' ? c.customer : null) === custId
      )
      if (custCharges.length === 0) continue
      const sorted = [...custCharges].sort((a, b) => b.created - a.created)
      const last = sorted[0]
      const totalPaid = custCharges.reduce((sum, c) => sum + (c.amount - (c.amount_refunded || 0)), 0) / 100
      const info = customerIdToInfo.get(custId)
      inactiveFormerPaying.push({
        customerId: custId,
        customerName: info?.name ?? null,
        customerEmail: info?.email ?? (last.billing_details?.email as string) ?? '',
        lastPaymentDate: new Date(last.created * 1000).toISOString(),
        lastPaymentAmount: (last.amount - (last.amount_refunded || 0)) / 100,
        totalPaidLast12Months: Math.round(totalPaid * 100) / 100,
      })
    }
    inactiveFormerPaying.sort((a, b) => new Date(b.lastPaymentDate).getTime() - new Date(a.lastPaymentDate).getTime())

    // DB-based customer breakdown (single source of truth so numbers add up)
    const activeBusinesses = dbBusinesses.filter(b => b.isActive)
    const dbTrialing = activeBusinesses.filter(b =>
      b.trialEndsAt && new Date(b.trialEndsAt) > now
    )
    const dbPaying = activePaid.length // from Stripe (actually paying money)
    const dbFree = activeBusinesses.length - dbTrialing.length - dbPaying

    // Trial funnel (includes all businesses, active or not, for accurate conversion tracking)
    const endedTrials = dbBusinesses.filter(b =>
      b.trialEndsAt && new Date(b.trialEndsAt) < now
    ).length
    const activeTrials = dbTrialing.length
    const convertedTrials = dbPaying
    const conversionRate = endedTrials > 0
      ? (convertedTrials / (endedTrials + convertedTrials)) * 100
      : 0

    // Recent 5 from Stripe (always) — includes invoices/subscriptions from Stripe, including manual/payment links
    const recentTransactionsFromStripe = succeededCharges.slice(0, 5).map(c => {
      const custId = typeof c.customer === 'string' ? c.customer : null
      const dbInfo = custId ? customerIdToInfo.get(custId) : null
      const plan = custId ? customerPlanMap.get(custId) || null : null
      const billingType = custId ? customerBillingMap.get(custId) || null : null
      const customerEmail = c.billing_details?.email || dbInfo?.email || null
      // For shehutools@gmail.com, prefer DB name over Stripe billing_details
      const preferDbName = customerEmail?.toLowerCase() === 'shehutools@gmail.com' && dbInfo?.name
      const customerName = preferDbName ? dbInfo.name : (c.billing_details?.name || dbInfo?.name || null)
      return {
        id: c.id, type: 'charge',
        customerEmail,
        customerName,
        description: c.description || 'Payment',
        amount: c.amount / 100, currency: c.currency, status: c.status,
        date: new Date(c.created * 1000).toISOString(),
        plan: plan ?? null,
        billingType: billingType ?? null,
      }
    })

    // Recent 5 from our DB (always) — only transactions captured by our webhooks
    const businessIdToActive = new Map(dbBusinesses.map(b => [b.id, b.isActive]))
    const recentTransactionsFromDb = dbTransactions.slice(0, 5).map(t => {
      const plan = t.plan || (t.customerId ? customerPlanMap.get(t.customerId) || null : null)
      const billingType = t.billingType || (t.customerId ? customerBillingMap.get(t.customerId) || null : null)
      const isDeactivated = t.businessId ? !(businessIdToActive.get(t.businessId) ?? true) : false
      return {
        id: t.stripeId, type: t.type,
        customerEmail: t.customerEmail, customerName: t.customerName,
        description: t.description, amount: t.amount / 100,
        currency: t.currency, status: t.status,
        date: t.stripeCreatedAt.toISOString(),
        plan: plan ?? null,
        billingType: billingType ?? null,
        isDeactivated,
      }
    })

    // Payment count breakdown: active vs inactive businesses (last 12 months)
    const paymentsFromActive = succeededCharges.filter(c => {
      const id = typeof c.customer === 'string' ? c.customer : null
      return id != null && activePaidCustomerIds.has(id)
    }).length
    const paymentsFromInactive = succeededCharges.filter(c => {
      const id = typeof c.customer === 'string' ? c.customer : null
      return id != null && knownCustomerIds.has(id) && !activePaidCustomerIds.has(id)
    }).length

    return NextResponse.json({
      revenue: {
        total: netRevenue,
        totalCharges: totalRevenue,
        totalRefunded,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        monthOverMonthChange: Math.round(monthOverMonthChange * 10) / 10,
        paymentsLast12Months: succeededCharges.length,
        paymentsFromActive,
        paymentsFromInactive,
      },
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      stripeBalance: { available: 0, pending: 0 },
      subscriptions: {
        paidActive: dbPaying,
        trialing: activeTrials,
        paused: paused.length,
        canceled: canceled.length,
        free: Math.max(0, dbFree),
        total: activeBusinesses.length,
      },
      revenueByPlan,
      trialFunnel: {
        activeTrials,
        endedTrials,
        converted: convertedTrials,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      monthlyRevenue,
      recentTransactionsFromStripe,
      recentTransactionsFromDb,
      inactiveFormerPaying,
      currency: 'usd',
      meta: {
        totalStripeSubscriptions: rawSubscriptions.length,
        waveOrderSubscriptions: allSubscriptions.length,
        totalStripeCharges: rawCharges.length,
        waveOrderCharges: allCharges.length,
        knownCustomerIds: knownCustomerIds.size,
        chargeWindow: '12 months',
        errors: errors.length > 0 ? errors : undefined,
      }
    })

  } catch (error: any) {
    console.error('Financial dashboard error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function getMonthsAgo(months: number): number {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return Math.floor(d.getTime() / 1000)
}

function isFreePrice(priceId: string | undefined): boolean {
  if (!priceId) return true
  return (
    priceId === PLANS.STARTER.freePriceId ||
    priceId === PLANS.PRO.freePriceId ||
    priceId === PLANS.BUSINESS.freePriceId
  )
}

function buildMonthlyRevenue(charges: Stripe.Charge[], months: number) {
  const result: Array<{ month: string; revenue: number; charges: number; refunds: number }> = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)

    const monthCharges = charges.filter(c => {
      const cd = new Date(c.created * 1000)
      return cd >= monthStart && cd < monthEnd
    })

    const revenue = monthCharges.reduce((s, c) => s + (c.amount - (c.amount_refunded || 0)), 0) / 100
    const refunds = monthCharges.reduce((s, c) => s + (c.amount_refunded || 0), 0) / 100
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    result.push({
      month: monthLabel,
      revenue: Math.round(revenue * 100) / 100,
      charges: monthCharges.length,
      refunds: Math.round(refunds * 100) / 100,
    })
  }

  return result
}
