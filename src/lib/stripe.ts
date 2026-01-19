// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
// @ts-ignore
  apiVersion: '2024-11-20.acacia',
})

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 6,
    annualPrice: 5,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
    freePriceId: process.env.STRIPE_STARTER_FREE_PRICE_ID!,
    description: 'Perfect for getting started',
    features: [
      'Up to 30 products',
      '10 categories',
      'Basic WhatsApp orders',
      'Mobile catalog',
      'Manual product entry',
      'Basic branding',
      'CSV import',
      'Basic order analytics',
    ],
    limits: {
      products: 30,
      categories: 10,
      customDomain: false,
      advancedAnalytics: false,
      inventoryManagement: false,
      wholesalePricing: false,
      prioritySupport: false,
      advancedBranding: false,
    },
  },
  PRO: {
    name: 'Pro',
    price: 12,
    annualPrice: 10,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    freePriceId: process.env.STRIPE_PRO_FREE_PRICE_ID!,
    description: 'For growing businesses',
    features: [
      'Unlimited products',
      'Unlimited categories',
      'Advanced branding (colors, logo)',
      'Advanced order analytics',
      'Inventory management',
      'Custom domains',
      'Wholesale pricing',
      'Priority support'
    ],
    limits: {
      products: Infinity,
      categories: Infinity,
      customDomain: true,
      advancedAnalytics: true,
      inventoryManagement: true,
      wholesalePricing: true,
      prioritySupport: true,
      advancedBranding: true,
    },
  },
} as const

export type PlanId = keyof typeof PLANS
export type PlanLimits = typeof PLANS[PlanId]['limits']

// Helper function to get plan by ID
export function getPlan(planId: PlanId) {
  return PLANS[planId]
}

// Helper function to check if user has access to a feature
export function hasFeature(userPlan: PlanId, feature: keyof PlanLimits): boolean {
  const plan = PLANS[userPlan]
  return Boolean(plan.limits[feature])
}

// Helper function to get plan limits
export function getPlanLimits(userPlan: PlanId): PlanLimits {
  return PLANS[userPlan].limits
}

// Helper function to check product limit
export function canAddProduct(userPlan: PlanId, currentProductCount: number): boolean {
  const limits = getPlanLimits(userPlan)
  return currentProductCount < limits.products
}

// Helper function to check category limit
export function canAddCategory(userPlan: PlanId, currentCategoryCount: number): boolean {
  const limits = getPlanLimits(userPlan)
  return currentCategoryCount < limits.categories
}

// Stripe customer and subscription management
export async function createStripeCustomer(email: string, name?: string) {
  return await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      source: 'waveorder_platform'
    }
  })
}

export async function createFreeSubscription(customerId: string) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: PLANS.STARTER.priceId,
      },
    ],
    metadata: {
      plan: 'STARTER',
      source: 'waveorder_platform'
    }
  })
}

export async function createSubscriptionByPlan(
  customerId: string,
  plan: PlanId,
  billingType: 'monthly' | 'yearly' | 'free'
) {
  let priceId: string
  
  if (billingType === 'free') {
    priceId = plan === 'STARTER' ? PLANS.STARTER.freePriceId : PLANS.PRO.freePriceId
  } else if (billingType === 'yearly') {
    priceId = plan === 'STARTER' ? PLANS.STARTER.annualPriceId : PLANS.PRO.annualPriceId
  } else {
    priceId = plan === 'STARTER' ? PLANS.STARTER.priceId : PLANS.PRO.priceId
  }
  
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    metadata: {
      plan,
      billingType,
      source: 'waveorder_platform'
    }
  })
}

export async function createPaidSubscription(
  customerId: string, 
  priceId: string, 
  plan: PlanId
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    metadata: {
      plan,
      source: 'waveorder_platform'
    }
  })
}

export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  plan: PlanId
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    metadata: {
      plan,
      source: 'waveorder_platform'
    },
    proration_behavior: 'create_prorations'
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  })
}

export async function cancelSubscriptionImmediately(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId)
}

export function mapStripePlanToDb(stripePriceId: string): PlanId {
  for (const [planId, planData] of Object.entries(PLANS)) {
    if (
      planData.priceId === stripePriceId || 
      planData.annualPriceId === stripePriceId ||
      planData.freePriceId === stripePriceId
    ) {
      return planId as PlanId
    }
  }
  return 'STARTER' // fallback
}

export function getPriceId(plan: PlanId, billingType: 'monthly' | 'yearly' | 'free'): string {
  if (billingType === 'free') {
    return plan === 'STARTER' ? PLANS.STARTER.freePriceId : PLANS.PRO.freePriceId
  } else if (billingType === 'yearly') {
    return plan === 'STARTER' ? PLANS.STARTER.annualPriceId : PLANS.PRO.annualPriceId
  } else {
    return plan === 'STARTER' ? PLANS.STARTER.priceId : PLANS.PRO.priceId
  }
}