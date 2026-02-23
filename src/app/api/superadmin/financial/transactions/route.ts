// Financial Transactions API — WaveOrder-only charges/invoices/refunds
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, getBillingTypeFromPriceId } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    // Use DB transactions if available, otherwise fetch from Stripe per-customer
    const dbCount = await prisma.stripeTransaction.count()

    if (dbCount > 0) {
      return await getTransactionsFromDB(search, type, status, page, limit)
    }

    return await getTransactionsFromStripe(search, type, status, page, limit)

  } catch (error: any) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getTransactionsFromDB(
  search: string, type: string, status: string, page: number, limit: number
) {
  const where: any = {}

  if (type !== 'all') where.type = type
  if (status !== 'all') where.status = status
  if (search) {
    where.OR = [
      { customerEmail: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { stripeId: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [total, transactions] = await Promise.all([
    prisma.stripeTransaction.count({ where }),
    prisma.stripeTransaction.findMany({
      where,
      orderBy: { stripeCreatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })
  ])

  const allTransactions = await prisma.stripeTransaction.findMany({
    select: { type: true, status: true, amount: true, refundedAmount: true }
  })

  const successCharges = allTransactions
    .filter(t => (t.type === 'charge' || t.type === 'invoice') && (t.status === 'succeeded' || t.status === 'paid'))
  const totalChargeAmount = successCharges.reduce((s, t) => s + t.amount, 0) / 100
  const totalRefundAmount = allTransactions
    .filter(t => t.type === 'refund')
    .reduce((s, t) => s + Math.abs(t.amount), 0) / 100

  return NextResponse.json({
    transactions: transactions.map(t => ({
      id: t.stripeId,
      type: t.type,
      status: t.status,
      amount: t.amount / 100,
      currency: t.currency,
      customerEmail: t.customerEmail,
      customerName: t.customerName,
      description: t.description,
      plan: t.plan,
      billingType: t.billingType,
      refundedAmount: t.refundedAmount ? t.refundedAmount / 100 : null,
      date: t.stripeCreatedAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: {
      totalTransactions: allTransactions.length,
      netAmount: Math.round((totalChargeAmount - totalRefundAmount) * 100) / 100,
      totalCharges: successCharges.length,
      totalChargeAmount: Math.round(totalChargeAmount * 100) / 100,
      totalRefunds: allTransactions.filter(t => t.type === 'refund').length,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
    },
    source: 'database',
  })
}

/**
 * Fetch charges per WaveOrder customer (not the entire Stripe account).
 * Much faster than fetching all charges + invoices and filtering.
 */
async function getTransactionsFromStripe(
  search: string, type: string, status: string, page: number, limit: number
) {
  // Get WaveOrder customer IDs + plan + billing cycle from DB (exclude test businesses)
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
      }
    },
  })

  const now = new Date()

  // Map customer ID → plan, name/email, and billing cycle (yearly | monthly | free | trial)
  const customerPlanMap = new Map<string, string>()
  const customerInfoMap = new Map<string, { name: string | null; email: string }>()
  const customerBillingMap = new Map<string, string>()
  for (const u of waveOrderUsers) {
    if (u.stripeCustomerId) {
      const plan = u.businesses[0]?.business?.subscriptionPlan || null
      if (plan) customerPlanMap.set(u.stripeCustomerId, plan)
      customerInfoMap.set(u.stripeCustomerId, {
        name: u.name || null,
        email: u.email,
      })
      const trialEndsAt = u.businesses[0]?.business?.trialEndsAt
      const onTrial = trialEndsAt && new Date(trialEndsAt) > now
      const billing = onTrial
        ? 'trial'
        : (u.subscription?.priceId ? getBillingTypeFromPriceId(u.subscription.priceId) : null)
      customerBillingMap.set(u.stripeCustomerId, billing || 'free')
    }
  }

  if (waveOrderUsers.length === 0) {
    return NextResponse.json({
      transactions: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      stats: {
        totalTransactions: 0, netAmount: 0,
        totalCharges: 0, totalChargeAmount: 0,
        totalRefunds: 0, totalRefundAmount: 0,
      },
      source: 'stripe_api',
    })
  }

  // Fetch charges per customer in parallel (max 50 per customer, most recent)
  const chargePromises = waveOrderUsers.map(async (u) => {
    if (!u.stripeCustomerId) return []
    try {
      const charges = await stripe.charges.list({
        customer: u.stripeCustomerId,
        limit: 50,
      })
      return charges.data
    } catch {
      return []
    }
  })

  const chargeArrays = await Promise.all(chargePromises)
  const allCharges = chargeArrays.flat()

  // Build transaction list from charges
  type Transaction = {
    id: string; type: string; status: string; amount: number;
    currency: string; customerEmail: string | null; customerName: string | null;
    description: string | null; plan: string | null; billingType: string | null;
    refundedAmount: number | null; date: string;
  }

  let transactions: Transaction[] = []

  for (const charge of allCharges) {
    const isRefunded = charge.refunded || (charge.amount_refunded && charge.amount_refunded > 0)
    const custId = typeof charge.customer === 'string' ? charge.customer : null
    const plan = custId ? (customerPlanMap.get(custId) || null) : null
    const billingType = custId ? (customerBillingMap.get(custId) || null) : null
    const dbInfo = custId ? customerInfoMap.get(custId) : null
    const customerEmail = charge.billing_details?.email || dbInfo?.email || null
    const customerName = charge.billing_details?.name || dbInfo?.name || null

    transactions.push({
      id: charge.id,
      type: 'charge',
      status: isRefunded ? 'refunded' : charge.status,
      amount: charge.amount / 100,
      currency: charge.currency,
      customerEmail,
      customerName,
      description: charge.description || 'Subscription payment',
      plan,
      billingType,
      refundedAmount: charge.amount_refunded ? charge.amount_refunded / 100 : null,
      date: new Date(charge.created * 1000).toISOString(),
    })

    if (charge.amount_refunded && charge.amount_refunded > 0) {
      transactions.push({
        id: `re_${charge.id}`,
        type: 'refund',
        status: 'succeeded',
        amount: -(charge.amount_refunded / 100),
        currency: charge.currency,
        customerEmail,
        customerName,
        description: `Refund for ${charge.id}`,
        plan,
        billingType,
        refundedAmount: null,
        date: new Date(charge.created * 1000).toISOString(),
      })
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Apply filters
  if (type !== 'all') transactions = transactions.filter(t => t.type === type)
  if (status !== 'all') transactions = transactions.filter(t => t.status === status)
  if (search) {
    const s = search.toLowerCase()
    transactions = transactions.filter(t =>
      t.customerEmail?.toLowerCase().includes(s) ||
      t.customerName?.toLowerCase().includes(s) ||
      t.id.toLowerCase().includes(s) ||
      t.description?.toLowerCase().includes(s)
    )
  }

  transactions = transactions.filter(t => t.amount !== 0)

  // Stats
  const successfulCharges = transactions.filter(t =>
    (t.type === 'charge') && (t.status === 'succeeded' || t.status === 'paid')
  )
  const totalChargeAmount = successfulCharges.reduce((s, t) => s + t.amount, 0)
  const refunds = transactions.filter(t => t.type === 'refund')
  const totalRefundAmount = refunds.reduce((s, t) => s + Math.abs(t.amount), 0)

  // Paginate
  const total = transactions.length
  const paginated = transactions.slice((page - 1) * limit, page * limit)

  return NextResponse.json({
    transactions: paginated,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: {
      totalTransactions: transactions.length,
      netAmount: Math.round((totalChargeAmount - totalRefundAmount) * 100) / 100,
      totalCharges: successfulCharges.length,
      totalChargeAmount: Math.round(totalChargeAmount * 100) / 100,
      totalRefunds: refunds.length,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
    },
    source: 'stripe_api',
  })
}
