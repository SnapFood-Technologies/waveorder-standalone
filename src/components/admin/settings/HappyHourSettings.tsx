// src/components/admin/settings/HappyHourSettings.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Percent, Package, Save, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  price: number
  status: string
  category?: {
    id: string
    name: string
  }
}

interface HappyHourData {
  happyHourEnabled: boolean // SuperAdmin toggle
  happyHourActive: boolean // Business toggle
  happyHourStartTime: string | null
  happyHourEndTime: string | null
  happyHourDiscountPercent: number | null
  happyHourProductIds: string[]
}

interface HappyHourSettingsProps {
  businessId: string
}

export function HappyHourSettings({ businessId }: HappyHourSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<HappyHourData>({
    happyHourEnabled: false,
    happyHourActive: false,
    happyHourStartTime: '20:00',
    happyHourEndTime: '23:59',
    happyHourDiscountPercent: 20,
    happyHourProductIds: []
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch happy hour settings and products
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch business settings
      const settingsRes = await fetch(`/api/admin/stores/${businessId}/happy-hour`)
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings({
          happyHourEnabled: settingsData.happyHourEnabled || false,
          happyHourActive: settingsData.happyHourActive || false,
          happyHourStartTime: settingsData.happyHourStartTime || '20:00',
          happyHourEndTime: settingsData.happyHourEndTime || '23:59',
          happyHourDiscountPercent: settingsData.happyHourDiscountPercent || 20,
          happyHourProductIds: settingsData.happyHourProductIds || []
        })
      }

      // Fetch products
      const productsRes = await fetch(`/api/admin/stores/${businessId}/products?limit=1000`)
      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
      }
    } catch (error) {
      console.error('Error fetching happy hour data:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!settings.happyHourStartTime || !settings.happyHourEndTime) {
      toast.error('Please set start and end times')
      return
    }
    
    if (!settings.happyHourDiscountPercent || settings.happyHourDiscountPercent < 1 || settings.happyHourDiscountPercent > 99) {
      toast.error('Discount must be between 1% and 99%')
      return
    }

    if (settings.happyHourActive && settings.happyHourProductIds.length === 0) {
      toast.error('Please select at least one product for happy hour')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/happy-hour`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          happyHourActive: settings.happyHourActive,
          happyHourStartTime: settings.happyHourStartTime,
          happyHourEndTime: settings.happyHourEndTime,
          happyHourDiscountPercent: settings.happyHourDiscountPercent,
          happyHourProductIds: settings.happyHourProductIds
        })
      })

      if (res.ok) {
        toast.success('Happy hour settings saved')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleProduct = (productId: string) => {
    setSettings(prev => {
      const isSelected = prev.happyHourProductIds.includes(productId)
      return {
        ...prev,
        happyHourProductIds: isSelected
          ? prev.happyHourProductIds.filter(id => id !== productId)
          : [...prev.happyHourProductIds, productId]
      }
    })
  }

  const selectAllProducts = () => {
    const filteredProducts = products.filter(p => 
      p.status === 'active' && 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setSettings(prev => ({
      ...prev,
      happyHourProductIds: [...new Set([...prev.happyHourProductIds, ...filteredProducts.map(p => p.id)])]
    }))
  }

  const clearAllProducts = () => {
    setSettings(prev => ({ ...prev, happyHourProductIds: [] }))
  }

  const filteredProducts = products.filter(p => 
    p.status === 'active' && 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Uncategorized'
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Feature not enabled by SuperAdmin
  if (!settings.happyHourEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Happy Hour / Daily Discounts</h1>
          <p className="text-gray-600 mt-1">
            Offer time-based discounts on selected products
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Feature Not Available</h3>
          <p className="text-amber-700">
            The Happy Hour feature is not enabled for your business. 
            Please contact support if you would like to use this feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Happy Hour / Daily Discounts</h1>
          <p className="text-gray-600 mt-1">
            Offer time-based discounts on selected products
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Activation Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-amber-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Activate Happy Hour</h3>
              <p className="text-sm text-gray-500">
                When active, selected products will show discounted prices during happy hour
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, happyHourActive: !prev.happyHourActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
              settings.happyHourActive ? 'bg-amber-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.happyHourActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.happyHourActive && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              Happy Hour is active! Discounts will apply during the scheduled time.
            </p>
          </div>
        )}
      </div>

      {/* Time and Discount Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
          Schedule & Discount
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={settings.happyHourStartTime || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, happyHourStartTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">When happy hour begins</p>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={settings.happyHourEndTime || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, happyHourEndTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">When happy hour ends</p>
          </div>

          {/* Discount Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="99"
                value={settings.happyHourDiscountPercent || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, happyHourDiscountPercent: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">% off selected products</p>
          </div>
        </div>

        {/* Preview */}
        {settings.happyHourStartTime && settings.happyHourEndTime && settings.happyHourDiscountPercent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Preview:</span> Products will have{' '}
              <span className="font-bold text-amber-600">{settings.happyHourDiscountPercent}% off</span> every day from{' '}
              <span className="font-bold">{settings.happyHourStartTime}</span> to{' '}
              <span className="font-bold">{settings.happyHourEndTime}</span>
            </p>
          </div>
        )}
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Package className="w-5 h-5 mr-2 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Select Products ({settings.happyHourProductIds.length} selected)
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllProducts}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              Select All Visible
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={clearAllProducts}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder:text-gray-500"
          />
        </div>

        {/* Products List */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {Object.entries(productsByCategory).length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No active products found
            </div>
          ) : (
            Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
              <div key={categoryName}>
                <div className="sticky top-0 bg-gray-100 px-4 py-2 font-medium text-sm text-gray-700">
                  {categoryName}
                </div>
                {categoryProducts.map((product) => {
                  const isSelected = settings.happyHourProductIds.includes(product.id)
                  const discountedPrice = settings.happyHourDiscountPercent 
                    ? product.price * (1 - settings.happyHourDiscountPercent / 100)
                    : product.price
                  
                  return (
                    <label
                      key={product.id}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        isSelected ? 'bg-amber-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduct(product.id)}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="ml-3 text-sm text-gray-900">{product.name}</span>
                      </div>
                      <div className="text-sm text-right">
                        {isSelected && settings.happyHourDiscountPercent ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 line-through">${product.price.toFixed(2)}</span>
                            <span className="text-amber-600 font-medium">${discountedPrice.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {settings.happyHourActive && settings.happyHourProductIds.length === 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Please select at least one product for happy hour discounts.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
