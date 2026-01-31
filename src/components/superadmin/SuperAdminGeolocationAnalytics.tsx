// components/superadmin/SuperAdminGeolocationAnalytics.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe,
  MapPin,
  Building2,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  TrendingUp
} from 'lucide-react'

interface GeolocationData {
  businessesByCountry: Array<{ country: string; count: number }>
  businessesWithoutCountry: number
  businessesByCity: Array<{ city: string; count: number }>
  viewsByCountry: Array<{ country: string; views: number }>
  viewsByCity: Array<{ city: string; views: number }>
  trafficTrends: Array<{ date: string; [country: string]: string | number }>
  topCountriesForTrends: string[]
  mobileVsDesktopByCountry: Array<{
    country: string
    mobile: number
    desktop: number
    tablet: number
    total: number
  }>
  topBrowsersByRegion: Array<{
    country: string
    browsers: Array<{ browser: string; count: number }>
  }>
  totalViews: number
  totalBusinesses: number
  uniqueCountries: number
  uniqueCities: number
}

// Country code to flag emoji mapping
const getCountryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    'Albania': '🇦🇱',
    'Greece': '🇬🇷',
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'Brazil': '🇧🇷',
    'Kosovo': '🇽🇰',
    'North Macedonia': '🇲🇰',
    'The Netherlands': '🇳🇱',
    'Netherlands': '🇳🇱',
    'Portugal': '🇵🇹',
    'Belgium': '🇧🇪',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭',
    'Poland': '🇵🇱',
    'Romania': '🇷🇴',
    'Bulgaria': '🇧🇬',
    'Serbia': '🇷🇸',
    'Croatia': '🇭🇷',
    'Slovenia': '🇸🇮',
    'Montenegro': '🇲🇪',
    'Bosnia and Herzegovina': '🇧🇦',
    'Turkey': '🇹🇷',
    'Cyprus': '🇨🇾',
    'AL': '🇦🇱',
    'GR': '🇬🇷',
    'US': '🇺🇸',
    'ES': '🇪🇸',
    'XK': '🇽🇰',
    'MK': '🇲🇰',
    'NL': '🇳🇱',
    'Barbados': '🇧🇧',
    'BB': '🇧🇧'
  }
  return flags[country] || '🌍'
}

