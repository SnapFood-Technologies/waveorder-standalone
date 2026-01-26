import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { checkFeatureAccess } from '@/lib/feature-access'
import { prisma } from '@/lib/prisma'

// GET - Get available entities for custom filtering
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    // Check if custom filtering feature is enabled
    const featureAccess = await checkFeatureAccess(businessId, 'customFiltering')
    if (!featureAccess.authorized) {
      return NextResponse.json({ message: featureAccess.error }, { status: featureAccess.status })
    }

    // Check for connected businesses
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { connectedBusinesses: true }
    })

    const hasConnections = business?.connectedBusinesses && Array.isArray(business.connectedBusinesses) && business.connectedBusinesses.length > 0
    
    // Build businessIds array for queries (include connected businesses)
    const businessIds = hasConnections 
      ? [businessId, ...business.connectedBusinesses]
      : [businessId]

    // Fetch all available entities in parallel
    const [categoriesRaw, collectionsRaw, groupsRaw, brandsRaw] = await Promise.all([
      prisma.category.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      }),
      prisma.collection.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      }),
      prisma.group.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      }),
      prisma.brand.findMany({
        where: {
          businessId: hasConnections ? { in: businessIds } : businessId,
          isActive: true
        },
        select: { id: true, name: true, nameAl: true },
        orderBy: { name: 'asc' }
      })
    ])

    // Deduplicate entities by name for originators (merge entities with same name from different businesses)
    const deduplicateByName = <T extends { id: string; name: string; nameAl?: string | null }>(entities: T[]): T[] => {
      if (!hasConnections || entities.length === 0) return entities
      
      const nameMap = new Map<string, T & { ids: string[] }>()
      
      entities.forEach(entity => {
        // Use name as the key for deduplication (case-insensitive)
        const key = entity.name.toLowerCase()
        
        if (nameMap.has(key)) {
          // Merge: add this entity's ID to the ids array
          const existing = nameMap.get(key)!
          existing.ids.push(entity.id)
        } else {
          // First occurrence: create new entry with ids array
          nameMap.set(key, { ...entity, ids: [entity.id] })
        }
      })
      
      return Array.from(nameMap.values())
    }

    const categories = deduplicateByName(categoriesRaw)
    const collections = deduplicateByName(collectionsRaw)
    const groups = deduplicateByName(groupsRaw)
    const brands = deduplicateByName(brandsRaw)

    return NextResponse.json({
      categories,
      collections,
      groups,
      brands
    })

  } catch (error) {
    console.error('Error fetching filter entities:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}