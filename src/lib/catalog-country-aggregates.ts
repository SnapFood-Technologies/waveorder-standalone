import { prisma } from '@/lib/prisma'

function normCode(c: string): string | null {
  const x = c.trim().toUpperCase().slice(0, 2)
  return /^[A-Z]{2}$/.test(x) ? x : null
}

export async function getCatalogCountryAggregatesForBusiness(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { connectedBusinesses: true, countryBasedCatalogEnabled: true }
  })

  const businessIds = [businessId, ...(business?.connectedBusinesses || [])]

  const products = await prisma.product.findMany({
    where: {
      businessId: { in: businessIds },
      OR: [
        { visibleCountryCodes: { isEmpty: false } },
        { hiddenCountryCodes: { isEmpty: false } }
      ]
    },
    select: {
      id: true,
      name: true,
      sku: true,
      visibleCountryCodes: true,
      hiddenCountryCodes: true
    }
  })

  const visibleByCode = new Map<string, Set<string>>()
  const hiddenByCode = new Map<string, Set<string>>()

  for (const p of products) {
    for (const raw of p.visibleCountryCodes) {
      const code = normCode(raw)
      if (!code) continue
      if (!visibleByCode.has(code)) visibleByCode.set(code, new Set())
      visibleByCode.get(code)!.add(p.id)
    }
    for (const raw of p.hiddenCountryCodes) {
      const code = normCode(raw)
      if (!code) continue
      if (!hiddenByCode.has(code)) hiddenByCode.set(code, new Set())
      hiddenByCode.get(code)!.add(p.id)
    }
  }

  const allCodes = new Set([...visibleByCode.keys(), ...hiddenByCode.keys()])
  const rows = Array.from(allCodes)
    .sort()
    .map((code) => ({
      code,
      visibleProductCount: visibleByCode.get(code)?.size ?? 0,
      hiddenProductCount: hiddenByCode.get(code)?.size ?? 0
    }))

  const toRow = (code: string, set: Set<string>) => ({
    code,
    productIds: [...set],
    productCount: set.size
  })

  /** Countries with at least one product in the visible list */
  const visibleCountryRows = Array.from(visibleByCode.entries())
    .filter(([, set]) => set.size > 0)
    .map(([code, set]) => toRow(code, set))
    .sort((a, b) => a.code.localeCompare(b.code))

  /** Countries with at least one product in the hidden (excluded) list */
  const excludedCountryRows = Array.from(hiddenByCode.entries())
    .filter(([, set]) => set.size > 0)
    .map(([code, set]) => toRow(code, set))
    .sort((a, b) => a.code.localeCompare(b.code))

  return {
    countryBasedCatalogEnabled: business?.countryBasedCatalogEnabled ?? false,
    summary: {
      productsWithAnyCountryRule: products.length,
      distinctCountryCodes: allCodes.size
    },
    rows,
    visibleCountryRows,
    excludedCountryRows,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      visibleCountryCodes: p.visibleCountryCodes,
      hiddenCountryCodes: p.hiddenCountryCodes
    }))
  }
}
