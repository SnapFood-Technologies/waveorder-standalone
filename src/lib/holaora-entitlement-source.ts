/** Stripe webhooks may update Hola entitlement for this business. */
export const HOLA_ENTITLEMENT_SOURCE_STRIPE = 'STRIPE' as const
/** SuperAdmin controls holaoraEntitled + link; Stripe subscription sync skips this business. */
export const HOLA_ENTITLEMENT_SOURCE_MANUAL = 'MANUAL' as const

export type HolaEntitlementSource =
  | typeof HOLA_ENTITLEMENT_SOURCE_STRIPE
  | typeof HOLA_ENTITLEMENT_SOURCE_MANUAL

export function isStripeManagedHolaEntitlement(
  source: string | null | undefined
): boolean {
  return source !== HOLA_ENTITLEMENT_SOURCE_MANUAL
}

export const HOLA_PROVISION_BUNDLE_FREE = 'FREE' as const
export const HOLA_PROVISION_BUNDLE_PAID = 'PAID' as const

export type HolaProvisionBundleType =
  | typeof HOLA_PROVISION_BUNDLE_FREE
  | typeof HOLA_PROVISION_BUNDLE_PAID
