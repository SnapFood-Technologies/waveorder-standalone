// src/components/admin/stores/QuickCreateStoreModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Store, Loader2, ArrowRight } from 'lucide-react'

interface QuickCreateStoreModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickCreateStoreModal({ isOpen, onClose }: QuickCreateStoreModalProps) {
  const router = useRouter()
  const [storeName, setStoreName] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from store name
  const handleNameChange = (name: string) => {
    setStoreName(name)
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)
    setSlug(generatedSlug)
  }

  const handleCreate = async () => {
    if (!storeName.trim() || !slug.trim()) {
      setError('Please enter a store name')
      return
    }

    try {
      setCreating(true)
      setError(null)

      // Check slug availability
      const checkRes = await fetch('/api/setup/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      })
      
      const checkData = await checkRes.json()
      if (!checkData.available) {
        setError('This URL is already taken. Please choose a different name.')
        return
      }

      // Create the business with minimal data
      const createRes = await fetch('/api/setup/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'complete',
          data: {
            businessName: storeName.trim(),
            slug: slug.trim(),
            businessType: 'RETAIL',
            whatsappNumber: '',
            deliveryMethods: { delivery: true, pickup: true, dineIn: false },
            quickCreate: true // Flag to indicate quick create
          }
        })
      })

      if (!createRes.ok) {
        const errorData = await createRes.json()
        throw new Error(errorData.message || 'Failed to create store')
      }

      const createData = await createRes.json()
      
      // Redirect to the new store's settings to complete setup
      router.push(`/admin/stores/${createData.businessId}/settings/business`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Create Store</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Name *
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Awesome Store"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store URL
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm rounded-l-lg border border-r-0 border-gray-200">
                waveorder.app/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-store"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This will be your store's unique URL
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Quick create</strong> will set up a basic store. You can customize 
              settings, add products, and configure delivery options after creation.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !storeName.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Store
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
