'use client'

import React, { useState, useEffect } from 'react'
import { Search, Building2, MapPin, Globe, ChevronLeft, ChevronRight } from 'lucide-react'

interface City {
  id: string
  name: string
  geonameId: number
  state: {
    id: string
    name: string
    code: string
    country: {
      id: string
      name: string
      code: string
    }
  }
}

interface Country {
  id: string
  name: string
  code: string
}

interface State {
  id: string
  name: string
  code: string
  countryId: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export function CitiesTab() {
  const [cities, setCities] = useState<City[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedCountryId, setSelectedCountryId] = useState<string>('')
  const [selectedStateId, setSelectedStateId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  // Fetch countries for filter
  useEffect(() => {
    fetchCountries()
  }, [])

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/superadmin/locations/countries?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setCountries(data.data)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  // Fetch states when country changes
  useEffect(() => {
    if (selectedCountryId) {
      fetchStates(selectedCountryId)
      setSelectedStateId('') // Reset state filter when country changes
    } else {
      setStates([])
      setSelectedStateId('')
    }
  }, [selectedCountryId])

  const fetchStates = async (countryId: string) => {
    try {
      const response = await fetch(`/api/superadmin/locations/states?countryId=${countryId}&limit=1000`)
      if (response.ok) {
        const data = await response.json()
        setStates(data.data)
      }
    } catch (error) {
      console.error('Error fetching states:', error)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch cities
  useEffect(() => {
    fetchCities()
  }, [debouncedSearchQuery, selectedCountryId, selectedStateId, currentPage])

  const fetchCities = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        page: currentPage.toString(),
        limit: pagination.limit.toString()
      })

      if (selectedStateId) {
        params.append('stateId', selectedStateId)
      } else if (selectedCountryId) {
        params.append('countryId', selectedCountryId)
      }

      const response = await fetch(`/api/superadmin/locations/cities?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch cities')
      }

      const data = await response.json()
      setCities(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching cities:', error)
      setError(error instanceof Error ? error.message : 'Failed to load cities')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cities by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedCountryId}
              onChange={(e) => {
                setSelectedCountryId(e.target.value)
                setCurrentPage(1)
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            <select
              value={selectedStateId}
              onChange={(e) => {
                setSelectedStateId(e.target.value)
                setCurrentPage(1)
              }}
              disabled={!selectedCountryId}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              {pagination.total} cities
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cities...</p>
        </div>
      ) : (
        <>
      {/* Cities Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geoname ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No cities found
                    </td>
                  </tr>
                ) : (
                  cities.map((city) => (
                    <tr key={city.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-teal-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{city.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">{city.state.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">{city.state.country.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{city.geonameId}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
                {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} cities
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
