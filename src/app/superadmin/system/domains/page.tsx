'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Globe, 
  Search, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Eye,
  Shield,
  Building2,
  User,
  Calendar,
  Filter
} from 'lucide-react'
import DomainDetailModal from '@/components/superadmin/domains/DomainDetailModal'

// ===========================================
// Types
// ===========================================
interface DomainItem {
  domain: string
  status: 'PENDING' | 'ACTIVE' | 'FAILED'
  verificationToken: string | null
  verificationExpiry: string | null
  isVerificationExpired: boolean
  provisionedAt: string | null
  lastChecked: string | null
  error: string | null
  business: {
    id: string
    name: string
    slug: string
    plan: string
    subscriptionStatus: string
    isActive: boolean
    createdAt: string
  }
  owner: {
    id: string
    name: string
    email: string
  } | null
}

interface StatusCounts {
  all: number
  PENDING: number
  ACTIVE: number
  FAILED: number
}

// ===========================================
// Main Component
// ===========================================
export default function DomainsPage() {
  const [loading, setLoading] = useState(true)
  const [domains, setDomains] = useState<DomainItem[]>([])
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, PENDING: 0, ACTIVE: 0, FAILED: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'ACTIVE' | 'FAILED'>('all')
  
  // Modal
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Fetch domains
  const fetchDomains = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        ...(search && { search })
      })
      
      const res = await fetch(`/api/superadmin/domains?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDomains(data.domains)
        setCounts(data.counts)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, search])

  useEffect(() => {
    fetchDomains()
  }, [fetchDomains])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Status badge component
  const StatusBadge = ({ status }: { status: DomainItem['status'] }) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
    }
  }

  // Plan badge
  const PlanBadge = ({ plan }: { plan: string }) => {
    const colors: Record<string, string> = {
      STARTER: 'bg-gray-100 text-gray-700',
      GROWTH: 'bg-blue-100 text-blue-700',
      BUSINESS: 'bg-purple-100 text-purple-700'
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[plan] || colors.STARTER}`}>
        {plan}
      </span>
    )
  }

  // Handle view domain
  const handleViewDomain = (domain: string) => {
    setSelectedDomain(domain)
    setShowModal(true)
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-teal-600" />
            Custom Domains
          </h1>
          <p className="text-gray-500 mt-1">Manage all custom domain configurations</p>
        </div>
        <button
          onClick={fetchDomains}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'all' ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Domains</p>
              <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
            </div>
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING')}
          className={`bg-white rounded-xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'PENDING' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{counts.PENDING}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('ACTIVE')}
          className={`bg-white rounded-xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'ACTIVE' ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{counts.ACTIVE}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('FAILED')}
          className={`bg-white rounded-xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'FAILED' ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{counts.FAILED}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by domain or business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Domains Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading && domains.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading domains...</span>
          </div>
        ) : domains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Globe className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg font-medium">No custom domains found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Domains will appear here when configured'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Provisioned
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {domains.map((item) => (
                    <tr key={item.domain} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <div>
                            <a 
                              href={`https://${item.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-900 hover:text-teal-600 flex items-center gap-1"
                            >
                              {item.domain}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            {item.error && (
                              <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]" title={item.error}>
                                {item.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                        {item.isVerificationExpired && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                            <AlertTriangle className="w-3 h-3" />
                            Token expired
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <div>
                            <a 
                              href={`/superadmin/businesses/${item.business.id}`}
                              className="font-medium text-gray-900 hover:text-teal-600"
                            >
                              {item.business.name}
                            </a>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">{item.business.slug}</span>
                              <PlanBadge plan={item.business.plan} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.owner ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">{item.owner.name}</p>
                              <p className="text-xs text-gray-500">{item.owner.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(item.provisionedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDomain(item.domain)}
                            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewDomain(item.domain)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Check DNS/SSL"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} domains
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Domain Detail Modal */}
      {showModal && selectedDomain && (
        <DomainDetailModal
          domain={selectedDomain}
          onClose={() => {
            setShowModal(false)
            setSelectedDomain(null)
          }}
          onRefresh={fetchDomains}
        />
      )}
    </div>
  )
}
