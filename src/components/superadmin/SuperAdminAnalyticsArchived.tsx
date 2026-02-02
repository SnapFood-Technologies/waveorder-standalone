// components/superadmin/SuperAdminAnalyticsArchived.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Archive,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [activateModal, setActivateModal] = useState<{ isOpen: boolean; business: { id: string; name: string } | null }>({
    isOpen: false,
    business: null
  })
  const [activating, setActivating] = useState(false)

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

  const handleActivateBusiness = async () => {
    if (!activateModal.business) return

    try {
      setActivating(true)
      const response = await fetch(`/api/superadmin/businesses/${activateModal.business.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to activate business')
      }

      // Remove the activated business from the list
      setData(prev => prev ? {
        ...prev,
        inactiveBusinesses: prev.inactiveBusinesses.filter(b => b.id !== activateModal.business?.id)
      } : null)

      setActivateModal({ isOpen: false, business: null })
    } catch (error) {
      console.error('Error activating business:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to activate business')
    } finally {
      setActivating(false)
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
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
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
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActivateModal({ isOpen: true, business: { id: business.id, name: business.name } })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Activate
                      </button>
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

      {/* Activate Confirmation Modal */}
      {activateModal.isOpen && activateModal.business && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !activating && setActivateModal({ isOpen: false, business: null })} />
            
            <div className="relative inline-block w-full max-w-md p-6 my-8 text-left align-middle bg-white rounded-xl shadow-xl transform transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Activate Business</h3>
                </div>
                <button
                  onClick={() => !activating && setActivateModal({ isOpen: false, business: null })}
                  disabled={activating}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="mb-6">
                <p className="text-gray-600">
                  Are you sure you want to activate <span className="font-semibold text-gray-900">{activateModal.business.name}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This will restore the business storefront and allow customers to access it again.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setActivateModal({ isOpen: false, business: null })}
                  disabled={activating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivateBusiness}
                  disabled={activating}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {activating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Yes, Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
