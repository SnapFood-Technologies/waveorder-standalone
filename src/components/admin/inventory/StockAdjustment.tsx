// src/components/admin/inventory/StockAdjustment.tsx
'use client'

import { useState } from 'react'
import { Save, Package, AlertTriangle } from 'lucide-react'

interface StockAdjustmentProps {
  businessId: string
  product: {
    id: string
    name: string
    stock: number
    trackInventory: boolean
  }
  onStockUpdated: (newStock: number) => void
}

export function StockAdjustment({ businessId, product, onStockUpdated }: StockAdjustmentProps) {
  const [newStock, setNewStock] = useState(product.stock)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newStock === product.stock) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${product.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStock,
          reason: reason || 'Manual stock adjustment'
        })
      })

      if (response.ok) {
        onStockUpdated(newStock)
        setReason('')
      }
    } catch (error) {
      console.error('Error updating stock:', error)
    } finally {
      setSaving(false)
    }
  }

  const stockDifference = newStock - product.stock

  if (!product.trackInventory) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Inventory tracking is disabled for this product</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Stock</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Stock: {product.stock}
          </label>
          <input
            type="number"
            min="0"
            value={newStock}
            onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter new stock quantity"
          />
        </div>

        {stockDifference !== 0 && (
          <div className={`p-3 rounded-lg ${
            stockDifference > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {stockDifference > 0 ? (
                <Package className="w-4 h-4 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                stockDifference > 0 ? 'text-green-800' : 'text-red-800'
              }`}>
                {stockDifference > 0 ? 'Increase' : 'Decrease'} by {Math.abs(stockDifference)} units
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="e.g., Damaged items, Found extra stock, etc."
          />
        </div>

        <button
          type="submit"
          disabled={saving || stockDifference === 0}
          className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Updating...' : 'Update Stock'}
        </button>
      </form>
    </div>
  )
}