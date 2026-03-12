'use client'

import { useState, useEffect } from 'react'
import { X, Download, Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  isActive: boolean
  _count?: { products: number }
}

interface ExportMetaCatalogModalProps {
  businessId: string
  categories: Category[]
  selectedProductIds: string[]
  totalProductCount: number
  onClose: () => void
}

type ExportScope = 'all' | 'categories' | 'selection'

export function ExportMetaCatalogModal({
  businessId,
  categories,
  selectedProductIds,
  totalProductCount,
  onClose
}: ExportMetaCatalogModalProps) {
  const [scope, setScope] = useState<ExportScope>('all')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [downloading, setDownloading] = useState(false)

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleExport = async () => {
    setDownloading(true)
    try {
      const params = new URLSearchParams()
      params.set('scope', scope)
      if (scope === 'categories' && selectedCategoryIds.length > 0) {
        params.set('categoryIds', selectedCategoryIds.join(','))
      } else if (scope === 'selection' && selectedProductIds.length > 0) {
        params.set('productIds', selectedProductIds.join(','))
      }

      const url = `/api/admin/stores/${businessId}/products/export-meta-catalog?${params}`
      const res = await fetch(url)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Export failed')
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `catalog_products.csv`
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      onClose()
    } catch (err: any) {
      alert(err.message || 'Failed to export')
    } finally {
      setDownloading(false)
    }
  }

  const canExport =
    scope === 'all' ||
    (scope === 'categories' && selectedCategoryIds.length > 0) ||
    (scope === 'selection' && selectedProductIds.length > 0)

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Export for Meta Commerce Manager</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Export products as CSV for Meta Commerce Manager / Facebook Catalog. Choose what to export.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
                className="mt-1 text-teal-600"
              />
              <div>
                <span className="font-medium text-gray-900">All products</span>
                <p className="text-xs text-gray-500">{totalProductCount} products</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === 'categories'}
                onChange={() => setScope('categories')}
                className="mt-1 text-teal-600"
              />
              <div>
                <span className="font-medium text-gray-900">By categories</span>
                <p className="text-xs text-gray-500">Select one or more categories</p>
              </div>
            </label>

            {scope === 'categories' && (
              <div className="ml-6 pl-6 border-l-2 border-gray-100 max-h-40 overflow-y-auto space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-gray-300 text-teal-600"
                    />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <span className="text-xs text-gray-400">({cat._count?.products ?? 0})</span>
                  </label>
                ))}
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === 'selection'}
                onChange={() => setScope('selection')}
                className="mt-1 text-teal-600"
              />
              <div>
                <span className="font-medium text-gray-900">Selected products</span>
                <p className="text-xs text-gray-500">
                  {selectedProductIds.length} products selected
                </p>
              </div>
            </label>

            {scope === 'selection' && selectedProductIds.length === 0 && (
              <p className="ml-6 text-xs text-amber-600">
                Select products in the list first, then export.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport || downloading}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download CSV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
