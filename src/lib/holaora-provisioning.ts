import { prisma } from '@/lib/prisma'

const STUB_PREFIX = 'stub_'

export function isStubHolaAccountId(id: string | null | undefined): boolean {
  return !!id?.startsWith(STUB_PREFIX)
}

function provisioningStubEnabled(): boolean {
  const v = process.env.HOLAORA_PROVISIONING_STUB
  return v === 'true' || v === '1'
}

/** Called when Stripe entitlement becomes active; real HTTP goes here when Hola documents it. */
export async function provisionHolaOraForBusiness(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { holaoraAccountId: true, holaoraEntitled: true },
  })
  if (!business?.holaoraEntitled) return
  if (business.holaoraAccountId && !isStubHolaAccountId(business.holaoraAccountId)) {
    return
  }

  if (provisioningStubEnabled()) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        holaoraAccountId: `${STUB_PREFIX}${businessId}`,
        holaoraProvisioningStatus: 'stub_success',
        holaoraProvisioningError: null,
      },
    })
    return
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      holaoraProvisioningStatus: 'pending_partner_api',
      holaoraProvisioningError: null,
    },
  })
  console.info(`[HolaOra] provisioning pending_partner_api businessId=${businessId}`)
}

/** Clears local Hola linkage when entitlement ends (partner API TBD). */
export async function deprovisionHolaOraForBusiness(businessId: string): Promise<void> {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      holaoraAccountId: null,
      holaoraSetupUrl: null,
      holaoraProvisioningStatus: 'deprovisioned_local',
      holaoraProvisioningError: null,
    },
  })
}
