// lib/trial.ts
// Trial management utilities - Stripe-managed trials with database backup

import { prisma } from '@/lib/prisma'
import type { User, Business } from '@prisma/client'

// Trial configuration
export const TRIAL_DAYS = 14
export const GRACE_DAYS = 7

// Trial status types
export type TrialStatus = 'PAID' | 'TRIAL_ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'STARTER_LIMITED'

/**
 * Subscription status from Stripe that indicates trial/payment state
 */
export type StripeSubscriptionStatus = 
  | 'active'           // Paid and active
  | 'trialing'         // In trial period
  | 'past_due'         // Payment failed, in retry period
  | 'paused'           // Trial ended without payment
  | 'canceled'         // Subscription canceled
  | 'incomplete'       // Setup incomplete
  | 'incomplete_expired'

/**
 * Get the trial status for a user
 * Primary source: Stripe subscription status
 * Fallback: Database trial dates (for backward compatibility)
 * 
 * - PAID: Active paid subscription
 * - TRIAL_ACTIVE: In Stripe trial period
 * - GRACE_PERIOD: Trial ended, within grace period (paused in Stripe)
 * - STARTER_LIMITED: Downgraded to Starter limits
 * - EXPIRED: Grace period ended, account needs payment
 */
export function getTrialStatus(user: Pick<User, 'trialEndsAt' | 'graceEndsAt'>): TrialStatus {
  // No trial dates = paid user or never had trial
  if (!user.trialEndsAt) return 'PAID'
  
  const now = new Date()
  
  // Within trial period
  if (now < user.trialEndsAt) return 'TRIAL_ACTIVE'
  
  // Within grace period (7 days after trial)
  if (user.graceEndsAt && now < user.graceEndsAt) return 'GRACE_PERIOD'
  
  // Past grace period - limited to Starter
  return 'STARTER_LIMITED'
}

/**
 * Get the trial status for a business
 */
export function getBusinessTrialStatus(business: Pick<Business, 'trialEndsAt' | 'graceEndsAt'>): TrialStatus {
  if (!business.trialEndsAt) return 'PAID'
  
  const now = new Date()
  
  if (now < business.trialEndsAt) return 'TRIAL_ACTIVE'
  if (business.graceEndsAt && now < business.graceEndsAt) return 'GRACE_PERIOD'
  
  return 'EXPIRED'
}

/**
 * Check if user can access features (trial active, grace period, or paid)
 */
export function canAccessFeatures(user: Pick<User, 'trialEndsAt' | 'graceEndsAt'>): boolean {
  const status = getTrialStatus(user)
  return status === 'PAID' || status === 'TRIAL_ACTIVE' || status === 'GRACE_PERIOD'
}

/**
 * Check if business can access features
 */
export function canBusinessAccessFeatures(business: Pick<Business, 'trialEndsAt' | 'graceEndsAt'>): boolean {
  const status = getBusinessTrialStatus(business)
  return status === 'PAID' || status === 'TRIAL_ACTIVE' || status === 'GRACE_PERIOD'
}

/**
 * Get days remaining in trial
 * Returns 0 if trial has ended or user is paid
 */
export function getTrialDaysRemaining(user: Pick<User, 'trialEndsAt'>): number {
  if (!user.trialEndsAt) return 0
  
  const now = new Date()
  if (now >= user.trialEndsAt) return 0
  
  const diffMs = user.trialEndsAt.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Get days remaining in grace period
 * Returns 0 if not in grace period
 */
export function getGraceDaysRemaining(user: Pick<User, 'trialEndsAt' | 'graceEndsAt'>): number {
  if (!user.graceEndsAt) return 0
  
  const now = new Date()
  if (now >= user.graceEndsAt) return 0
  if (user.trialEndsAt && now < user.trialEndsAt) return 0 // Still in trial
  
  const diffMs = user.graceEndsAt.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calculate trial end date (14 days from now)
 */
export function calculateTrialEndDate(): Date {
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)
  return trialEndsAt
}

/**
 * Calculate grace period end date (7 days after trial ends)
 */
export function calculateGraceEndDate(trialEndsAt: Date): Date {
  const graceEndsAt = new Date(trialEndsAt)
  graceEndsAt.setDate(graceEndsAt.getDate() + GRACE_DAYS)
  return graceEndsAt
}

/**
 * Start a trial for a user with the selected plan
 */
export async function startUserTrial(
  userId: string, 
  plan: 'STARTER' | 'PRO' | 'BUSINESS'
): Promise<User> {
  const trialEndsAt = calculateTrialEndDate()
  const graceEndsAt = calculateGraceEndDate(trialEndsAt)
  
  return prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      trialEndsAt,
      graceEndsAt,
      trialUsed: true
    }
  })
}

/**
 * Start a trial for a business
 */
