// src/components/admin/analytics/AdvancedAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Globe,
  MapPin,
  ExternalLink,
  RefreshCw,
  Info,
  TrendingUp,
  Users,
  ShoppingBag
} from 'lucide-react'
import { DateRangeFilter } from '../dashboard/DateRangeFilter'

interface AdvancedAnalyticsProps {
  businessId: string
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

interface TrafficData {
  sources: Array<{
    source: string
    visitors: number
    orders: number
    conversionRate: number
    percentage: number
  }>
  campaigns: Array<{
    campaign: string
    visitors: number
    orders: number
    conversionRate: number
    percentage: number
  }>
  mediums: Array<{
    medium: string
    visitors: number
    orders: number
    conversionRate: number
    percentage: number
  }>
  placements: Array<{
    placement: string
    visitors: number
    orders: number
    conversionRate: number
    percentage: number
  }>
}

export default function AdvancedAnalytics({ businessId }: AdvancedAnalyticsProps) {
  const [geographicData, setGeographicData] = useState<GeographicData | null>(null)
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [businessType, setBusinessType] = useState<string>('RESTAURANT')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  })
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')

  const isSalon = businessType === 'SALON'

  useEffect(() => {
    fetchBusinessData()
    fetchAnalyticsData()
  }, [businessId, dateRange])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const result = await response.json()
        setBusinessType(result.business.businessType || 'RESTAURANT')
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })
      
      // Fetch geographic data
      const geoResponse = await fetch(`/api/admin/stores/${businessId}/analytics/geographic?${params}`)
      if (geoResponse.ok) {
        const geoResult = await geoResponse.json()
        setGeographicData(geoResult.data)
      }

      // Fetch traffic data from advanced analytics endpoint
      const advancedResponse = await fetch(`/api/admin/stores/${businessId}/analytics/advanced?${params}`)
      if (advancedResponse.ok) {
        const advancedResult = await advancedResponse.json()
        const traffic = advancedResult.data.traffic || {}
        
        setTrafficData({
          sources: traffic.sources || [],
          campaigns: traffic.campaigns || [],
          mediums: traffic.mediums || [],
          placements: traffic.placements || []
        })
      } else {
        // Fallback to empty if fetch fails
        setTrafficData({
          sources: [],
          campaigns: [],
          mediums: [],
          placements: []
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      // Set empty data on error
      setTrafficData({
        sources: [],
        campaigns: [],
        mediums: [],
        placements: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const allCountries = geographicData?.countries || []
  const allCities = geographicData?.cities || []
  const allSources = trafficData?.sources || []
  const allCampaigns = trafficData?.campaigns || []
  const allMediums = trafficData?.mediums || []
  const allPlacements = trafficData?.placements || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">
            Geographic insights and traffic sources
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangeFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          <button
            onClick={fetchAnalyticsData}
            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">Advanced Analytics</p>
            <p>
              This dashboard provides detailed geographic data and traffic source analysis for your store.
            </p>
          </div>
        </div>
      </div>

      {/* Geographic Analytics Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-6 h-6 text-teal-600" />
          <h2 className="text-xl font-semibold text-gray-900">Geographic Insights</h2>
        </div>

        {allCountries.length === 0 && allCities.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-1">No geographic data available</p>
            <p className="text-gray-400 text-xs">Geographic data will appear here once visitors access your storefront</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Countries */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  Top Countries
                </h3>
                <span className="text-sm text-gray-500">{geographicData?.totalCountries || 0} total</span>
              </div>
              {allCountries.length > 0 ? (
                <div className="space-y-4">
                  {allCountries.map((country, index) => (
                    <div key={country.country} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{country.country}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {country.visitors} visitors
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                {country.orders} {isSalon ? 'appointments' : 'orders'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-teal-600">{country.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all"
                          style={{ width: `${country.percentage}%` }}
                        ></div>
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

            {/* Cities */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Top Cities
                </h3>
                <span className="text-sm text-gray-500">{geographicData?.totalCities || 0} total</span>
              </div>
              {allCities.length > 0 ? (
                <div className="space-y-4">
                  {allCities.map((city, index) => (
                    <div key={`${city.city}-${city.country}`} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {city.city}
                              <span className="text-xs text-gray-500 ml-2">({city.country})</span>
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {city.visitors} visitors
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingBag className="w-3 h-3" />
                                {city.orders} {isSalon ? 'appointments' : 'orders'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{city.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${city.percentage}%` }}
                        ></div>
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

      {/* Traffic Sources Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <ExternalLink className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Traffic Sources</h2>
        </div>

        {allSources.length === 0 ? (
          <div className="text-center py-12">
            <ExternalLink className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-1">No traffic source data available</p>
            <p className="text-gray-400 text-xs">Source data will appear here once visitors access your storefront</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allSources.map((source, index) => {
              // Dynamic color assignment based on source name or index
              const colorSchemes = [
                { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-600' },
                { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-600' },
                { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-600' },
                { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-600' },
                { bg: 'bg-pink-100', text: 'text-pink-700', bar: 'bg-pink-600' },
                { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-600' },
                { bg: 'bg-teal-100', text: 'text-teal-700', bar: 'bg-teal-600' },
              ]
              
              const sourceColors: Record<string, { bg: string; text: string; bar: string }> = {
                'Direct': colorSchemes[0],
                'gazetareforma.com': colorSchemes[1],
                'facebook': colorSchemes[2],
                'instagram': colorSchemes[3],
                'google': colorSchemes[4],
              }
              
              const colors = sourceColors[source.source] || colorSchemes[index % colorSchemes.length]
              
              return (
                <div key={source.source} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colors.bg}`}>
                        <ExternalLink className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{source.source}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {source.visitors} visitors
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {source.orders} {isSalon ? 'appointments' : 'orders'}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {source.conversionRate}% conversion
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${colors.text}`}>{source.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.bar} h-2 rounded-full transition-all`}
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Campaigns Section */}
      {allCampaigns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
          </div>

          <div className="space-y-4">
            {allCampaigns.map((campaign, index) => {
              const colorSchemes = [
                { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-600' },
                { bg: 'bg-violet-100', text: 'text-violet-700', bar: 'bg-violet-600' },
                { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', bar: 'bg-fuchsia-600' },
                { bg: 'bg-rose-100', text: 'text-rose-700', bar: 'bg-rose-600' },
              ]
              const colors = colorSchemes[index % colorSchemes.length]
              
              return (
                <div key={campaign.campaign} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colors.bg}`}>
                        <TrendingUp className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{campaign.campaign}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {campaign.visitors} visitors
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {campaign.orders} {isSalon ? 'appointments' : 'orders'}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {campaign.conversionRate}% conversion
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${colors.text}`}>{campaign.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.bar} h-2 rounded-full transition-all`}
                      style={{ width: `${campaign.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Placements Section */}
      {allPlacements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">Placements</h2>
          </div>

          <div className="space-y-4">
            {allPlacements.map((placement, index) => {
              const colorSchemes = [
                { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-600' },
                { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-600' },
                { bg: 'bg-lime-100', text: 'text-lime-700', bar: 'bg-lime-600' },
                { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-600' },
              ]
              const colors = colorSchemes[index % colorSchemes.length]
              
              return (
                <div key={placement.placement} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colors.bg}`}>
                        <MapPin className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{placement.placement}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {placement.visitors} visitors
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {placement.orders} {isSalon ? 'appointments' : 'orders'}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {placement.conversionRate}% conversion
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${colors.text}`}>{placement.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.bar} h-2 rounded-full transition-all`}
                      style={{ width: `${placement.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mediums Section */}
      {allMediums.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <ExternalLink className="w-6 h-6 text-cyan-600" />
            <h2 className="text-xl font-semibold text-gray-900">Traffic Mediums</h2>
          </div>

          <div className="space-y-4">
            {allMediums.map((medium, index) => {
              const colorSchemes = [
                { bg: 'bg-cyan-100', text: 'text-cyan-700', bar: 'bg-cyan-600' },
                { bg: 'bg-sky-100', text: 'text-sky-700', bar: 'bg-sky-600' },
                { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-600' },
              ]
              const colors = colorSchemes[index % colorSchemes.length]
              
              return (
                <div key={medium.medium} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colors.bg}`}>
                        <ExternalLink className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{medium.medium}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {medium.visitors} visitors
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {medium.orders} {isSalon ? 'appointments' : 'orders'}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {medium.conversionRate}% conversion
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${colors.text}`}>{medium.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.bar} h-2 rounded-full transition-all`}
                      style={{ width: `${medium.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          {allCountries.length > 0 && (
            <div className="flex items-start gap-2">
              <Globe className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Top Market:</strong> {allCountries[0]?.country} accounts for {allCountries[0]?.percentage}% of your traffic
              </p>
            </div>
          )}
          {allCities.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Leading City:</strong> {allCities[0]?.city} has the most visitors with {allCities[0]?.visitors} total
              </p>
            </div>
          )}
          {allSources.length > 0 && (
            <div className="flex items-start gap-2">
              <ExternalLink className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Best Source:</strong> {allSources.sort((a, b) => b.visitors - a.visitors)[0]?.source} drives the most traffic
              </p>
            </div>
          )}
          {allSources.length > 0 && (
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Best Converter:</strong> {allSources.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.source} has {allSources.sort((a, b) => b.conversionRate - a.conversionRate)[0]?.conversionRate}% conversion
              </p>
            </div>
          )}
          {allCampaigns.length > 0 && (
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Top Campaign:</strong> {allCampaigns[0]?.campaign} with {allCampaigns[0]?.visitors} visitors
              </p>
            </div>
          )}
          {allPlacements.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Best Placement:</strong> {allPlacements[0]?.placement} generates {allPlacements[0]?.percentage}% of placement traffic
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
