// components/superadmin/SuperAdminAnalyticsArchived.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Archive
} from 'lucide-react'

interface ArchivedData {
  incompleteBusinesses: {
    id: string
    name: string
    missingFields: string[]
    createdAt: string
  }[]
  inactiveBusinesses: {
    id: string
    name: string
    deactivatedAt: string | null
    deactivationReason: string | null
    createdAt: string
  }[]
}

export function SuperAdminAnalyticsArchived() {
  const [data, setData] = useState<ArchivedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArchivedData()
  }, [])

  const fetchArchivedData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/superadmin/analytics/archived')
      
      if (!response.ok) {
        throw new Error('Failed to fetch archived data')
      }

      const archivedData = await response.json()
      setData(archivedData)
    } catch (error) {
      console.error('Error fetching archived data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load archived data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading archived data</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchArchivedData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/superadmin/analytics"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Archive className="w-7 h-7 text-gray-600" />
              Archived Data
            </h1>
            <p className="text-gray-600 mt-1">Incomplete and inactive businesses requiring attention</p>
          </div>
        </div>
      </div>

      {/* Incomplete Businesses */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Incomplete Businesses</h3>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            {data.incompleteBusinesses.length} businesses
          </span>
        </div>
        
        {data.incompleteBusinesses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Business</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Missing Fields</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.incompleteBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{business.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {business.missingFields.map((field, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(business.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No incomplete businesses found</p>
          </div>
        )}
      </div>

      {/* Inactive Businesses */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Inactive Businesses</h3>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            {data.inactiveBusinesses.length} businesses
          </span>
        </div>
        
        {data.inactiveBusinesses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Business</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Deactivated</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.inactiveBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{business.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {business.deactivatedAt
                        ? new Date(business.deactivatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {business.deactivationReason || (
                        <span className="text-gray-400 italic">No reason provided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No inactive businesses found</p>
          </div>
        )}
      </div>
    </div>
  )
}
