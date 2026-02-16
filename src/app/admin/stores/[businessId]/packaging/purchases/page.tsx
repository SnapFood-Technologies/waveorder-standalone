// src/app/admin/stores/[businessId]/packaging/purchases/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ShoppingBag, Plus, Edit, Trash2, X, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PackagingPurchase {
  id: string
  packagingTypeId: string
  supplier: string
  supplierContact: string | null
  quantity: number
  unitCost: number
  totalCost: number
  purchaseDate: string
  notes: string | null
  packagingType: {
    id: string
    name: string
    unit: string
  }
}

interface PackagingType {
  id: string
  name: string
  unit: string
}

interface Business {
  currency: string
}

export default function PackagingPurchasesPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [purchases, setPurchases] = useState<PackagingPurchase[]>([])
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([])
  const [business, setBusiness] = useState<Business>({ currency: 'USD' })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    packagingTypeId: '',
    supplier: '',
    supplierContact: '',
    quantity: '',
    unitCost: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    fetchBusiness()
    fetchPurchases()
    fetchPackagingTypes()
  }, [businessId])

  const fetchBusiness = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}`)
      if (res.ok) {
        const data = await res.json()
        setBusiness({ currency: data.business?.currency || 'USD' })
      }
    } catch (error) {
      console.error('Error fetching business:', error)
    }
  }

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/packaging/purchases`)
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchases || [])
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }

  const fetchPackagingTypes = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/packaging/types`)
      if (res.ok) {
        const data = await res.json()
        setPackagingTypes(data.packagingTypes?.filter((t: PackagingType) => t.id) || [])
      }
    } catch (error) {
      console.error('Error fetching packaging types:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.packagingTypeId || !formData.supplier || !formData.quantity || !formData.unitCost) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const url = editingId
        ? `/api/admin/stores/${businessId}/packaging/purchases/${editingId}`
        : `/api/admin/stores/${businessId}/packaging/purchases`
      
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packagingTypeId: formData.packagingTypeId,
          supplier: formData.supplier,
          supplierContact: formData.supplierContact || null,
          quantity: parseFloat(formData.quantity),
          unitCost: parseFloat(formData.unitCost),
          purchaseDate: formData.purchaseDate,
          notes: formData.notes || null
        })
      })

      if (res.ok) {
        toast.success(editingId ? 'Purchase updated' : 'Purchase recorded')
        setShowForm(false)
        setEditingId(null)
        setFormData({
          packagingTypeId: '',
          supplier: '',
          supplierContact: '',
          quantity: '',
          unitCost: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
        fetchPurchases()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to save purchase')
      }
    } catch (error) {
      console.error('Error saving purchase:', error)
      toast.error('Failed to save purchase')
    }
  }

  const handleEdit = (purchase: PackagingPurchase) => {
    setEditingId(purchase.id)
    setFormData({
      packagingTypeId: purchase.packagingTypeId,
      supplier: purchase.supplier,
      supplierContact: purchase.supplierContact || '',
      quantity: purchase.quantity.toString(),
      unitCost: purchase.unitCost.toString(),
      purchaseDate: purchase.purchaseDate.split('T')[0],
      notes: purchase.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this purchase record?')) return

    try {
      const res = await fetch(`/api/admin/stores/${businessId}/packaging/purchases/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Purchase deleted')
        fetchPurchases()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to delete purchase')
      }
    } catch (error) {
      console.error('Error deleting purchase:', error)
      toast.error('Failed to delete purchase')
    }
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
    }
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const calculateTotal = () => {
    if (formData.quantity && formData.unitCost) {
      return parseFloat(formData.quantity) * parseFloat(formData.unitCost)
    }
    return 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-semibold text-gray-900">Packaging Purchases</h1>
          </div>
          <p className="text-gray-600 mt-1">Record packaging material purchases from suppliers</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({
                packagingTypeId: '',
                supplier: '',
                supplierContact: '',
                quantity: '',
                unitCost: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                notes: ''
              })
            }}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Purchase
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Purchase' : 'New Purchase'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Type *</label>
                <select
                  required
                  value={formData.packagingTypeId}
                  onChange={(e) => setFormData({ ...formData, packagingTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select packaging type</option>
                  {packagingTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Contact</label>
                <input
                  type="text"
                  value={formData.supplierContact}
                  onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Phone, email, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                <input
                  type="text"
                  value={formatCurrency(calculateTotal())}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Record Purchase'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({
                    packagingTypeId: '',
                    supplier: '',
                    supplierContact: '',
                    quantity: '',
                    unitCost: '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    notes: ''
                  })
                }}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {purchases.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No purchases recorded yet. Record your first purchase!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packaging Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.packagingType.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{purchase.supplier}</div>
                      {purchase.supplierContact && (
                        <div className="text-xs text-gray-500">{purchase.supplierContact}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {purchase.quantity} {purchase.packagingType.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(purchase.unitCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(purchase.totalCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEdit(purchase)}
                        className="text-teal-600 hover:text-teal-700 mr-3 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
