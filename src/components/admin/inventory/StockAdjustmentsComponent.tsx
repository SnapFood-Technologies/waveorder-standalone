'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Search, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Save,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import Link from 'next/link'

interface StockAdjustmentsPageProps {
  businessId: string
}

interface Product {
  id: string
  name: string
  images: string[]
  stock: number
  trackInventory: boolean
  category: {
    name: string
  }
}

interface SuccessMessage {
  product: string
  oldStock: number
  newStock: number
  change: number
}

export default function StockAdjustmentsComponent({ businessId }: StockAdjustmentsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [businessId])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products.filter((p: Product) => p.trackInventory))
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStockUpdated = (productId: string, newStock: number, oldStock: number, productName: string) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: newStock } : p
    ))
    setSelectedProduct(prev => 
      prev?.id === productId ? { ...prev, stock: newStock } : prev
    )

    // Show success message
    setSuccessMessage({
      product: productName,
      oldStock,
      newStock,
      change: newStock - oldStock
    })

    // Hide success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Stock Updated Successfully</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {successMessage.product}: {successMessage.oldStock} → {successMessage.newStock}
                  <span className={`ml-2 font-medium ${successMessage.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({successMessage.change > 0 ? '+' : ''}{successMessage.change})
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/stores/${businessId}/inventory`}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-gray-600 mt-1">
            Manually adjust stock levels for your products
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            Select Product
          </h3>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`w-full p-4 text-left border rounded-lg transition-all duration-200 ${
                  selectedProduct?.id === product.id
                    ? 'border-teal-500 bg-teal-50 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.category.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{product.stock}</span>
                    <p className="text-xs text-gray-500">in stock</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found with inventory tracking enabled</p>
            </div>
          )}
        </div>

        {/* Stock Adjustment Form */}
        <div>
          {selectedProduct ? (
            <StockAdjustmentForm
              businessId={businessId}
              product={selectedProduct}
              onStockUpdated={(newStock, oldStock) => 
                handleStockUpdated(selectedProduct.id, newStock, oldStock, selectedProduct.name)
              }
            />
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Adjust Stock</h3>
              <p className="text-gray-500">Select a product from the list to adjust its stock level</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stock Adjustment Form Component
interface StockAdjustmentFormProps {
  businessId: string
  product: Product
  onStockUpdated: (newStock: number, oldStock: number) => void
}

function StockAdjustmentForm({ businessId, product, onStockUpdated }: StockAdjustmentFormProps) {
  const [newStock, setNewStock] = useState(product.stock.toString())
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNewStock(product.stock.toString())
    setReason('')
    setError('')
  }, [product.id, product.stock])

  const difference = parseInt(newStock) - product.stock
  const isIncrease = difference > 0
  const isDecrease = difference < 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const stockValue = parseInt(newStock)
    if (isNaN(stockValue) || stockValue < 0) {
      setError('Please enter a valid stock amount')
      return
    }

    if (difference === 0) {
      setError('No change in stock level')
      return
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the adjustment')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${product.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStock: stockValue,
          reason: reason.trim()
        })
      })

      if (response.ok) {
        onStockUpdated(stockValue, product.stock)
        setReason('')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update stock')
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-6 h-6 text-gray-400" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-600">Current stock: {product.stock} units</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Stock Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Stock Level
          </label>
          <input
            type="number"
            min="0"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter new stock amount"
          />
        </div>

        {/* Stock Change Preview */}
        {difference !== 0 && (
          <div className={`p-4 rounded-lg border-2 ${
            isIncrease 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-3">
              {isIncrease ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${isIncrease ? 'text-green-900' : 'text-red-900'}`}>
                  Stock {isIncrease ? 'Increase' : 'Decrease'}
                </p>
                <p className={`text-sm ${isIncrease ? 'text-green-700' : 'text-red-700'}`}>
                  {product.stock} → {newStock} ({difference > 0 ? '+' : ''}{difference} units)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reason Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Adjustment *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="e.g., Physical count correction, damaged items, restocking..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving || difference === 0 || !reason.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Updating Stock...' : 'Update Stock Level'}
        </button>
      </form>
    </div>
  )
}