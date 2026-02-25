// src/components/admin/affiliates/AffiliatesList.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Eye,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AffiliateAnalyticsData {
  affiliate: { id: string; name: string; trackingCode: string }
  summary: { views: number; orders: number; conversionRate: number; revenue: number }
  bySource: Array<{ name: string; count: number }>
  byMedium: Array<{ name: string; count: number }>
  byCountry: Array<{ name: string; count: number }>
  byCity: Array<{ city: string; country: string; count: number }>
  byDevice: Array<{ name: string; count: number }>
  byReferrer: Array<{ referrer: string; referrerHost: string | null; count: number }>
  recentSessions: Array<{ source: string | null; medium: string | null; country: string | null; city: string | null; deviceType: string | null; visitedAt: string }>
  orders: Array<{ id: string; total: number; status: string; paymentStatus: string; createdAt: string; customerName: string | null }>
}

interface AffiliatesListProps {
  businessId: string
}

interface Affiliate {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  commissionType: 'PERCENTAGE' | 'FIXED'
  commissionValue: number
  trackingCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  totalEarnings: number
  totalOrders: number
  pendingBalance: number
  views?: number
  conversionRate?: number
}

export function AffiliatesList({ businessId }: AffiliatesListProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [analyticsModalAffiliate, setAnalyticsModalAffiliate] = useState<Affiliate | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AffiliateAnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    fetchAffiliates()
  }, [businessId])

  const fetchAffiliates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/affiliates`)
      
      if (!response.ok) {
        const data = await response.json()
        if (data.enabled === false) {
          setEnabled(false)
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Failed to fetch affiliates')
      }

      const data = await response.json()
      setEnabled(true)
      setCurrency(data.currency || 'EUR')
      setAffiliates(data.data.affiliates || [])
    } catch (error) {
      console.error('Error fetching affiliates:', error)
      toast.error('Failed to load affiliates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (affiliateId: string) => {
    if (!confirm('Are you sure you want to delete this affiliate? This action cannot be undone.')) {
      return
    }

    setDeletingId(affiliateId)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/affiliates/${affiliateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to delete affiliate')
      }

      toast.success('Affiliate deleted successfully')
      fetchAffiliates()
    } catch (error) {
      console.error('Error deleting affiliate:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete affiliate')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopyLink = async (affiliateId: string, trackingCode: string) => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/affiliates/${affiliateId}/generate-link`)
      if (!response.ok) throw new Error('Failed to generate link')
      
      const data = await response.json()
      await navigator.clipboard.writeText(data.link)
      setCopiedCode(trackingCode)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error('Failed to copy link')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const openAnalyticsModal = async (affiliate: Affiliate) => {
    setAnalyticsModalAffiliate(affiliate)
    setAnalyticsData(null)
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/affiliates/${affiliate.id}/analytics`)
      if (res.ok) {
        const data = await res.json()
        setAnalyticsData(data)
      }
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  const filteredAffiliates = affiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affiliate.trackingCode.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Affiliate System Not Enabled
              </h3>
              <p className="text-yellow-800">
                Affiliate system is not enabled for this business. Please contact support to enable this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Affiliates</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage affiliate accounts and tracking links</p>
        </div>
        <Link
          href={`/admin/stores/${businessId}/affiliates/create`}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Affiliate
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or tracking code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Affiliates List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredAffiliates.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No affiliates found</p>
            <Link
              href={`/admin/stores/${businessId}/affiliates/create`}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Affiliate
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conv. Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAffiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{affiliate.name}</div>
                      {affiliate.email && (
                        <div className="text-xs text-gray-500">{affiliate.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {affiliate.commissionType === 'PERCENTAGE' 
                          ? `${affiliate.commissionValue}%`
                          : formatCurrency(affiliate.commissionValue)
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {affiliate.commissionType === 'PERCENTAGE' ? 'of order total' : 'per order'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{affiliate.trackingCode}</code>
                        <button
                          onClick={() => handleCopyLink(affiliate.id, affiliate.trackingCode)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copy tracking link"
                        >
                          {copiedCode === affiliate.trackingCode ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        affiliate.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {affiliate.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{affiliate.views ?? 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{affiliate.conversionRate ?? 0}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(affiliate.totalEarnings)}</div>
                      {affiliate.pendingBalance > 0 && (
                        <div className="text-xs text-yellow-600">Pending: {formatCurrency(affiliate.pendingBalance)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{affiliate.totalOrders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openAnalyticsModal(affiliate)}
                          className="text-gray-500 hover:text-teal-600"
                          title="View link analytics"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/admin/stores/${businessId}/affiliates/${affiliate.id}/edit`}
                          className="text-teal-600 hover:text-teal-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(affiliate.id)}
                          disabled={deletingId === affiliate.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deletingId === affiliate.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {analyticsModalAffiliate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setAnalyticsModalAffiliate(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Link Analytics — {analyticsModalAffiliate.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Tracking code: <code className="font-mono bg-gray-100 px-1 rounded">{analyticsModalAffiliate.trackingCode}</code>
                </p>
              </div>
              <button
                onClick={() => setAnalyticsModalAffiliate(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
              ) : analyticsData ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase">Views</p>
                      <p className="text-xl font-semibold text-gray-900">{analyticsData.summary.views}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase">Orders</p>
                      <p className="text-xl font-semibold text-gray-900">{analyticsData.summary.orders}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase">Conversion Rate</p>
                      <p className="text-xl font-semibold text-gray-900">{analyticsData.summary.conversionRate}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 uppercase">Revenue</p>
                      <p className="text-xl font-semibold text-gray-900">{formatCurrency(analyticsData.summary.revenue)}</p>
                    </div>
                  </div>

                  {/* By Source / Medium */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">By Source</h3>
                      <div className="space-y-1.5">
                        {analyticsData.bySource.map(s => (
                          <div key={s.name} className="flex justify-between text-sm">
                            <span className="text-gray-600">{s.name}</span>
                            <span className="font-medium">{s.count}</span>
                          </div>
                        ))}
                        {analyticsData.bySource.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">By Medium</h3>
                      <div className="space-y-1.5">
                        {analyticsData.byMedium.map(m => (
                          <div key={m.name} className="flex justify-between text-sm">
                            <span className="text-gray-600">{m.name}</span>
                            <span className="font-medium">{m.count}</span>
                          </div>
                        ))}
                        {analyticsData.byMedium.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                      </div>
                    </div>
                  </div>

                  {/* Geolocation */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">By Country</h3>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                        {analyticsData.byCountry.map(c => (
                          <div key={c.name} className="flex justify-between text-sm">
                            <span className="text-gray-600">{c.name}</span>
                            <span className="font-medium">{c.count}</span>
                          </div>
                        ))}
                        {analyticsData.byCountry.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">By City</h3>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                        {analyticsData.byCity.map((c, i) => (
                          <div key={`${c.city}-${c.country}-${i}`} className="flex justify-between text-sm">
                            <span className="text-gray-600">{c.city}, {c.country}</span>
                            <span className="font-medium">{c.count}</span>
                          </div>
                        ))}
                        {analyticsData.byCity.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                      </div>
                    </div>
                  </div>

                  {/* Device & Referrers */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">By Device</h3>
                      <div className="space-y-1.5">
                        {analyticsData.byDevice.map(d => (
                          <div key={d.name} className="flex justify-between text-sm">
                            <span className="text-gray-600 capitalize">{d.name}</span>
                            <span className="font-medium">{d.count}</span>
                          </div>
                        ))}
                        {analyticsData.byDevice.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Referrers</h3>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
                        {analyticsData.byReferrer.map((r, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate max-w-[180px]" title={r.referrer}>
                              {r.referrerHost || r.referrer || 'direct'}
                            </span>
                            <span className="font-medium">{r.count}</span>
                          </div>
                        ))}
                        {analyticsData.byReferrer.length === 0 && <p className="text-sm text-gray-400">No data</p>}
                      </div>
                    </div>
                  </div>

                  {/* Sample Link */}
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-teal-900 mb-1">Sample tracking link</h3>
                    <code className="text-xs text-teal-800 break-all">
                      {(typeof window !== 'undefined' ? window.location.origin : '')}/[store-slug]?utm_source=affiliate&utm_campaign={analyticsModalAffiliate.trackingCode}&utm_medium=referral
                    </code>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Failed to load analytics</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
