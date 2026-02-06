// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
// @ts-ignore
  apiVersion: '2024-11-20.acacia',
})

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 19,
    annualPrice: 16,           // ~17% discount ($192/year)
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    annualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
    freePriceId: process.env.STRIPE_STARTER_FREE_PRICE_ID!,
    description: 'Perfect for getting started',
    features: [
      'Up to 50 products',
      '1 store/catalog',
      'Basic analytics',
      'WhatsApp ordering',
      'CSV import',
      'Email support',
    ],
    limits: {
      products: 50,
      categories: 15,
      stores: 1,
      customDomain: false,
      advancedAnalytics: false,
      inventoryManagement: false,
      wholesalePricing: false,
      prioritySupport: false,
      advancedBranding: false,
      teamMembers: 0,
      apiAccess: false,
      scheduling: false,
      customerInsights: false,
    },
  },
  PRO: {
    name: 'Pro',
    price: 39,
    annualPrice: 32,           // ~17% discount ($384/year)
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
    freePriceId: process.env.STRIPE_PRO_FREE_PRICE_ID!,
    description: 'For growing businesses',
    features: [
      'Unlimited products',
      'Up to 5 stores/catalogs',
      'Full analytics',
      'Delivery scheduling',
      'Customer insights',
      'Priority support',
    ],
    limits: {
      products: Infinity,
      categories: Infinity,
      stores: 5,
      customDomain: false,
      advancedAnalytics: true,
      inventoryManagement: true,
      wholesalePricing: true,
      prioritySupport: true,
      advancedBranding: true,
      teamMembers: 0,
      apiAccess: false,
      scheduling: true,
      customerInsights: true,
    },
  },
  BUSINESS: {
    name: 'Business',
    price: 79,
    annualPrice: 66,           // ~17% discount ($792/year)
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
    annualPriceId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID!,
    freePriceId: process.env.STRIPE_BUSINESS_FREE_PRICE_ID!,
    description: 'For enterprises and teams',
    features: [
      'Everything in Pro',
      'Unlimited stores/catalogs',
      'Team access (5 users)',
      'Custom domain',
      'API access',
      'Dedicated support',
    ],
    limits: {
      products: Infinity,
      categories: Infinity,
      stores: Infinity,
      customDomain: true,
      advancedAnalytics: true,
      inventoryManagement: true,
      wholesalePricing: true,
      prioritySupport: true,
      advancedBranding: true,
      teamMembers: 5,
      apiAccess: true,
      scheduling: true,
      customerInsights: true,
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

// Helper function to check store limit
export function canAddStore(userPlan: PlanId, currentStoreCount: number): boolean {
  const limits = getPlanLimits(userPlan)
  return currentStoreCount < limits.stores
}

// Helper function to get store limit
export function getStoreLimit(userPlan: PlanId): number {
  return PLANS[userPlan].limits.stores
}

// Plan hierarchy for comparison (higher = more features)
export const PLAN_HIERARCHY: Record<PlanId, number> = {
  STARTER: 1,
  PRO: 2,
  BUSINESS: 3
}

// Check if plan has access to required plan level
export function hasPlanAccess(userPlan: PlanId, requiredPlan: PlanId): boolean {
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan]
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
        price: PLANS.STARTER.freePriceId, // Use free price ID for skipped onboarding
      },
    ],
    metadata: {
      plan: 'STARTER',
      billingType: 'free',
      source: 'waveorder_platform'
    }
  })
}

export async function createSubscriptionByPlan(
  customerId: string,
  plan: PlanId,
  billingType: 'monthly' | 'yearly' | 'free' | 'trial',
  trialDays: number = 14
) {
  const planData = PLANS[plan]
  let priceId: string
  
  // For trial, use the monthly price but add trial_period_days
  if (billingType === 'trial') {
    priceId = planData.priceId // Use monthly price for trial
  } else if (billingType === 'free') {
    priceId = planData.freePriceId
  } else if (billingType === 'yearly') {
    priceId = planData.annualPriceId
  } else {
    priceId = planData.priceId
  }
  
  // Create subscription with or without trial
  if (billingType === 'trial') {
    return await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: trialDays,
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      trial_settings: {
        end_behavior: {
          missing_payment_method: 'pause'
        }
      },
      metadata: {
        plan,
        billingType: 'trial',
        source: 'waveorder_platform'
      }
    })
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

/**
 * Create a Pro subscription with 14-day free trial
 * No credit card required - trial is managed by Stripe
 * After trial ends, subscription pauses until payment method is added
 */
export async function createTrialSubscription(customerId: string) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: PLANS.PRO.priceId,
      },
    ],
    trial_period_days: 14,
    payment_settings: {
      save_default_payment_method: 'on_subscription'
    },
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'pause'
      }
    },
    metadata: {
      plan: 'PRO',
      billingType: 'trial',
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
  const planData = PLANS[plan]
  let priceId: string | undefined
  
  if (billingType === 'free') {
    priceId = planData.freePriceId
  } else if (billingType === 'yearly') {
    priceId = planData.annualPriceId
  } else {
    priceId = planData.priceId
  }
  
  if (!priceId || priceId.trim() === '') {
    const envVarName = billingType === 'free' 
      ? `STRIPE_${plan}_FREE_PRICE_ID`
      : billingType === 'yearly'
      ? `STRIPE_${plan}_ANNUAL_PRICE_ID`
      : `STRIPE_${plan}_PRICE_ID`
    throw new Error(`Price ID not configured. Missing environment variable: ${envVarName}`)
  }
  
  return priceId
}

export function getBillingTypeFromPriceId(priceId: string): 'monthly' | 'yearly' | 'free' | null {
  if (!priceId || priceId.trim() === '') return null
  
  // Check all plans for matching price IDs
  for (const planData of Object.values(PLANS)) {
    if (planData.freePriceId === priceId) return 'free'
    if (planData.annualPriceId === priceId) return 'yearly'
    if (planData.priceId === priceId) return 'monthly'
  }
  
  return null
}