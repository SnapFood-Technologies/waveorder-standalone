// src/components/admin/analytics/GeographicAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { Globe, MapPin, TrendingUp, ArrowRight, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GeographicAnalyticsProps {
  businessId: string
  dateRange: {
    start: Date
    end: Date
  }
}

interface GeographicData {
  countries: Array<{
    country: string
    visitors: number
    orders: number
    revenue: number
    percentage: number
  }>
  cities: Array<{
    city: string
    country: string
    visitors: number
    orders: number
    revenue: number
    percentage: number
  }>
  totalCountries: number
  totalCities: number
}

export default function GeographicAnalytics({ businessId, dateRange }: GeographicAnalyticsProps) {
  const [data, setData] = useState<GeographicData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchGeographicData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
        
        const response = await fetch(`/api/admin/stores/${businessId}/analytics/geographic?${params}`)
        if (response.ok) {
          const result = await response.json()
          setData(result.data)
        }
      } catch (error) {
        console.error('Error fetching geographic analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGeographicData()
  }, [businessId, dateRange])

  const topCountries = data?.countries.slice(0, 5) || []
  const topCities = data?.cities.slice(0, 5) || []
  const hasData = data && (data.countries.length > 0 || data.cities.length > 0)
  const isOnAdvancedPage = typeof window !== 'undefined' && window.location.pathname.includes('/advanced-analytics')

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Geographic Insights</h3>
        </div>
        {!isOnAdvancedPage && (
          <button
            onClick={() => router.push(`/admin/stores/${businessId}/advanced-analytics`)}
            className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            View Advanced Analytics
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      ) : !hasData ? (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm mb-1">No geographic data available</p>
          <p className="text-gray-400 text-xs">Geographic data will appear here once visitors access your storefront</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Countries */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Top Countries
              </h4>
              <span className="text-xs text-gray-500">{data.totalCountries} total</span>
            </div>
            {topCountries.length > 0 ? (
              <div className="space-y-3">
                {topCountries.map((country, index) => (
                  <div key={country.country} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{country.country}</span>
                        <span className="text-xs text-gray-500">{country.visitors} visitors</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all"
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">
                No country data available
              </div>
            )}
          </div>

          {/* Top Cities */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Top Cities
              </h4>
              <span className="text-xs text-gray-500">{data.totalCities} total</span>
            </div>
            {topCities.length > 0 ? (
              <div className="space-y-3">
                {topCities.map((city, index) => (
                  <div key={`${city.city}-${city.country}`} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {city.city}
                          <span className="text-xs text-gray-500 ml-1">({city.country})</span>
                        </span>
                        <span className="text-xs text-gray-500">{city.visitors} visitors</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${city.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">
                No city data available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
