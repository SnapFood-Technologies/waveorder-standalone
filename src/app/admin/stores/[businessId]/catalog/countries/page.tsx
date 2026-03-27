'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Globe, Package, Loader2, ExternalLink, Settings2 } from 'lucide-react'
import { CatalogCountryManageModal, type CatalogProductLite } from '@/components/admin/catalog/CatalogCountryManageModal'
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

export default function CatalogCountriesPage({
  params
}: {
  params: Promise<{ businessId: string }>
}) {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [visibleRows, setVisibleRows] = useState<CountryRow[]>([])
  const [excludedRows, setExcludedRows] = useState<CountryRow[]>([])
  const [catalogProducts, setCatalogProducts] = useState<CatalogProductLite[]>([])
  const [summary, setSummary] = useState<{
    productsWithAnyCountryRule: number
    distinctCountryCodes: number
  } | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [modal, setModal] = useState<{
    countryCode: string
    mode: 'visible' | 'hidden'
  } | null>(null)

  const load = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/catalog/countries`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message || 'Failed to load')
      }
      const data = await res.json()
      setEnabled(!!data.countryBasedCatalogEnabled)
      setVisibleRows(data.visibleCountryRows || [])
      setExcludedRows(data.excludedCountryRows || [])
      setSummary(data.summary || null)
      setCatalogProducts(data.products || [])
    } catch (e: any) {
      setError(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    params.then((p) => setBusinessId(p.businessId))
  }, [params])

  useEffect(() => {
    load()
  }, [load])

  const hasAnyRules = (visibleRows.length > 0 || excludedRows.length > 0) && enabled

  if (!businessId) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Globe className="w-7 h-7 text-teal-600" />
          Country-based catalog
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Manage which products appear or are excluded by country. Requires SuperAdmin to enable the feature for
          this store.
        </p>
      </div>

      {!enabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Country-based catalog is not enabled yet. Ask WaveOrder SuperAdmin to enable it on this business, then
          return here.
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      )}

      {!loading && !error && summary && enabled && (
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

      {!loading && !error && enabled && !hasAnyRules && (
        <div className="rounded-lg border-2 border-dashed border-teal-200 bg-teal-50/40 p-8 text-center space-y-4">
          <Package className="w-12 h-12 text-teal-500 mx-auto" />
          <div>
            <p className="text-gray-900 font-semibold text-lg">No country rules yet</p>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Add products and set countries on each product, or start with a new product and choose visible /
              excluded countries.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <Link
              href={`/admin/stores/${businessId}/products/new`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition-colors"
            >
              Create a product
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href={`/admin/stores/${businessId}/products`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 bg-white text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Go to products list
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && enabled && hasAnyRules && (
        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-teal-50 border-b border-teal-100">
              <h2 className="font-semibold text-teal-900 flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Shown in (visible list)
              </h2>
              <p className="text-xs text-teal-800/80 mt-1">
                Countries where at least one product is set to show (narrow list). Empty visible list on a product
                means &quot;everywhere&quot; unless excluded.
              </p>
            </div>
            {visibleRows.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">No visible-country assignments yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleRows.map((r) => (
                    <tr key={r.code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{labelForCode(r.code)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.productCount}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setModal({ countryCode: r.code, mode: 'visible' })}
                          className="text-sm font-medium text-teal-600 hover:text-teal-800"
                        >
                          Manage products
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
              <h2 className="font-semibold text-amber-900">Excluded (hidden list)</h2>
              <p className="text-xs text-amber-900/80 mt-1">
                Countries where at least one product is explicitly hidden for visitors.
              </p>
            </div>
            {excludedRows.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">No excluded-country assignments yet.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {excludedRows.map((r) => (
                    <tr key={r.code} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{labelForCode(r.code)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.productCount}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setModal({ countryCode: r.code, mode: 'hidden' })}
                          className="text-sm font-medium text-amber-700 hover:text-amber-900"
                        >
                          Manage products
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}

      {modal && (
        <CatalogCountryManageModal
          open={!!modal}
          onClose={() => setModal(null)}
          businessId={businessId}
          countryCode={modal.countryCode}
          mode={modal.mode}
          catalogProducts={catalogProducts}
          onSaved={() => {
            load()
          }}
        />
      )}
    </div>
  )
}
