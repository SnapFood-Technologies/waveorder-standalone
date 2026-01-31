// lib/store-limits.ts
// Utilities for enforcing store/catalog limits based on subscription plan

import { prisma } from '@/lib/prisma'
import { PLANS, PlanId, canAddStore, getStoreLimit, PLAN_HIERARCHY } from '@/lib/stripe'

export interface StoreCheckResult {
  canCreate: boolean
  currentCount: number
  limit: number
  limitReached: boolean
  suggestedUpgrade?: PlanId
}

/**
 * Check if a user can create a new store based on their plan
 */
export async function checkStoreLimit(userId: string): Promise<StoreCheckResult> {
  // Get user with plan and business count
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      businesses: {
        select: { id: true }
      }
    }
  })

  if (!user) {
    return {
      canCreate: false,
      currentCount: 0,
      limit: 0,
      limitReached: true
    }
  }

  const plan = (user.plan as PlanId) || 'STARTER'
  const currentCount = user.businesses.length
  const limit = getStoreLimit(plan)
  const canCreate = canAddStore(plan, currentCount)
  const limitReached = !canCreate

  // Suggest upgrade if limit reached
  let suggestedUpgrade: PlanId | undefined
  if (limitReached) {
    const planLevel = PLAN_HIERARCHY[plan]
    if (planLevel < PLAN_HIERARCHY.PRO) {
      suggestedUpgrade = 'PRO'
    } else if (planLevel < PLAN_HIERARCHY.BUSINESS) {
      suggestedUpgrade = 'BUSINESS'
    }
  }

  return {
    canCreate,
    currentCount,
    limit,
    limitReached,
    suggestedUpgrade
  }
}

/**
 * Get store count for a user
 */
export async function getStoreCount(userId: string): Promise<number> {
  const count = await prisma.businessUser.count({
    where: { userId }
  })
  return count
}

/**
 * Get all stores for a user
 */
export async function getUserStores(userId: string) {
  const businessUsers = await prisma.businessUser.findMany({
    where: { userId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          trialEndsAt: true,
          graceEndsAt: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      business: {
        createdAt: 'asc'
      }
    }
  })

  return businessUsers.map(bu => ({
    ...bu.business,
    role: bu.role
  }))
}

/**
 * Get the default/active store for a user
 * Returns the user's preferred store if set, otherwise the first store
 */
export async function getDefaultStore(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      defaultBusinessId: true,
      businesses: {
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              subscriptionPlan: true,
              subscriptionStatus: true
            }
          }
        },
        orderBy: {
          business: {
            createdAt: 'asc'
          }
        }
      }
    }
  })

  if (!user || user.businesses.length === 0) {
    return null
  }

  // If user has a preferred store, use that
  if (user.defaultBusinessId) {
    const preferred = user.businesses.find(
      bu => bu.business.id === user.defaultBusinessId
    )
    if (preferred) {
      return {
        ...preferred.business,
        role: preferred.role
      }
    }
  }

  // Otherwise return the first store
  const first = user.businesses[0]
  return {
    ...first.business,
    role: first.role
  }
}

/**
 * Set the user's default/preferred store
 */
export async function setDefaultStore(userId: string, businessId: string): Promise<boolean> {
  // Verify the user has access to this business
  const businessUser = await prisma.businessUser.findFirst({
    where: { userId, businessId }
  })

  if (!businessUser) {
    return false
  }

  await prisma.user.update({
    where: { id: userId },
    data: { defaultBusinessId: businessId } as any
  })

  return true
}

/**
 * Get plan info with store limits
 */
export function getPlanStoreInfo(plan: PlanId) {
  const planData = PLANS[plan]
  return {
    name: planData.name,
    storeLimit: planData.limits.stores,
    isUnlimited: planData.limits.stores === Infinity,
    price: planData.price,
    annualPrice: planData.annualPrice
  }
}

/**
 * Check if user has reached their store limit
 */
export async function hasReachedStoreLimit(userId: string): Promise<boolean> {
  const result = await checkStoreLimit(userId)
  return result.limitReached
}

/**
 * Get upgrade message for store limit
 */
export function getStoreUpgradeMessage(currentPlan: PlanId): string | null {
  const currentLevel = PLAN_HIERARCHY[currentPlan]
  
  if (currentLevel < PLAN_HIERARCHY.PRO) {
    return `Upgrade to Pro to create up to 5 stores/catalogs.`
  } else if (currentLevel < PLAN_HIERARCHY.BUSINESS) {
    return `Upgrade to Business for unlimited stores/catalogs.`
  }
  
  return null
}
