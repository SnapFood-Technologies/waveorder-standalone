// src/app/superadmin/businesses/[businessId]/marketplace/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Package, Building2, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface MarketplaceInfo {
  isOriginator: boolean
  isSupplier: boolean
  originator?: {
    id: string
    name: string
  }
  suppliers?: Array<{
    id: string
    name: string
    productCount: number
  }>
}

export default function MarketplacePage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<{ id: string; name: string } | null>(null)
  const [marketplaceInfo, setMarketplaceInfo] = useState<MarketplaceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [businessId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [businessRes, originatorRes, suppliersRes] = await Promise.all([
        fetch(`/api/superadmin/businesses/${businessId}`),
        fetch(`/api/superadmin/businesses/${businessId}/marketplace/originator`),
        fetch(`/api/superadmin/businesses/${businessId}/marketplace/suppliers`)
      ])

      if (businessRes.ok) {
        const businessData = await businessRes.json()
        setBusiness(businessData.business)
      }

      const originatorData = originatorRes.ok ? await originatorRes.json() : null
      const suppliersData = suppliersRes.ok ? await suppliersRes.json() : null

      // Determine if originator or supplier
      const businessData = businessRes.ok ? await businessRes.json() : null
      const isOriginator = businessData?.business?.connectedBusinesses?.length > 0
      const isSupplier = !!originatorData?.originator

      setMarketplaceInfo({
        isOriginator,
        isSupplier,
        originator: originatorData?.originator || undefined,
        suppliers: suppliersData?.suppliers || undefined
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!marketplaceInfo || (!marketplaceInfo.isOriginator && !marketplaceInfo.isSupplier)) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">This business is not part of the marketplace.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/superadmin/businesses/${businessId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Business Details
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-gray-600 mt-1">{business?.name}</p>
      </div>

      {/* Supplier View - Show Originator */}
      {marketplaceInfo.isSupplier && marketplaceInfo.originator && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your Originator</h2>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">{marketplaceInfo.originator.name}</p>
            <p className="text-xs text-blue-700 mt-1">
              Your products are visible to this originator's marketplace
            </p>
            <Link
              href={`/superadmin/businesses/${marketplaceInfo.originator.id}`}
              className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Originator Details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> As a supplier, you cannot see the originator's products or other suppliers' products. 
              Only the originator can see products from all connected suppliers.
            </p>
          </div>
        </div>
      )}

      {/* Originator View - Show Suppliers */}
      {marketplaceInfo.isOriginator && marketplaceInfo.suppliers && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">Your Suppliers</h2>
            <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
              {marketplaceInfo.suppliers.length} {marketplaceInfo.suppliers.length === 1 ? 'Supplier' : 'Suppliers'}
            </span>
          </div>

          {marketplaceInfo.suppliers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No suppliers connected yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {marketplaceInfo.suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500">{supplier.productCount} products</p>
                    </div>
                  </div>
                  <Link
                    href={`/superadmin/businesses/${supplier.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-xs text-teal-800">
              <strong>Marketplace Owner:</strong> You can see and manage products from all your suppliers. 
              Suppliers cannot see each other's products or your products.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
