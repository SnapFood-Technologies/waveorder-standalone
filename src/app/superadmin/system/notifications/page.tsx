'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  Search,
  Filter,
  Loader2,
  ExternalLink,
  Settings,
  Check,
  X,
  Minus
} from 'lucide-react'
import { SuperAdminNotificationModal } from '@/components/superadmin/notifications/SuperAdminNotificationModal'

interface NotificationBusiness {
  id: string
  name: string
  slug: string
  logo: string | null
  businessType: string
  storefrontUrl: string
  superAdminUrl: string
  settings: {
    id: string
    notificationEmails: string[]
    orderNotificationsEnabled: boolean
    bookingNotificationsEnabled: boolean
    serviceRequestNotificationsEnabled: boolean
    externalSyncNotificationsEnabled: boolean
  } | null
  isConfigured: boolean
}

const businessTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  RETAIL: 'Retail',
  GROCERY: 'Grocery',
  SALON: 'Salon',
  SERVICES: 'Services',
  JEWELRY: 'Jewelry',
  FLORIST: 'Florist',
  OTHER: 'Other'
}

export default function SuperAdminNotificationsPage() {
  const [businesses, setBusinesses] = useState<NotificationBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalBusiness, setModalBusiness] = useState<NotificationBusiness | null>(null)

  const fetchBusinesses = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter !== 'all') params.set('filter', filter)
      const response = await fetch(
        `/api/superadmin/system/notifications?${params}`
      )
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.businesses || [])
      }
    } catch (error) {
      console.error('Error fetching notification businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinesses()
  }, [filter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBusinesses()
  }

  const handleOpenModal = (b: NotificationBusiness) => {
    setModalBusiness(b)
  }

  const handleCloseModal = () => {
    setModalBusiness(null)
    fetchBusinesses()
  }

  const StatusBadge = ({
    enabled,
    hasEmails
  }: {
    enabled: boolean
    hasEmails: boolean
  }) => {
    if (!enabled || !hasEmails) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          <Minus className="w-3 h-3" />
          Off
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <Check className="w-3 h-3" />
        On
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          SuperAdmin Notifications
        </h1>
        <p className="text-gray-600 mt-1">
          Choose which emails receive order, booking, service request, and
          external product sync notifications per business. Independent of
          admin notification settings.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by business name or slug..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 bg-white"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 bg-white"
            >
              <option value="all">All businesses</option>
              <option value="enabled">Notifications enabled</option>
            </select>
          </div>
          <button
            onClick={() => fetchBusinesses()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No businesses found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug / Storefront
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SuperAdmin Emails
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businesses.map((b) => {
                  const hasAnyEnabled =
                    b.settings?.orderNotificationsEnabled ||
                    b.settings?.bookingNotificationsEnabled ||
                    b.settings?.serviceRequestNotificationsEnabled ||
                    b.settings?.externalSyncNotificationsEnabled
                  const hasEmails =
                    (b.settings?.notificationEmails?.length ?? 0) > 0

                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                            {b.logo ? (
                              <img
                                src={b.logo}
                                alt=""
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium">
                                {b.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {b.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {businessTypeLabels[b.businessType] || b.businessType}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={b.storefrontUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          {b.slug}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          enabled={!!hasAnyEnabled}
                          hasEmails={hasEmails}
                        />
                        {hasEmails && (
                          <span className="ml-2 text-xs text-gray-500">
                            {b.settings!.notificationEmails.length} email
                            {b.settings!.notificationEmails.length !== 1
                              ? 's'
                              : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleOpenModal(b)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Configure
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalBusiness && (
        <SuperAdminNotificationModal
          business={modalBusiness}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
