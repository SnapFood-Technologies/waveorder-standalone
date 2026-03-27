'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  CATALOG_COUNTRY_OPTIONS,
  filterToCatalogCountryCodes
} from '@/lib/catalog-country-options'

export type CatalogProductLite = {
  id: string
  name: string
  sku: string | null
  visibleCountryCodes: string[]
  hiddenCountryCodes: string[]
}

type Props = {
  open: boolean
  onClose: () => void
  businessId: string
  countryCode: string
  mode: 'visible' | 'hidden'
  catalogProducts: CatalogProductLite[]
  onSaved: () => void
}

function countryLabel(code: string): string {
  const o = CATALOG_COUNTRY_OPTIONS.find((c) => c.code === code)
  return o ? `${o.flag} ${o.name}` : code
}

export function CatalogCountryManageModal({
  open,
  onClose,
  businessId,
  countryCode,
  mode,
  catalogProducts,
  onSaved
}: Props) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const inCountry = useCallback(
    (p: CatalogProductLite) => {
      const arr = mode === 'visible' ? p.visibleCountryCodes : p.hiddenCountryCodes
      return arr.some((c) => c.toUpperCase() === countryCode)
    },
    [countryCode, mode]
  )

  const listed = catalogProducts.filter(inCountry)

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSearchResults([])
    }
  }, [open])

  useEffect(() => {
    if (!open || search.trim().length < 2) {
      setSearchResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(
          `/api/admin/stores/${businessId}/products?limit=40&search=${encodeURIComponent(search.trim())}`
        )
        if (!res.ok) return
        const data = await res.json()
        const list = (data.products || []) as { id: string; name: string }[]
        const already = new Set(listed.map((p) => p.id))
        setSearchResults(list.filter((p) => !already.has(p.id)))
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [search, open, businessId, listed])

  const patchProduct = async (productId: string, body: { visibleCountryCodes?: string[]; hiddenCountryCodes?: string[] }) => {
    const res = await fetch(`/api/admin/stores/${businessId}/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.message || 'Update failed')
    }
  }

  const handleRemove = async (p: CatalogProductLite) => {
    setRemovingId(p.id)
    try {
      if (mode === 'visible') {
        const next = filterToCatalogCountryCodes(
          p.visibleCountryCodes.filter((c) => c.toUpperCase() !== countryCode)
        )
        await patchProduct(p.id, { visibleCountryCodes: next })
      } else {
        const next = filterToCatalogCountryCodes(
          p.hiddenCountryCodes.filter((c) => c.toUpperCase() !== countryCode)
        )
        await patchProduct(p.id, { hiddenCountryCodes: next })
      }
      toast.success('Product updated')
      onSaved()
    } catch (e: any) {
      toast.error(e?.message || 'Failed')
    } finally {
      setRemovingId(null)
    }
  }

  const handleAdd = async (productId: string) => {
    setAddingId(productId)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/products/${productId}`)
      if (!res.ok) throw new Error('Could not load product')
      const data = await res.json()
      const p = data.product as CatalogProductLite
      if (mode === 'visible') {
        const next = filterToCatalogCountryCodes([...(p.visibleCountryCodes || []), countryCode])
        await patchProduct(productId, { visibleCountryCodes: next })
      } else {
        const next = filterToCatalogCountryCodes([...(p.hiddenCountryCodes || []), countryCode])
        await patchProduct(productId, { hiddenCountryCodes: next })
      }
      toast.success('Product updated')
      setSearch('')
      setSearchResults([])
      onSaved()
    } catch (e: any) {
      toast.error(e?.message || 'Failed')
    } finally {
      setAddingId(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'visible' ? 'Shown in' : 'Excluded in'} {countryLabel(countryCode)}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Products ({listed.length})</p>
            {listed.length === 0 ? (
              <p className="text-sm text-gray-500">No products yet. Add one below.</p>
            ) : (
              <ul className="space-y-2">
                {listed.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg text-sm"
                  >
                    <span className="text-gray-900 truncate">{p.name}</span>
                    <button
                      type="button"
                      disabled={removingId === p.id}
                      onClick={() => handleRemove(p)}
                      className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      {removingId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Add product</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name (min 2 characters)…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            />
            {searchLoading && <p className="text-xs text-gray-500 mt-1">Searching…</p>}
            {search.trim().length >= 2 && !searchLoading && searchResults.length > 0 && (
              <ul className="mt-2 border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                {searchResults.map((r) => (
                  <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="truncate text-gray-900">{r.name}</span>
                    <button
                      type="button"
                      disabled={addingId === r.id}
                      onClick={() => handleAdd(r.id)}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-teal-700 bg-teal-50 rounded hover:bg-teal-100"
                    >
                      {addingId === r.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {search.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">No products to add (or all already listed).</p>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
