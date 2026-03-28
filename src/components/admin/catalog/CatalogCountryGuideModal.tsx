'use client'

import { useEffect } from 'react'
import { X, BookOpen, Eye, Ban, Layers, MapPin } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Help modal for country-based catalog: visible vs excluded lists and how they combine.
 */
export function CatalogCountryGuideModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-country-guide-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <BookOpen className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="catalog-country-guide-title" className="text-lg font-semibold text-gray-900 truncate">
                Country catalog guide
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">How visible and excluded countries work together</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="px-5 py-5 space-y-6 overflow-y-auto flex-1 min-h-0 scrollbar-hide text-sm text-gray-700 leading-relaxed"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <p className="text-gray-600">
            You set country rules <strong>per product</strong> under{' '}
            <span className="font-medium text-gray-800">Admin → Products → open a product → Country catalog</span>.
            This page summarizes which countries already appear in your rules; use the guide below if you are unsure
            which list to use.
          </p>

          <section className="rounded-lg border border-teal-200 bg-teal-50/40 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-teal-900 mb-2">
              <Layers className="w-4 h-4 shrink-0" />
              Two lists on each product
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-teal-900/90">
              <li>
                <strong>Shown in (visible)</strong> — only these countries will see the product (when this list is
                not empty).
              </li>
              <li>
                <strong>Excluded (hidden)</strong> — visitors from these countries will <strong>not</strong> see the
                product.
              </li>
            </ul>
            <p className="mt-3 text-teal-900/85">
              The storefront uses the visitor&apos;s country (from their connection or a test parameter). Rules apply
              after WaveOrder SuperAdmin enables country-based catalog for your store.
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
              <Eye className="w-4 h-4 text-teal-600 shrink-0" />
              Show only in specific countries
            </h3>
            <p>
              Add one or more countries to <strong>Shown in</strong>. The product appears <strong>only</strong> for
              visitors from those countries. Use this when you sell only in certain regions.
            </p>
            <p className="mt-2 text-gray-600">
              If <strong>Shown in</strong> is empty, the product is not limited by this list (see &quot;everywhere
              except…&quot; below).
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
              <Ban className="w-4 h-4 text-amber-600 shrink-0" />
              Exclude countries (hide from visitors)
            </h3>
            <p>
              Add countries to <strong>Excluded</strong>. Visitors from those countries will not see the product, even
              if they would otherwise match <strong>Shown in</strong>.
            </p>
            <p className="mt-2 text-gray-600">
              Use this to block specific markets while keeping a broad or worldwide catalog.
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
              <Layers className="w-4 h-4 text-gray-600 shrink-0" />
              Using both lists together
            </h3>
            <p>
              Exclusions are applied as well as the visible list. Typical pattern: narrow with <strong>Shown in</strong>,
              then remove edge cases with <strong>Excluded</strong>.
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1.5 text-gray-700">
              <li>If the visitor&apos;s country is in <strong>Excluded</strong> → product is hidden.</li>
              <li>
                Else, if <strong>Shown in</strong> has countries and the visitor&apos;s country is not in that list →
                product is hidden.
              </li>
              <li>Else → product is shown.</li>
            </ol>
          </section>

          <section className="rounded-lg border border-teal-200 bg-gradient-to-br from-teal-50/80 to-white p-4">
            <h3 className="flex items-center gap-2 font-semibold text-teal-900 mb-2">
              <MapPin className="w-4 h-4 shrink-0" />
              &quot;Everywhere&quot; except some countries
            </h3>
            <p className="text-teal-900/90">
              Leave <strong>Shown in</strong> empty and add countries only under <strong>Excluded</strong>. The product
              is available worldwide <strong>except</strong> where you excluded it.
            </p>
          </section>

          <section className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-amber-950">
            <p className="font-medium text-amber-900 mb-1">Tip</p>
            <p className="text-amber-900/90">
              Start with one product, save, and check your storefront as a visitor from the target country (or use
              your team&apos;s testing flow). Adjust <strong>Shown in</strong> / <strong>Excluded</strong> until the
              catalog matches what you want.
            </p>
          </section>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
