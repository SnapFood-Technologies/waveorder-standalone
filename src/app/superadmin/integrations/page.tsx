'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Puzzle, Search, Plus, RefreshCw, Eye, Edit, Trash2,
  Key, Power, PowerOff, Copy, CheckCircle, XCircle,
  Building2, Activity, Globe, Link2, X, AlertCircle, Clock,
  Zap, PackageSearch, Loader2, Info, Calendar, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { IntegrationKind } from '@/lib/integration-kind'
import { normalizeIntegrationKind } from '@/lib/integration-kind'
import { ALL_V1_API_SCOPES, parseHolaOraConfig } from '@/lib/integration-config'

const DEFAULT_HOLA_SCOPES: string[] = ['services:read', 'products:read', 'categories:read']

function splitLinesOrComma(s: string): string[] {
  return s
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function emptyFormData(): {
  name: string
  slug: string
  description: string
  logoUrl: string
  webhookUrl: string
  kind: IntegrationKind
  holaOraBaseUrl: string
  entitlementStripePriceIdsText: string
  documentedV1PathsText: string
  defaultV1Scopes: string[]
  rateLimitPerMinute: string
  setupNotes: string
} {
  return {
    name: '',
    slug: '',
    description: '',
    logoUrl: '',
    webhookUrl: '',
    kind: 'GENERIC',
    holaOraBaseUrl: 'https://',
    entitlementStripePriceIdsText: '',
    documentedV1PathsText: '',
    defaultV1Scopes: [...DEFAULT_HOLA_SCOPES],
    rateLimitPerMinute: '',
    setupNotes: '',
  }
}

function buildHolaConfigPayload(form: ReturnType<typeof emptyFormData>) {
  const rateRaw = form.rateLimitPerMinute.trim()
  let rateLimitPerMinute: number | undefined
  if (rateRaw) {
    const n = parseInt(rateRaw, 10)
    if (Number.isFinite(n) && n > 0) rateLimitPerMinute = n
  }
  return {
    holaOraBaseUrl: form.holaOraBaseUrl.trim(),
    entitlementStripePriceIds: splitLinesOrComma(form.entitlementStripePriceIdsText),
    defaultV1Scopes: form.defaultV1Scopes,
    documentedV1Paths: splitLinesOrComma(form.documentedV1PathsText),
    rateLimitPerMinute,
    setupNotes: form.setupNotes.trim() || undefined,
  }
}

// ===========================================
// Types
// ===========================================
interface Integration {
  id: string
  name: string
  slug: string
  kind: IntegrationKind
  description: string | null
  apiKey: string | null
  apiKeyPreview: string | null
  isActive: boolean
  logoUrl: string | null
  webhookUrl: string | null
  config: Record<string, unknown> | null
  connectedBusinesses: number
  apiCalls30d: number
  totalLogs: number
  createdAt: string
  updatedAt: string
}

interface ConnectedBusiness {
  id: string
  name: string
  slug: string
  logo: string | null
  businessType: string
  isActive: boolean
  externalId: string
  createdAt: string
}

interface LogEntry {
  id: string
  integrationId: string
  businessId: string | null
  endpoint: string
  method: string
  statusCode: number
  requestBody: Record<string, unknown> | null
  responseBody: Record<string, unknown> | null
  ipAddress: string | null
  duration: number | null
  error: string | null
  createdAt: string
  business?: { id: string; name: string; slug: string } | null
}

interface Stats {
  total: number
  active: number
  totalConnectedBusinesses: number
  totalApiCalls30d: number
}

// ===========================================
// Component
// ===========================================
export default function IntegrationsPage() {
  // State
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, totalConnectedBusinesses: 0, totalApiCalls30d: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [detailData, setDetailData] = useState<{
    integration: Integration & {
      connectedBusinesses: ConnectedBusiness[]
      logs: LogEntry[]
      parsedHolaConfig?: import('@/lib/integration-config').HolaOraIntegrationConfig | null
    }
  } | null>(null)
  const [detailTab, setDetailTab] = useState<'businesses' | 'logs'>('businesses')
  const [detailLoading, setDetailLoading] = useState(false)

  // Create/Edit form state
  const [formData, setFormData] = useState(emptyFormData)
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Manual actions modal
  const [showManualActionsModal, setShowManualActionsModal] = useState(false)
  const [manualActionRunning, setManualActionRunning] = useState<string | null>(null)
  const [manualActionResult, setManualActionResult] = useState<{
    action: string
    success: boolean
    message: string
    details?: Record<string, unknown>
  } | null>(null)

  // API key display (shown once after create or regenerate)
  const [newApiKey, setNewApiKey] = useState('')

  // ===========================================
  // Data fetching
  // ===========================================
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/superadmin/integrations?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch integrations')

      const data = await res.json()
      setIntegrations(
        (data.integrations || []).map((i: Integration) => ({
          ...i,
          kind: normalizeIntegrationKind(i.kind),
        }))
      )
      setStats(data.stats)
    } catch {
      toast.error('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchIntegrations()
  }, [fetchIntegrations])

  // Fetch single integration detail
  const fetchIntegrationDetail = async (id: string) => {
    try {
      setDetailLoading(true)
      const res = await fetch(`/api/superadmin/integrations/${id}`)
      if (!res.ok) throw new Error('Failed to fetch integration details')

      const data = await res.json()
      setDetailData(data)
    } catch {
      toast.error('Failed to load integration details')
    } finally {
      setDetailLoading(false)
    }
  }

  // ===========================================
  // Actions
  // ===========================================

  // Create integration
  const handleCreate = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required')
      return
    }
    if (formData.kind === 'HOLAORA') {
      const u = formData.holaOraBaseUrl.trim()
      if (!u || !/^https?:\/\//i.test(u)) {
        toast.error('HolaOra: enter a valid provisioning base URL (https://…)')
        return
      }
      if (formData.defaultV1Scopes.length === 0) {
        toast.error('HolaOra: select at least one Public API (v1) scope')
        return
      }
    }

    try {
      setFormSubmitting(true)
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
        webhookUrl: formData.webhookUrl.trim() || undefined,
        kind: formData.kind,
        config: formData.kind === 'HOLAORA' ? buildHolaConfigPayload(formData) : null,
      }
      const res = await fetch('/api/superadmin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to create integration')
        return
      }

      // Show API key once
      setNewApiKey(data.apiKey)
      setShowCreateModal(false)
      setShowApiKeyModal(true)
      toast.success('Integration created successfully')
      fetchIntegrations()
    } catch {
      toast.error('Failed to create integration')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Update integration
  const handleUpdate = async () => {
    if (!selectedIntegration) return
    if (!formData.name?.trim()) {
      toast.error('Name is required')
      return
    }
    if (formData.kind === 'HOLAORA') {
      const u = formData.holaOraBaseUrl.trim()
      if (!u || !/^https?:\/\//i.test(u)) {
        toast.error('HolaOra: enter a valid provisioning base URL (https://…)')
        return
      }
      if (formData.defaultV1Scopes.length === 0) {
        toast.error('HolaOra: select at least one Public API (v1) scope')
        return
      }
    }

    try {
      setFormSubmitting(true)
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        logoUrl: formData.logoUrl.trim() || null,
        webhookUrl: formData.webhookUrl.trim() || null,
        kind: formData.kind,
        config: formData.kind === 'HOLAORA' ? buildHolaConfigPayload(formData) : null,
      }
      const res = await fetch(`/api/superadmin/integrations/${selectedIntegration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to update integration')
        return
      }

      toast.success('Integration updated successfully')
      setShowEditModal(false)
      fetchIntegrations()
    } catch {
      toast.error('Failed to update integration')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Toggle active/inactive
  const handleToggleActive = async (integration: Integration) => {
    try {
      const res = await fetch(`/api/superadmin/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !integration.isActive }),
      })

      if (!res.ok) throw new Error('Failed to toggle integration')

      toast.success(`Integration ${integration.isActive ? 'disabled' : 'enabled'} successfully`)
      fetchIntegrations()
    } catch {
      toast.error('Failed to toggle integration status')
    }
  }

  // Regenerate API key
  const handleRegenerateKey = async (integration: Integration) => {
    try {
      const res = await fetch(`/api/superadmin/integrations/${integration.id}/regenerate-key`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to regenerate API key')
        return
      }

      setNewApiKey(data.apiKey)
      setShowApiKeyModal(true)
      toast.success('API key regenerated successfully')
      fetchIntegrations()
    } catch {
      toast.error('Failed to regenerate API key')
    }
  }

  // Delete integration
  const handleDelete = async () => {
    if (!selectedIntegration) return

    try {
      const res = await fetch(`/api/superadmin/integrations/${selectedIntegration.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete integration')

      toast.success('Integration deleted successfully')
      setShowDeleteModal(false)
      setSelectedIntegration(null)
      fetchIntegrations()
    } catch {
      toast.error('Failed to delete integration')
    }
  }

  // Run manual action
  const runManualAction = async (actionId: string, endpoint: string) => {
    try {
      setManualActionRunning(actionId)
      setManualActionResult(null)

      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setManualActionResult({
          action: actionId,
          success: false,
          message: data.message || data.error || 'Action failed',
        })
        toast.error('Action failed')
        return
      }

      setManualActionResult({
        action: actionId,
        success: true,
        message: data.stats
          ? `Found ${data.stats.totalLowStockProducts} low stock products across ${data.stats.businessesNotified} businesses. Emails sent: ${data.stats.emailsSent}, failed: ${data.stats.emailsFailed}.`
          : 'Action completed successfully',
        details: data.stats,
      })
      toast.success('Action completed successfully')
    } catch {
      setManualActionResult({
        action: actionId,
        success: false,
        message: 'Network error — could not reach the server',
      })
      toast.error('Action failed')
    } finally {
      setManualActionRunning(null)
    }
  }

  // Copy API key
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Open modals
  const openCreate = () => {
    setFormData(emptyFormData())
    setShowCreateModal(true)
  }

  const openEdit = (integration: Integration) => {
    setSelectedIntegration(integration)
    const k = normalizeIntegrationKind(integration.kind)
    const hc = parseHolaOraConfig(integration.config)
    setFormData({
      name: integration.name,
      slug: integration.slug,
      description: integration.description || '',
      logoUrl: integration.logoUrl || '',
      webhookUrl: integration.webhookUrl || '',
      kind: k,
      holaOraBaseUrl: hc?.holaOraBaseUrl ?? 'https://',
      entitlementStripePriceIdsText: hc?.entitlementStripePriceIds?.join('\n') ?? '',
      documentedV1PathsText: hc?.documentedV1Paths?.join('\n') ?? '',
      defaultV1Scopes:
        hc?.defaultV1Scopes?.length ? [...hc.defaultV1Scopes] : [...DEFAULT_HOLA_SCOPES],
      rateLimitPerMinute:
        hc?.rateLimitPerMinute != null ? String(hc.rateLimitPerMinute) : '',
      setupNotes: hc?.setupNotes ?? '',
    })
    setShowEditModal(true)
  }

  const toggleV1Scope = (scopeId: string) => {
    setFormData((prev) => ({
      ...prev,
      defaultV1Scopes: prev.defaultV1Scopes.includes(scopeId)
        ? prev.defaultV1Scopes.filter((s) => s !== scopeId)
        : [...prev.defaultV1Scopes, scopeId],
    }))
  }

  const openDetail = (integration: Integration) => {
    setSelectedIntegration(integration)
    setDetailTab('businesses')
    setShowDetailModal(true)
    fetchIntegrationDetail(integration.id)
  }

  const openDelete = (integration: Integration) => {
    setSelectedIntegration(integration)
    setShowDeleteModal(true)
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, ''),
    }))
  }

  // ===========================================
  // Render helpers
  // ===========================================
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" /> Inactive
      </span>
    )
  }

  const getKindBadge = (kind: IntegrationKind) => {
    if (kind === 'HOLAORA') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
          <Calendar className="w-3 h-3" /> HolaOra
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Generic
      </span>
    )
  }

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${colors[method] || 'bg-gray-100 text-gray-700'}`}>
        {method}
      </span>
    )
  }

  const getStatusCodeBadge = (code: number) => {
    const color = code >= 200 && code < 300
      ? 'bg-green-100 text-green-700'
      : code >= 400 && code < 500
        ? 'bg-yellow-100 text-yellow-700'
        : code >= 500
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700'
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${color}`}>
        {code}
      </span>
    )
  }

  // ===========================================
  // Render
  // ===========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Puzzle className="w-6 h-6 text-indigo-600" />
            Platform Integrations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage external platform partnerships and API connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchIntegrations}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/superadmin/integrations/holaora"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            HolaOra
          </Link>
          <button
            onClick={() => {
              setManualActionResult(null)
              setShowManualActionsModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
          >
            <Zap className="w-4 h-4" />
            Manual Actions
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Puzzle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Integrations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Power className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConnectedBusinesses}</p>
              <p className="text-xs text-gray-500">Connected Businesses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApiCalls30d}</p>
              <p className="text-xs text-gray-500">API Calls (30d)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading integrations...</p>
          </div>
        ) : integrations.length === 0 ? (
          <div className="p-12 text-center">
            <Puzzle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No integrations found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first integration to get started</p>
            <button
              onClick={openCreate}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add Integration
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Integration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">API Key</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Businesses</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">API Calls (30d)</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {integrations.map((integration) => (
                  <tr key={integration.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {integration.logoUrl ? (
                          <img
                            src={integration.logoUrl}
                            alt={integration.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Link2 className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{integration.name}</p>
                          {integration.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{integration.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{integration.slug}</code>
                    </td>
                    <td className="px-4 py-3">{getKindBadge(integration.kind)}</td>
                    <td className="px-4 py-3">{getStatusBadge(integration.isActive)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 font-mono">
                        wo_int_{integration.apiKeyPreview || '****'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {integration.connectedBusinesses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700">
                        <Activity className="w-3.5 h-3.5 text-gray-400" />
                        {integration.apiCalls30d}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(integration.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDetail(integration)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(integration)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(integration)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            integration.isActive
                              ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={integration.isActive ? 'Disable' : 'Enable'}
                        >
                          {integration.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRegenerateKey(integration)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Regenerate API Key"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(integration)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ========================================= */}
      {/* Create Integration Modal */}
      {/* ========================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Create Integration</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Integration type *</label>
                <select
                  value={formData.kind}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kind: e.target.value as IntegrationKind,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="GENERIC">Generic partner</option>
                  <option value="HOLAORA">HolaOra (scheduling)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  HolaOra unlocks validated settings for provisioning, Stripe bundle IDs, and Public API scopes.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., ChowTap"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., chowtap or holaora"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">Used in API paths: /api/integrations/{formData.slug || 'slug'}/connect</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this integration..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {formData.kind === 'HOLAORA' && (
                <div className="border border-teal-200 rounded-xl bg-teal-50/50 p-4 space-y-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <div className="text-xs text-teal-900 space-y-1">
                      <p className="font-semibold text-sm text-teal-950">HolaOra settings</p>
                      <p>
                        WaveOrder → HolaOra <strong>secrets</strong> belong in environment variables, not in this form.
                        Catalog access uses existing <code className="bg-white/80 px-1 rounded">/api/v1</code> with per-business{' '}
                        <code className="bg-white/80 px-1 rounded">wo_live_…</code> keys.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Provisioning base URL *</label>
                    <input
                      type="url"
                      value={formData.holaOraBaseUrl}
                      onChange={(e) => setFormData({ ...formData, holaOraBaseUrl: e.target.value })}
                      placeholder="https://api.partner.example"
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Stripe price IDs (bundle includes HolaOra)
                    </label>
                    <textarea
                      value={formData.entitlementStripePriceIdsText}
                      onChange={(e) =>
                        setFormData({ ...formData, entitlementStripePriceIdsText: e.target.value })
                      }
                      placeholder={'One price_… per line or comma-separated'}
                      rows={3}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Public API (v1) scopes *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-teal-100 rounded-lg p-2 bg-white scrollbar-hide">
                      {ALL_V1_API_SCOPES.map((scope) => (
                        <label key={scope} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.defaultV1Scopes.includes(scope)}
                            onChange={() => toggleV1Scope(scope)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="font-mono text-xs">{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Documented v1 paths (optional)</label>
                    <textarea
                      value={formData.documentedV1PathsText}
                      onChange={(e) =>
                        setFormData({ ...formData, documentedV1PathsText: e.target.value })
                      }
                      placeholder={'/api/v1/services\n/api/v1/products'}
                      rows={3}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Rate limit / minute (optional)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.rateLimitPerMinute}
                      onChange={(e) =>
                        setFormData({ ...formData, rateLimitPerMinute: e.target.value })
                      }
                      placeholder="Leave empty to use global v1 default"
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Internal notes (optional)</label>
                    <textarea
                      value={formData.setupNotes}
                      onChange={(e) => setFormData({ ...formData, setupNotes: e.target.value })}
                      placeholder="What we store from HolaOra responses, runbooks…"
                      rows={2}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 flex-shrink-0 bg-gray-50/80">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={formSubmitting || !formData.name || !formData.slug}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {formSubmitting ? 'Creating...' : 'Create Integration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Edit Integration Modal */}
      {/* ========================================= */}
      {showEditModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Edit Integration</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Integration type *</label>
                <select
                  value={formData.kind}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kind: e.target.value as IntegrationKind,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="GENERIC">Generic partner</option>
                  <option value="HOLAORA">HolaOra (scheduling)</option>
                </select>
                <p className="text-xs text-amber-700 mt-1">
                  Switching to HolaOra saves a validated config. Switching to Generic clears stored JSON config unless you save again.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {formData.kind === 'HOLAORA' && (
                <div className="border border-teal-200 rounded-xl bg-teal-50/50 p-4 space-y-4">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <p className="text-xs text-teal-900">
                      Server secrets for WaveOrder → HolaOra stay in <strong>environment variables</strong>.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Provisioning base URL *</label>
                    <input
                      type="url"
                      value={formData.holaOraBaseUrl}
                      onChange={(e) => setFormData({ ...formData, holaOraBaseUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Stripe price IDs</label>
                    <textarea
                      value={formData.entitlementStripePriceIdsText}
                      onChange={(e) =>
                        setFormData({ ...formData, entitlementStripePriceIdsText: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Public API (v1) scopes *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-teal-100 rounded-lg p-2 bg-white scrollbar-hide">
                      {ALL_V1_API_SCOPES.map((scope) => (
                        <label key={scope} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.defaultV1Scopes.includes(scope)}
                            onChange={() => toggleV1Scope(scope)}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="font-mono text-xs">{scope}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Documented v1 paths (optional)</label>
                    <textarea
                      value={formData.documentedV1PathsText}
                      onChange={(e) =>
                        setFormData({ ...formData, documentedV1PathsText: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Rate limit / minute (optional)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.rateLimitPerMinute}
                      onChange={(e) =>
                        setFormData({ ...formData, rateLimitPerMinute: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Internal notes (optional)</label>
                    <textarea
                      value={formData.setupNotes}
                      onChange={(e) => setFormData({ ...formData, setupNotes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-teal-200 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 flex-shrink-0 bg-gray-50/80">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={formSubmitting || !formData.name}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {formSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Detail Modal */}
      {/* ========================================= */}
      {showDetailModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {selectedIntegration.logoUrl ? (
                  <img src={selectedIntegration.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-indigo-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedIntegration.name}</h3>
                  <p className="text-sm text-gray-500">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{selectedIntegration.slug}</code>
                    {' '}{getStatusBadge(selectedIntegration.isActive)}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Integration Info */}
            <div className="p-5 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">API Key</p>
                  <p className="font-mono text-gray-700">wo_int_{selectedIntegration.apiKeyPreview || '****'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Connected Businesses</p>
                  <p className="font-semibold text-gray-900">{selectedIntegration.connectedBusinesses}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">API Calls (30d)</p>
                  <p className="font-semibold text-gray-900">{selectedIntegration.apiCalls30d}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Created</p>
                  <p className="text-gray-700">{formatDate(selectedIntegration.createdAt)}</p>
                </div>
              </div>
              {selectedIntegration.description && (
                <p className="text-sm text-gray-600 mt-3">{selectedIntegration.description}</p>
              )}
              {selectedIntegration.webhookUrl && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                  <Globe className="w-3 h-3" />
                  Webhook: <span className="font-mono">{selectedIntegration.webhookUrl}</span>
                </div>
              )}
              <div className="mt-3">{getKindBadge(selectedIntegration.kind)}</div>

              {normalizeIntegrationKind(selectedIntegration.kind) === 'HOLAORA' && (
                <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/60 p-4 text-sm">
                  <p className="font-semibold text-teal-950 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    HolaOra configuration
                  </p>
                  {!detailData?.integration?.parsedHolaConfig ? (
                    <p className="text-amber-800 text-xs">
                      Config is missing or invalid. Edit this integration and save HolaOra fields.
                    </p>
                  ) : (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="text-teal-800/80">Base URL</dt>
                        <dd className="font-mono text-gray-900 break-all mt-0.5">
                          {detailData.integration.parsedHolaConfig.holaOraBaseUrl}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-teal-800/80">Rate limit / min</dt>
                        <dd className="text-gray-900 mt-0.5">
                          {detailData.integration.parsedHolaConfig.rateLimitPerMinute ?? '—'}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-teal-800/80">Stripe price IDs</dt>
                        <dd className="mt-0.5 flex flex-wrap gap-1">
                          {detailData.integration.parsedHolaConfig.entitlementStripePriceIds.length ? (
                            detailData.integration.parsedHolaConfig.entitlementStripePriceIds.map((id) => (
                              <code key={id} className="bg-white px-1.5 py-0.5 rounded border text-[11px]">
                                {id}
                              </code>
                            ))
                          ) : (
                            <span className="text-gray-500">None</span>
                          )}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-teal-800/80">v1 scopes</dt>
                        <dd className="mt-0.5 flex flex-wrap gap-1">
                          {detailData.integration.parsedHolaConfig.defaultV1Scopes.map((s) => (
                            <span
                              key={s}
                              className="bg-white border border-teal-100 text-teal-900 px-1.5 py-0.5 rounded text-[11px] font-mono"
                            >
                              {s}
                            </span>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  )}
                  <Link
                    href="/superadmin/integrations/holaora"
                    className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-teal-800 hover:text-teal-950"
                  >
                    Open HolaOra dashboard
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setDetailTab('businesses')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === 'businesses'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-1.5" />
                Connected Businesses
              </button>
              <button
                onClick={() => setDetailTab('logs')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  detailTab === 'logs'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-1.5" />
                API Logs
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-5">
              {detailLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Loading...</p>
                </div>
              ) : detailTab === 'businesses' ? (
                /* Connected Businesses Tab */
                detailData?.integration?.connectedBusinesses && detailData.integration.connectedBusinesses.length > 0 ? (
                  <div className="space-y-2">
                    {detailData.integration.connectedBusinesses.map((biz: ConnectedBusiness) => (
                      <div key={biz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            {biz.logo ? (
                              <img src={biz.logo} alt={`${biz.name} logo`} className="w-full h-full object-contain rounded-lg" />
                            ) : (
                              <Building2 className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{biz.name}</p>
                            <p className="text-xs text-gray-500">{biz.businessType} &bull; {biz.slug}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <code className="text-xs bg-white px-2 py-1 rounded border font-mono">{biz.externalId}</code>
                          <p className="text-xs text-gray-400 mt-1">
                            {biz.isActive ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-red-500">Inactive</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No businesses connected yet</p>
                  </div>
                )
              ) : (
                /* API Logs Tab */
                detailData?.integration?.logs && detailData.integration.logs.length > 0 ? (
                  <div className="space-y-2">
                    {detailData.integration.logs.map((log: LogEntry) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getMethodBadge(log.method)}
                          <div>
                            <p className="text-sm font-mono text-gray-700">{log.endpoint}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(log.createdAt).toLocaleString()}
                              {log.duration ? ` - ${log.duration}ms` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusCodeBadge(log.statusCode)}
                          {log.error && (
                            <span className="text-xs text-red-500 max-w-[150px] truncate" title={log.error}>
                              {log.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No API logs yet</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================= */}
      {showDeleteModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Integration</h3>
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <strong>{selectedIntegration.name}</strong>?
                This will also delete all API logs for this integration. This action cannot be undone.
              </p>
              {selectedIntegration.connectedBusinesses > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    Warning: {selectedIntegration.connectedBusinesses} business(es) are still connected to this integration.
                    Their external IDs will remain in the database but the integration API will stop working.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Integration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* API Key Display Modal (shown once after create/regenerate) */}
      {/* ========================================= */}
      {showApiKeyModal && newApiKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Key className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Integration API Key</h3>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="text-xs text-yellow-700">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                  Save this API key now. It will not be shown again.
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <code className="flex-1 text-sm font-mono text-gray-800 break-all">{newApiKey}</code>
                <button
                  onClick={() => copyToClipboard(newApiKey)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <div className="flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Use this key in one of the following headers:</p>
                    <p className="mt-1"><code className="bg-gray-100 px-1.5 py-0.5 rounded">Authorization: Bearer wo_int_xxx</code></p>
                    <p className="mt-1"><code className="bg-gray-100 px-1.5 py-0.5 rounded">X-API-Key: wo_int_xxx</code></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowApiKeyModal(false)
                  setNewApiKey('')
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                I&apos;ve Saved the Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* Manual Actions Modal */}
      {/* ========================================= */}
      {showManualActionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manual Actions</h3>
                  <p className="text-xs text-gray-500">Run integration services manually</p>
                </div>
              </div>
              <button onClick={() => setShowManualActionsModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Low Stock Alert Action */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg mt-0.5">
                      <PackageSearch className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Low Stock Alert Check</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Scans all businesses for products below their low stock threshold and emails the business owner.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => runManualAction('low-stock-alerts', '/api/superadmin/manual-actions/low-stock-alerts')}
                    disabled={manualActionRunning === 'low-stock-alerts'}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {manualActionRunning === 'low-stock-alerts' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Running...
                      </>
                    ) : (
                      'Run Now'
                    )}
                  </button>
                </div>

                {manualActionResult?.action === 'low-stock-alerts' && (
                  <div className={`mt-3 p-3 rounded-lg text-xs ${
                    manualActionResult.success
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <div className="flex items-start gap-1.5">
                      {manualActionResult.success ? (
                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      )}
                      <p>{manualActionResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-xs text-gray-400 text-center">
                  More actions will appear here as new integration services are added.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end p-5 border-t border-gray-200">
              <button
                onClick={() => setShowManualActionsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
