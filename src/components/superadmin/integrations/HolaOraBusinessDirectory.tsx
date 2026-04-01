'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  HOLA_ENTITLEMENT_SOURCE_MANUAL,
  HOLA_ENTITLEMENT_SOURCE_STRIPE,
} from '@/lib/holaora-entitlement-source'

type DirectoryRow = {
  id: string
  name: string
  slug: string
  businessType: string
  isActive: boolean
  holaoraAccountId: string | null
  holaoraEntitled: boolean
  holaoraEntitlementSource: string
  holaoraProvisionBundleType: string | null
  holaoraProvisioningStatus: string | null
  holaoraStorefrontEmbedEnabled: boolean
}

const PAGE_SIZE = 25
/** Matches /superadmin/businesses default list: active, non-test stores only. */
const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'hola_linked', label: 'Hola linked' },
  { id: 'hola_entitled', label: 'Hola entitled' },
] as const

type Props = { hasHolaIntegrationRow: boolean }

export function HolaOraBusinessDirectory({ hasHolaIntegrationRow }: Props) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('active')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [skip, setSkip] = useState(0)
  const [rows, setRows] = useState<DirectoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [manageRow, setManageRow] = useState<DirectoryRow | null>(null)
  const [syncRow, setSyncRow] = useState<DirectoryRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [formAccountId, setFormAccountId] = useState('')
  const [formEntitled, setFormEntitled] = useState(false)
  const [formSource, setFormSource] = useState<string>(HOLA_ENTITLEMENT_SOURCE_STRIPE)
  const [formBundle, setFormBundle] = useState<string>('')

  const [syncBundle, setSyncBundle] = useState<'FREE' | 'PAID'>('PAID')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setSkip(0)
  }, [filter, debouncedSearch])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const q = new URLSearchParams({
        take: String(PAGE_SIZE),
        skip: String(skip),
        filter,
        search: debouncedSearch,
      })
      const res = await fetch(`/api/superadmin/integrations/holaora/directory?${q}`)
      if (!res.ok) throw new Error('Failed to load directory')
      const data = await res.json()
      setRows(data.rows || [])
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Could not load business directory')
    } finally {
      setLoading(false)
    }
  }, [skip, filter, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  const openManage = (r: DirectoryRow) => {
    setManageRow(r)
    setFormAccountId(r.holaoraAccountId || '')
    setFormEntitled(r.holaoraEntitled)
    setFormSource(r.holaoraEntitlementSource || HOLA_ENTITLEMENT_SOURCE_STRIPE)
    setFormBundle(r.holaoraProvisionBundleType || '')
  }

  const saveManage = async () => {
    if (!manageRow) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        holaoraEntitled: formEntitled,
        holaoraEntitlementSource: formSource,
        holaoraProvisionBundleType: formBundle === '' ? null : formBundle,
      }
      body.holaoraAccountId =
        formAccountId.trim() === '' ? null : formAccountId.trim()

      const res = await fetch(`/api/superadmin/businesses/${manageRow.id}/holaora-link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')
      toast.success('Hola link updated')
      setManageRow(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const runSync = async () => {
    if (!syncRow) return
    setSaving(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${syncRow.id}/holaora-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleType: syncBundle }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Sync failed')
      toast.success(`Sync recorded (${syncBundle})`)
      setSyncRow(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSaving(false)
    }
  }

  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.floor(skip / PAGE_SIZE) + 1

  const banner = useMemo(() => {
    if (hasHolaIntegrationRow) return null
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
        No platform <strong>HOLAORA</strong> integration row yet. You can still assign manual IDs; Stripe bundle
        mapping and partner base URL require creating the integration under All integrations.
      </div>
    )
  }, [hasHolaIntegrationRow])

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Businesses — HolaOra hub</h2>
            <p className="text-xs text-gray-500 mt-1">
              Same scope as <strong>SuperAdmin → Businesses</strong> default (active, non-test). Filters: all active
              stores, or those with a Hola id / Hola entitlement. Manage: manual tenant id, Stripe vs manual source,
              bundle tier, sync (stub until Hola HTTP).
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {banner}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === f.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-gray-500 text-sm">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          No businesses match this filter / search.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-600">
              <tr>
                <th className="px-3 py-3">Business</th>
                <th className="px-3 py-3">Entitled</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Bundle</th>
                <th className="px-3 py-3">Hola id</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{r.slug}</div>
                    <div className="text-xs text-gray-400">
                      {r.isActive ? 'Active' : 'Inactive'} · {r.businessType}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {r.holaoraEntitled ? (
                      <span className="text-green-700 text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-700">
                    {r.holaoraEntitlementSource || 'STRIPE'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.holaoraProvisionBundleType || '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs max-w-[140px] truncate" title={r.holaoraAccountId || ''}>
                    {r.holaoraAccountId || '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600 max-w-[120px]">
                    <div className="truncate" title={r.holaoraProvisioningStatus || ''}>
                      {r.holaoraProvisioningStatus || '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => openManage(r)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Manage
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSyncRow(r)
                          setSyncBundle((r.holaoraProvisionBundleType as 'FREE' | 'PAID') || 'PAID')
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Sync
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
          <span>
            {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={skip <= 0}
              onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs">
              Page {page} / {maxPage}
            </span>
            <button
              type="button"
              disabled={skip + PAGE_SIZE >= total}
              onClick={() => setSkip((s) => s + PAGE_SIZE)}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manage modal */}
      {manageRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Manage Hola — {manageRow.name}</h3>
            <p className="text-xs text-gray-500 font-mono">{manageRow.slug}</p>

            <label className="block text-sm font-medium text-gray-700">HolaOra account / tenant id</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
              value={formAccountId}
              onChange={(e) => setFormAccountId(e.target.value)}
              placeholder="Paste id from HolaOra or leave empty to clear"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formEntitled}
                onChange={(e) => setFormEntitled(e.target.checked)}
              />
              Hola entitled (can use embed / provisioning)
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entitlement source</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formSource}
                onChange={(e) => setFormSource(e.target.value)}
              >
                <option value={HOLA_ENTITLEMENT_SOURCE_STRIPE}>STRIPE — subscription webhooks update entitled</option>
                <option value={HOLA_ENTITLEMENT_SOURCE_MANUAL}>
                  MANUAL — you control entitled; Stripe skips this shop
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provision bundle tier (for Hola API)</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={formBundle}
                onChange={(e) => setFormBundle(e.target.value)}
              >
                <option value="">Not set</option>
                <option value="FREE">FREE</option>
                <option value="PAID">PAID</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManageRow(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveManage}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sync modal */}
      {syncRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Sync with HolaOra</h3>
            <p className="text-sm text-gray-600">
              Choose bundle tier for this run. Today this updates stored fields and logs; when Hola documents the
              provisioning API, the same action will drive the HTTP call. If the shop is <strong>entitled</strong>,
              the stub provision path may also run (see <code className="text-xs bg-gray-100 px-1">HOLAORA_PROVISIONING_STUB</code>
              ).
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bundle</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={syncBundle}
                onChange={(e) => setSyncBundle(e.target.value as 'FREE' | 'PAID')}
              >
                <option value="FREE">FREE bundle</option>
                <option value="PAID">PAID bundle</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSyncRow(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={runSync}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg disabled:opacity-50"
              >
                {saving ? 'Running…' : 'Run sync'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
