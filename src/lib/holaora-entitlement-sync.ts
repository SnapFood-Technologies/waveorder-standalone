import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import {
  parseHolaOraConfig,
  type HolaOraIntegrationConfig,
} from '@/lib/integration-config'
import {
  deprovisionHolaOraForBusiness,
  provisionHolaOraForBusiness,
} from '@/lib/holaora-provisioning'

export type HolaStripeSub = Pick<Stripe.Subscription, 'id' | 'status' | 'items'>

/** True if subscription is paying/trialing and at least one line item price is in the entitlement list. */
export function stripeSubscriptionHasHolaEntitlement(
  sub: HolaStripeSub,
  entitlementStripePriceIds: string[]
): boolean {
  if (!entitlementStripePriceIds.length) return false
  if (sub.status !== 'active' && sub.status !== 'trialing') return false
  const lineIds = new Set(sub.items.data.map((i) => i.price.id))
  return entitlementStripePriceIds.some((p) => lineIds.has(p))
}

export async function getActiveHolaOraPlatformIntegration(): Promise<{
  integration: { id: string; isActive: boolean }
  config: HolaOraIntegrationConfig
} | null> {
  const row = await prisma.integration.findFirst({
    where: { kind: 'HOLAORA', isActive: true },
  })
  if (!row) return null
  const config = parseHolaOraConfig(row.config)
  if (!config) return null
  return { integration: { id: row.id, isActive: row.isActive }, config }
}

async function businessIdsForSubscriptionStripeId(stripeSubId: string): Promise<string[]> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeId: stripeSubId },
    include: { users: true },
  })
  if (!subscription?.users.length) return []
  const userIds = subscription.users.map((u) => u.id)
  const links = await prisma.businessUser.findMany({
    where: { userId: { in: userIds } },
    select: { businessId: true },
  })
  return [...new Set(links.map((l) => l.businessId))]
}

async function applyEntitlementToBusiness(
  businessId: string,
  entitled: boolean,
  platformPresent: boolean
): Promise<void> {
  if (!entitled || !platformPresent) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        holaoraEntitled: false,
        holaoraStorefrontEmbedEnabled: false,
      },
    })
    await deprovisionHolaOraForBusiness(businessId)
    return
  }

  await prisma.business.update({
    where: { id: businessId },
    data: { holaoraEntitled: true },
  })
  await provisionHolaOraForBusiness(businessId)
}

/**
 * Sync Hola entitlement + provisioning for all businesses linked to the Stripe subscription's users.
 */
export async function syncHolaOraEntitlementForStripeSubscription(
  sub: HolaStripeSub
): Promise<void> {
  const businessIds = await businessIdsForSubscriptionStripeId(sub.id)
  if (!businessIds.length) return

  const platform = await getActiveHolaOraPlatformIntegration()
  const entitled =
    !!platform &&
    stripeSubscriptionHasHolaEntitlement(sub, platform.config.entitlementStripePriceIds)

  for (const businessId of businessIds) {
    try {
      await applyEntitlementToBusiness(businessId, entitled, !!platform)
    } catch (e) {
      console.error(`[HolaOra] sync failed businessId=${businessId}`, e)
    }
  }
}
