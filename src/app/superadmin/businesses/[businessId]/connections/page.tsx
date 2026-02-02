'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Link2, Plus, Search, X, Loader2, Store, AlertCircle, ChevronLeft, AlertTriangle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Business {
  id: string
  name: string
  slug: string
  logo?: string | null
  businessType?: string
  description?: string | null
}

export default function BusinessConnectionsPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [businessName, setBusinessName] = useState('')
  const [connectedBusinesses, setConnectedBusinesses] = useState<Business[]>([])
  const [availableBusinesses, setAvailableBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [disconnectModalBusiness, setDisconnectModalBusiness] = useState<Business | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    fetchBusinessName()
    fetchConnectedBusinesses()
  }, [businessId])

  const fetchBusinessName = async () => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusinessName(data.business.name)
      }
    } catch (error) {
      console.error('Error fetching business name:', error)
    }
  }

  const fetchConnectedBusinesses = async () => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/connections`)
      if (response.ok) {
        const data = await response.json()
        setConnectedBusinesses(data.connectedBusinesses)
      }
    } catch (error) {
      console.error('Error fetching connected businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableBusinesses = async () => {
    try {
      const response = await fetch(
        `/api/superadmin/businesses/${businessId}/connections/available?search=${encodeURIComponent(searchQuery)}`
      )
      if (response.ok) {
        const data = await response.json()
        setAvailableBusinesses(data.businesses)
      }
    } catch (error) {
      console.error('Error fetching available businesses:', error)
    }
  }

  useEffect(() => {
    if (showConnectModal) {
      fetchAvailableBusinesses()
    }
  }, [showConnectModal, searchQuery])

  const handleConnect = async (targetBusinessId: string) => {
    setConnecting(targetBusinessId)
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetBusinessId })
      })

      if (response.ok) {
        await fetchConnectedBusinesses()
        await fetchAvailableBusinesses()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to connect')
      }
    } catch (error) {
      toast.error('An error occurred while connecting')
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = (business: Business) => {
    setDisconnectModalBusiness(business)
  }

  const confirmDisconnect = async () => {
    if (!disconnectModalBusiness) return

    setIsDisconnecting(true)
    setDisconnecting(disconnectModalBusiness.id)
    try {
      const response = await fetch(
        `/api/superadmin/businesses/${businessId}/connections?targetBusinessId=${disconnectModalBusiness.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setDisconnectModalBusiness(null)
        await fetchConnectedBusinesses()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to disconnect')
      }
    } catch (error) {
      toast.error('An error occurred while disconnecting')
    } finally {
      setIsDisconnecting(false)
      setDisconnecting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/superadmin/businesses/${businessId}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Connected Businesses {businessName && `- ${businessName}`}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage business connections for marketplace and shared products
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect Business
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Business Connections</h3>
            <p className="text-sm text-blue-800">
              Connected businesses can share products, categories, collections, and groups with the same pricing and inventory. This feature is perfect for marketplaces, franchises, or multi-store operations. Connections are bidirectional - when you connect Business A with Business B, both businesses can access each other's shared resources.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 rounded-lg">
            <Link2 className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Connections</p>
            <p className="text-2xl font-bold text-gray-900">{connectedBusinesses.length}</p>
          </div>
        </div>
      </div>

      {/* Connected Businesses List */}
      {connectedBusinesses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No connected businesses yet</h3>
          <p className="text-gray-600 mb-4">Connect businesses to enable product sharing and marketplace features.</p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect First Business
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedBusinesses.map((business) => (
            <div key={business.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="w-12 h-12 rounded-lg object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => handleDisconnect(business)}
                  disabled={disconnecting === business.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Disconnect"
                >
                  {disconnecting === business.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{business.name}</h3>
              <p className="text-sm text-gray-500 mb-2">/{business.slug}</p>
              {business.businessType && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {business.businessType}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Connect to a Business</h2>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search businesses by name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {availableBusinesses.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchQuery ? 'No businesses found matching your search' : 'No available businesses to connect'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {business.logo ? (
                          <img src={business.logo} alt={business.name} className="w-12 h-12 rounded-lg object-contain flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{business.name}</h3>
                          <p className="text-sm text-gray-500 truncate">/{business.slug}</p>
                          {business.description && (
                            <p className="text-sm text-gray-600 mt-1 truncate">{business.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(business.id)}
                        disabled={connecting === business.id}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0 ml-4"
                      >
                        {connecting === business.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Connect
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectModalBusiness && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Disconnect Business
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to disconnect from "{disconnectModalBusiness.name}"? They will no longer be able to share products, categories, collections, and groups.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDisconnectModalBusiness(null)}
                  disabled={isDisconnecting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDisconnect}
                  disabled={isDisconnecting}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Disconnect
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
