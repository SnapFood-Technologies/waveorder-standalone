'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, Globe, Loader2, AlertCircle } from 'lucide-react'
import { CATALOG_COUNTRY_OPTIONS } from '@/lib/catalog-country-options'

type CountryRow = {
  code: string
  productIds: string[]
  productCount: number
}

function labelForCode(code: string): string {
  const o = CATALOG_COUNTRY_OPTIONS.find((c) => c.code === code)
  return o ? `${o.flag} ${o.name} (${code})` : code
}

export default function SuperAdminCountryCatalogPage() {
  const params = useParams()
  const businessId = params.businessId as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [businessName, setBusinessName] = useState<string>('')
  const [visibleRows, setVisibleRows] = useState<CountryRow[]>([])
  const [excludedRows, setExcludedRows] = useState<CountryRow[]>([])
  const [summary, setSummary] = useState<{
    productsWithAnyCountryRule: number
    distinctCountryCodes: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`/api/superadmin/businesses/${businessId}`),
          fetch(`/api/superadmin/businesses/${businessId}/catalog/countries`)
        ])
        if (!bRes.ok) throw new Error('Business not found')
        const bJson = await bRes.json()
        if (!cancelled) setBusinessName(bJson.business?.name || 'Business')

        if (!cRes.ok) {
          const j = await cRes.json().catch(() => ({}))
          throw new Error(j.message || 'Failed to load catalog stats')
        }
        const data = await cRes.json()
        if (cancelled) return
        setEnabled(!!data.countryBasedCatalogEnabled)
        setVisibleRows(data.visibleCountryRows || [])
        setExcludedRows(data.excludedCountryRows || [])
        setSummary(data.summary || null)
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [businessId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-4">
          <Link href={`/superadmin/businesses/${businessId}`} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Country catalog</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-0 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/superadmin/businesses/${businessId}`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-teal-600" />
            Country catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">{businessName}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        Read-only statistics for this store. Merchants assign countries per product in Admin → Products → Country
        Based.
      </p>

      {!enabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Country-based catalog is disabled for this business. Enable it on the business page under Country-based
          catalog.
        </div>
      )}

      {enabled && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Products with country rules</p>
            <p className="text-2xl font-semibold text-gray-900">{summary.productsWithAnyCountryRule}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Countries in use</p>
            <p className="text-2xl font-semibold text-gray-900">{summary.distinctCountryCodes}</p>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-teal-50 border-b border-teal-100">
              <h2 className="font-semibold text-teal-900">Shown in (visible list)</h2>
              <p className="text-xs text-teal-800/80 mt-1">Countries with at least one product in the visible list.</p>
            </div>
            {visibleRows.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">None yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleRows.map((r) => (
                    <tr key={r.code}>
                      <td className="px-4 py-3 text-sm text-gray-900">{labelForCode(r.code)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.productCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
              <h2 className="font-semibold text-amber-900">Excluded (hidden list)</h2>
              <p className="text-xs text-amber-900/80 mt-1">Countries with at least one product in the hidden list.</p>
            </div>
            {excludedRows.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">None yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {excludedRows.map((r) => (
                    <tr key={r.code}>
                      <td className="px-4 py-3 text-sm text-gray-900">{labelForCode(r.code)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.productCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
