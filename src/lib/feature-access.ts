import { prisma } from '@/lib/prisma'

export async function checkFeatureAccess(businessId: string, feature: 'brands' | 'collections' | 'customMenu' | 'customFiltering') {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      brandsFeatureEnabled: true,
      collectionsFeatureEnabled: true,
      customMenuEnabled: true,
      customFilteringEnabled: true
    }
  })

  if (!business) {
    return { authorized: false, error: 'Business not found', status: 404 }
  }

  const featureMap = {
    brands: business.brandsFeatureEnabled,
    collections: business.collectionsFeatureEnabled,
    customMenu: business.customMenuEnabled,
    customFiltering: business.customFilteringEnabled
  }

  if (!featureMap[feature]) {
    return { 
      authorized: false, 
      error: `The ${feature} feature is not enabled for this business. Contact your administrator.`, 
      status: 403 
    }
  }

  return { authorized: true }
}
