// Financial Transactions API — all Stripe charges/invoices/refunds
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, mapStripePlanToDb } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || 'all'  // all, charge, invoice, refund
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')

    // First try DB transactions
    const dbCount = await prisma.stripeTransaction.count()

    if (dbCount > 0) {
      return await getTransactionsFromDB(search, type, status, page, limit)
    }

    // Fallback to Stripe API directly
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

  if (type !== 'all') {
    where.type = type
  }
  if (status !== 'all') {
    where.status = status
  }
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

  // Calculate aggregates
  const allTransactions = await prisma.stripeTransaction.findMany({
    select: { type: true, status: true, amount: true, refundedAmount: true }
  })

  const totalCharges = allTransactions
    .filter(t => t.type === 'charge' || t.type === 'invoice')
    .filter(t => t.status === 'succeeded' || t.status === 'paid')
  const totalChargeAmount = totalCharges.reduce((s, t) => s + t.amount, 0) / 100
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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      totalTransactions: allTransactions.length,
      netAmount: Math.round((totalChargeAmount - totalRefundAmount) * 100) / 100,
      totalCharges: totalCharges.length,
      totalChargeAmount: Math.round(totalChargeAmount * 100) / 100,
      totalRefunds: allTransactions.filter(t => t.type === 'refund').length,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
    },
    source: 'database',
  })
}

async function getTransactionsFromStripe(
  search: string, type: string, status: string, page: number, limit: number
) {
  // This Stripe account is dedicated to WaveOrder — all data belongs to us
  const [charges, invoices] = await Promise.all([
    stripe.charges.list({ limit: 100 }).catch(() => ({ data: [] })),
    stripe.invoices.list({ limit: 100 }).catch(() => ({ data: [] })),
  ])

  // Build unified transaction list
  let transactions: Array<{
    id: string
    type: string
    status: string
    amount: number
    currency: string
    customerEmail: string | null
    customerName: string | null
    description: string | null
    plan: string | null
    billingType: string | null
    refundedAmount: number | null
    date: string
  }> = []

  // Map charges
  for (const charge of charges.data) {
    const isRefunded = charge.refunded || (charge.amount_refunded && charge.amount_refunded > 0)

    transactions.push({
      id: charge.id,
      type: 'charge',
      status: isRefunded ? 'refunded' : charge.status,
      amount: charge.amount / 100,
      currency: charge.currency,
      customerEmail: charge.billing_details?.email || null,
      customerName: charge.billing_details?.name || null,
      description: charge.description || 'Payment',
      plan: null,
      billingType: null,
      refundedAmount: charge.amount_refunded ? charge.amount_refunded / 100 : null,
      date: new Date(charge.created * 1000).toISOString(),
    })

    // If there was a refund, add a separate refund entry
    if (charge.amount_refunded && charge.amount_refunded > 0) {
      transactions.push({
        id: `re_${charge.id}`,
        type: 'refund',
        status: 'succeeded',
        amount: -(charge.amount_refunded / 100),
        currency: charge.currency,
        customerEmail: charge.billing_details?.email || null,
        customerName: charge.billing_details?.name || null,
        description: `Refund for ${charge.id}`,
        plan: null,
        billingType: null,
        refundedAmount: null,
        date: new Date(charge.created * 1000).toISOString(),
      })
    }
  }

  // Map invoices (only add if no matching charge)
  for (const inv of invoices.data) {
    const chargeId = (inv as any).charge
    if (chargeId && charges.data.find(c => c.id === chargeId)) continue // Already have the charge

    let plan: string | null = null
    if ((inv as any).subscription) {
      try {
        const sub = await stripe.subscriptions.retrieve((inv as any).subscription as string)
        plan = sub.metadata?.plan || mapStripePlanToDb(sub.items.data[0]?.price?.id)
      } catch { /* ignore */ }
    }

    transactions.push({
      id: inv.id,
      type: 'invoice',
      status: inv.status || 'unknown',
      amount: (inv.amount_paid || inv.amount_due || 0) / 100,
      currency: inv.currency,
      customerEmail: (inv as any).customer_email || null,
      customerName: (inv as any).customer_name || null,
      description: inv.billing_reason || 'Invoice',
      plan,
      billingType: null,
      refundedAmount: null,
      date: new Date(inv.created * 1000).toISOString(),
    })
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Apply filters
  if (type !== 'all') {
    transactions = transactions.filter(t => t.type === type)
  }
  if (status !== 'all') {
    transactions = transactions.filter(t => t.status === status)
  }
  if (search) {
    const s = search.toLowerCase()
    transactions = transactions.filter(t =>
      (t.customerEmail?.toLowerCase().includes(s)) ||
      (t.customerName?.toLowerCase().includes(s)) ||
      t.id.toLowerCase().includes(s) ||
      (t.description?.toLowerCase().includes(s))
    )
  }

  // Filter out $0 amounts
  transactions = transactions.filter(t => t.amount !== 0)

  // Stats
  const successfulCharges = transactions.filter(t =>
    (t.type === 'charge' || t.type === 'invoice') &&
    (t.status === 'succeeded' || t.status === 'paid')
  )
  const totalChargeAmount = successfulCharges.reduce((s, t) => s + t.amount, 0)
  const refunds = transactions.filter(t => t.type === 'refund')
  const totalRefundAmount = refunds.reduce((s, t) => s + Math.abs(t.amount), 0)

  // Paginate
  const total = transactions.length
  const paginated = transactions.slice((page - 1) * limit, page * limit)

  return NextResponse.json({
    transactions: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
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
