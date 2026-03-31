'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Puzzle,
  Activity,
  ExternalLink,
  RefreshCw,
  Building2,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { HolaOraIntegrationConfig } from '@/lib/integration-config'

interface IntegrationRow {
  id: string
  name: string
  slug: string
  kind: string
  isActive: boolean
  logoUrl: string | null
  webhookUrl: string | null
  apiCalls30d: number
}

interface BusinessRow {
  id: string
  name: string
  slug: string
  logo: string | null
  businessType: string
  isActive: boolean
  holaoraAccountId: string | null
  createdAt: string
}

export default function HolaOraIntegrationPage() {
  const [loading, setLoading] = useState(true)
  const [integration, setIntegration] = useState<
    (IntegrationRow & { parsedConfig: HolaOraIntegrationConfig | null }) | null
  >(null)
  const [businesses, setBusinesses] = useState<BusinessRow[]>([])
  const [totalWithAccount, setTotalWithAccount] = useState(0)
  const [externalIdConnected, setExternalIdConnected] = useState(0)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/integrations/holaora')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setIntegration(data.integration)
      setBusinesses(data.businessesWithAccount || [])
      setTotalWithAccount(data.totalWithHolaAccount ?? 0)
      setExternalIdConnected(data.externalIdConnectedViaSlug ?? 0)
    } catch {
      toast.error('Could not load HolaOra integration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const cfg = integration?.parsedConfig

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-sm font-medium mb-1">
            <Calendar className="w-4 h-4" />
            Platform integration
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HolaOra</h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Scheduling partner: provisioning (WaveOrder → HolaOra), catalog reads (HolaOra →{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">/api/v1</code> with{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">wo_live_…</code> keys), and storefront
            embed. Wire format is documented in{' '}
            <code className="text-xs">docs/HOLAORA_INTEGRATION.md</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/superadmin/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Puzzle className="w-4 h-4" />
            All integrations
          </Link>
          <Link
            href="/superadmin/integrations/logs"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
          >
            <Activity className="w-4 h-4" />
            API logs
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-teal-100 bg-teal-50/80 p-4 flex gap-3">
        <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-teal-900 space-y-2">
          <p className="font-medium">How this fits together</p>
          <ul className="list-disc pl-5 space-y-1 text-teal-800/95">
            <li>
              <strong>Platform row</strong> — One <code className="text-xs bg-white/80 px-1 rounded">Integration</code>{' '}
              with kind <code className="text-xs bg-white/80 px-1 rounded">HOLAORA</code> holds base URL, Stripe bundle
              price IDs, and default v1 scopes (SuperAdmin → All integrations).
            </li>
            <li>
              <strong>Per shop</strong> — <code className="text-xs bg-white/80 px-1 rounded">Business.holaoraAccountId</code>{' '}
              stores HolaOra&apos;s tenant id after provisioning runs.
            </li>
            <li>
              <strong>Secrets</strong> — WaveOrder → HolaOra server credentials live in env / secret manager, not in
              this config JSON.
            </li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
          Loading HolaOra…
        </div>
      ) : !integration ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">No HolaOra integration yet</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Create a platform integration with type <strong>HolaOra</strong> and slug{' '}
            <code className="text-xs bg-white px-1 rounded">holaora</code> (recommended). This page will then show live
            settings and linked businesses.
          </p>
          <Link
            href="/superadmin/integrations"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Open integrations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
              <div className="mt-2 flex items-center gap-2">
                {integration.isActive ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-gray-900">Inactive</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 font-mono">{integration.slug}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Businesses with holaoraAccountId
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalWithAccount}</p>
              <p className="text-xs text-gray-500 mt-1">Provisioned tenant id stored on Business</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                externalIds[{integration.slug}]
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{externalIdConnected}</p>
              <p className="text-xs text-gray-500 mt-1">Legacy / partner map count (if used)</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">HolaOra configuration</h2>
              <Link
                href="/superadmin/integrations"
                className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                Edit in integrations
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-5">
              {!cfg ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                  Config does not match the HolaOra schema. Open <strong>All integrations</strong> and save valid HolaOra
                  settings (base URL, scopes, etc.).
                </p>
              ) : (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Provisioning base URL</dt>
                    <dd className="mt-1 font-mono text-gray-900 break-all">{cfg.holaOraBaseUrl}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Rate limit (per minute)</dt>
                    <dd className="mt-1 text-gray-900">{cfg.rateLimitPerMinute ?? '— (default global v1 limit)'}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-gray-500">Stripe price IDs (bundle includes HolaOra)</dt>
                    <dd className="mt-1">
                      {cfg.entitlementStripePriceIds.length ? (
                        <ul className="flex flex-wrap gap-1">
                          {cfg.entitlementStripePriceIds.map((id) => (
                            <li key={id}>
                              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{id}</code>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400">None set</span>
                      )}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-gray-500">Default Public API (v1) scopes</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {cfg.defaultV1Scopes.map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-teal-50 text-teal-800 border border-teal-100 px-2 py-0.5 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </dd>
                  </div>
                  {cfg.documentedV1Paths.length > 0 && (
                    <div className="md:col-span-2">
                      <dt className="text-gray-500">Documented v1 paths</dt>
                      <dd className="mt-1 space-y-1">
                        {cfg.documentedV1Paths.map((p) => (
                          <div key={p} className="font-mono text-xs text-gray-700">
                            {p}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {cfg.setupNotes && (
                    <div className="md:col-span-2">
                      <dt className="text-gray-500">Internal notes</dt>
                      <dd className="mt-1 text-gray-700 whitespace-pre-wrap">{cfg.setupNotes}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Businesses with HolaOra account id</h2>
              <p className="text-xs text-gray-500 mt-1">Showing up to 200 rows · Total: {totalWithAccount}</p>
            </div>
            {businesses.length === 0 ? (
              <div className="p-10 text-center text-gray-500 text-sm">
                <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                No businesses have <code className="text-xs bg-gray-100 px-1 rounded">holaoraAccountId</code> yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Business</th>
                      <th className="px-4 py-3">HolaOra id</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {businesses.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{b.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{b.slug}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{b.holaoraAccountId}</td>
                        <td className="px-4 py-3 text-gray-600">{b.businessType}</td>
                        <td className="px-4 py-3">
                          {b.isActive ? (
                            <span className="text-green-600 text-xs font-medium">Active</span>
                          ) : (
                            <span className="text-red-500 text-xs font-medium">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