export async function startBusinessTrial(
  businessId: string,
  plan: 'STARTER' | 'PRO' | 'BUSINESS'
): Promise<Business> {
  const trialEndsAt = calculateTrialEndDate()
  const graceEndsAt = calculateGraceEndDate(trialEndsAt)
  
  return prisma.business.update({
    where: { id: businessId },
    data: {
      subscriptionPlan: plan,
      trialEndsAt,
      graceEndsAt
    }
  })
}

/**
 * Convert trial to paid subscription (clear trial dates)
 */
export async function convertTrialToPaid(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      trialEndsAt: null,
      graceEndsAt: null
    }
  })
}

/**
 * Convert business trial to paid
 */
export async function convertBusinessTrialToPaid(businessId: string): Promise<Business> {
  return prisma.business.update({
    where: { id: businessId },
    data: {
      trialEndsAt: null,
      graceEndsAt: null,
      subscriptionStatus: 'ACTIVE'
    }
  })
}

/**
 * Check if user has already used their free trial
 */
export async function hasUsedTrial(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialUsed: true }
  })
  return user?.trialUsed ?? false
}

/**
 * Get trial info for display purposes
 */
export function getTrialInfo(user: Pick<User, 'trialEndsAt' | 'graceEndsAt' | 'plan'>) {
  const status = getTrialStatus(user)
  const trialDaysRemaining = getTrialDaysRemaining(user)
  const graceDaysRemaining = getGraceDaysRemaining(user)
  
  // Determine effective plan based on trial status
  const isOnTrial = status === 'TRIAL_ACTIVE'
  const effectivePlan = isOnTrial ? 'PRO' : (status === 'STARTER_LIMITED' || status === 'GRACE_PERIOD') ? 'STARTER' : user.plan
  
  return {
    status,
    trialDaysRemaining,
    graceDaysRemaining,
    isTrialActive: status === 'TRIAL_ACTIVE',
    isGracePeriod: status === 'GRACE_PERIOD',
    isExpired: status === 'STARTER_LIMITED',
    isStarterLimited: status === 'STARTER_LIMITED',
    isPaid: status === 'PAID',
    canAccessFeatures: status !== 'STARTER_LIMITED' || graceDaysRemaining > 0,
    plan: user.plan,
    effectivePlan, // The plan features they currently have access to
    // Warning levels for UI
    showTrialWarning: status === 'TRIAL_ACTIVE' && trialDaysRemaining <= 3,
    showGraceWarning: status === 'GRACE_PERIOD',
    showExpiredWarning: status === 'STARTER_LIMITED'
  }
}

/**
 * Get trial status from Stripe subscription status
 */
export function getTrialStatusFromStripe(stripeStatus: StripeSubscriptionStatus): TrialStatus {
  switch (stripeStatus) {
    case 'active':
      return 'PAID'
    case 'trialing':
      return 'TRIAL_ACTIVE'
    case 'paused':
    case 'past_due':
      return 'GRACE_PERIOD'
    case 'canceled':
    case 'incomplete_expired':
      return 'STARTER_LIMITED'
    default:
      return 'STARTER_LIMITED'
  }
}

/**
 * Get business trial info
 */
export function getBusinessTrialInfo(business: Pick<Business, 'trialEndsAt' | 'graceEndsAt' | 'subscriptionPlan'>) {
  const status = getBusinessTrialStatus(business)
  
  let trialDaysRemaining = 0
  let graceDaysRemaining = 0
  
  if (business.trialEndsAt) {
    const now = new Date()
    if (now < business.trialEndsAt) {
      trialDaysRemaining = Math.ceil((business.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    } else if (business.graceEndsAt && now < business.graceEndsAt) {
      graceDaysRemaining = Math.ceil((business.graceEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
  }
  
  // Determine effective plan based on trial status
  const isOnTrial = status === 'TRIAL_ACTIVE'
  const isStarterLimited = status === 'EXPIRED' || status === 'GRACE_PERIOD'
  const effectivePlan = isOnTrial ? 'PRO' : isStarterLimited ? 'STARTER' : business.subscriptionPlan
  
  return {
    status,
    trialDaysRemaining,
    graceDaysRemaining,
    isTrialActive: status === 'TRIAL_ACTIVE',
    isGracePeriod: status === 'GRACE_PERIOD',
    isExpired: status === 'EXPIRED',
    isStarterLimited: status === 'EXPIRED',
    isPaid: status === 'PAID',
    canAccessFeatures: status !== 'EXPIRED' || graceDaysRemaining > 0,
    plan: business.subscriptionPlan,
    effectivePlan, // The plan features they currently have access to
    showTrialWarning: status === 'TRIAL_ACTIVE' && trialDaysRemaining <= 3,
    showGraceWarning: status === 'GRACE_PERIOD',
    showExpiredWarning: status === 'EXPIRED'
  }
}
