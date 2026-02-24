// src/components/admin/analytics/ServiceSharesAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Share2,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Scissors,
  Briefcase,
  Eye
} from 'lucide-react'
import { DateRangeFilter } from '../dashboard/DateRangeFilter'

interface ServiceSharesAnalyticsProps {
  businessId: string
}

interface ServiceShareData {
  productId: string
  productName: string
  productImage?: string
  shareVisits: number
}

interface SharesData {
  totalShareVisits: number
  topSharedProducts: ServiceShareData[]
}

export default function ServiceSharesAnalytics({ businessId }: ServiceSharesAnalyticsProps) {
  const [data, setData] = useState<SharesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessType, setBusinessType] = useState<string>('RESTAURANT')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  })
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')

  useEffect(() => {
    fetchBusiness()
  }, [businessId])
  useEffect(() => {
    fetchSharesData()
  }, [businessId, dateRange])

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const result = await response.json()
        setBusinessType(result.business?.businessType || 'RESTAURANT')
      }
    } catch (e) {
      console.error('Error fetching business:', e)
    }
  }
  const fetchSharesData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })
      
      const response = await fetch(`/api/admin/stores/${businessId}/analytics/product-shares?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching service shares data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href={`/admin/stores/${businessId}/analytics`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Shares</h1>
            <p className="text-sm text-gray-600">Track how your services are being shared</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <button
            onClick={fetchSharesData}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Total Share Visits Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Share2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Share Link Visits</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data?.totalShareVisits?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Visits from service share links in the selected period
            </p>
          </div>

          {/* Top Shared Services */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Top Shared Services</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Services that drive the most traffic from share links
              </p>
            </div>
            
            {data?.topSharedProducts && data.topSharedProducts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.topSharedProducts.map((service, index) => (
                  <div key={service.productId} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-purple-600">
                        {index + 1}
                      </span>
                    </div>
                    
                    {service.productImage ? (
                      <img 
                        src={service.productImage} 
                        alt={service.productName}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {businessType === 'SERVICES' ? <Briefcase className="w-6 h-6 text-gray-400" /> : <Scissors className="w-6 h-6 text-gray-400" />}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {service.productName}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span className="font-semibold">
                        {service.shareVisits.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">visits</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Share Data Yet</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  When customers share your services and others visit those links, the data will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2">How Service Sharing Works</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Customers can share services using the share button on service details</li>
              <li>• Each visit from a share link is tracked automatically</li>
              <li>• Share links include tracking parameters to identify the source</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