// Simple bar chart component
function SimpleBarChart({ 
  data, 
  valueKey, 
  labelKey, 
  color = 'bg-blue-500',
  maxItems = 10 
}: { 
  data: any[]
  valueKey: string
  labelKey: string
  color?: string
  maxItems?: number
}) {
  const displayData = data.slice(0, maxItems)
  const maxValue = Math.max(...displayData.map(d => d[valueKey] || 0), 1)
  
  return (
    <div className="space-y-3">
      {displayData.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-36 text-sm text-gray-700 truncate flex items-center gap-1">
            <span>{getCountryFlag(item[labelKey])}</span>
            <span>{item[labelKey]}</span>
          </div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-16 text-sm font-medium text-gray-900 text-right">
            {item[valueKey]?.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

// Simple line chart (trend visualization)
function SimpleTrendChart({ 
  data, 
  countries 
}: { 
  data: any[]
  countries: string[]
}) {
  if (!data.length) return <p className="text-gray-500 text-center py-8">No trend data available</p>
  
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
  const textColors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600']
  
  // Get max value for scaling
  let maxValue = 1
  data.forEach(d => {
    countries.forEach(c => {
      if (d[c] && d[c] > maxValue) maxValue = d[c]
    })
  })
  
  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {countries.map((country, i) => (
          <div key={country} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colors[i % colors.length]}`} />
            <span className="text-sm text-gray-600">{getCountryFlag(country)} {country}</span>
          </div>
        ))}
      </div>
      
      {/* Chart */}
      <div className="h-48 flex items-end gap-1">
        {data.slice(-14).map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-0.5 items-end" style={{ height: '160px' }}>
              {countries.map((country, ci) => {
                const value = d[country] || 0
                const height = (value / maxValue) * 100
                return (
                  <div
                    key={country}
                    className={`flex-1 ${colors[ci % colors.length]} rounded-t transition-all duration-300`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${country}: ${value}`}
                  />
                )
              })}
            </div>
            <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
              {d.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SuperAdminGeolocationAnalytics() {
  const [data, setData] = useState<GeolocationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchData()
  }, [days])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/superadmin/analytics/geolocation?days=${days}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching geolocation data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Failed to load data</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="w-7 h-7 text-blue-600" />
            Geolocation Analytics
          </h1>
          <p className="text-gray-600 mt-1">Geographic distribution and location-based insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Eye className="w-4 h-4" />
            Total Views
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Globe className="w-4 h-4" />
            Countries
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.uniqueCountries}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <MapPin className="w-4 h-4" />
            Cities
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.uniqueCities}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
            <Building2 className="w-4 h-4" />
            Businesses
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.totalBusinesses.toLocaleString()}</p>
        </div>
      </div>

      {/* Business Distribution Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          Business Distribution
        </h2>
        <p className="text-sm text-gray-600 mb-6">Active businesses with country data, grouped by location</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* By Country */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">By Country</h3>
            {data.businessesByCountry.length > 0 ? (
              <SimpleBarChart 
                data={data.businessesByCountry} 
                valueKey="count" 
                labelKey="country"
                color="bg-blue-500"
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No country data available</p>
            )}
            {data.businessesWithoutCountry > 0 && (
              <p className="text-xs text-gray-500 mt-4">
                + {data.businessesWithoutCountry} businesses without country set
              </p>
            )}
          </div>
          
          {/* By City */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Top 10 Cities</h3>
            {data.businessesByCity.length > 0 ? (
              <div className="space-y-2">
                {data.businessesByCity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700">{item.city}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No city data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Storefront Traffic Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Eye className="w-5 h-5 text-gray-500" />
          Storefront Traffic
        </h2>
        <p className="text-sm text-gray-600 mb-6">Page views from VisitorSession tracking, grouped by visitor location (IP-based geolocation)</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Countries */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Top Countries by Views</h3>
            {data.viewsByCountry.length > 0 ? (
              <SimpleBarChart 
                data={data.viewsByCountry} 
                valueKey="views" 
                labelKey="country"
                color="bg-green-500"
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No traffic data available</p>
            )}
          </div>
          
          {/* Top Cities */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Top 10 Cities by Views</h3>
            {data.viewsByCity.length > 0 ? (
              <div className="space-y-2">
                {data.viewsByCity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700">{item.city}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.views.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No city data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Traffic Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          Traffic Trends by Country
        </h2>
        <p className="text-sm text-gray-600 mb-6">Daily storefront visits from the top 5 countries over the selected time period</p>
        
        {data.trafficTrends.length > 0 && data.topCountriesForTrends.length > 0 ? (
          <SimpleTrendChart 
            data={data.trafficTrends} 
            countries={data.topCountriesForTrends} 
          />
        ) : (
          <p className="text-gray-500 text-center py-8">No trend data available</p>
        )}
      </div>

      {/* Device & Browser Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-gray-500" />
          Device & Browser
        </h2>
        <p className="text-sm text-gray-600 mb-6">Visitor device types and browsers parsed from user-agent data, grouped by country</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mobile vs Desktop */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Device Type by Country</h3>
            {data.mobileVsDesktopByCountry.length > 0 ? (
              <div className="space-y-3">
                {data.mobileVsDesktopByCountry.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{getCountryFlag(item.country)} {item.country}</span>
                      <span className="text-gray-500">{item.total.toLocaleString()} total</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${(item.mobile / item.total) * 100}%` }}
                        title={`Mobile: ${item.mobile}`}
                      />
                      <div 
                        className="bg-green-500 h-full" 
                        style={{ width: `${(item.desktop / item.total) * 100}%` }}
                        title={`Desktop: ${item.desktop}`}
                      />
                      <div 
                        className="bg-purple-500 h-full" 
                        style={{ width: `${(item.tablet / item.total) * 100}%` }}
                        title={`Tablet: ${item.tablet}`}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 mt-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    <div className="w-3 h-3 bg-blue-500 rounded" /> Mobile
                  </div>
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    <div className="w-3 h-3 bg-green-500 rounded" /> Desktop
                  </div>
                  <div className="flex items-center gap-1">
                    <Tablet className="w-3 h-3" />
                    <div className="w-3 h-3 bg-purple-500 rounded" /> Tablet
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No device data available</p>
            )}
          </div>
          
          {/* Browsers by Region */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">Top Browsers by Region</h3>
            {data.topBrowsersByRegion.length > 0 ? (
              <div className="space-y-4">
                {data.topBrowsersByRegion.slice(0, 5).map((region, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-gray-800 mb-2">
                      {getCountryFlag(region.country)} {region.country}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {region.browsers.map((b, bi) => (
                        <span 
                          key={bi}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {b.browser}: {b.count}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No browser data available</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
