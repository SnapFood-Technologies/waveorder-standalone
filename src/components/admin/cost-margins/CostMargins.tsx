// src/components/admin/cost-margins/CostMargins.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  CreditCard,
  Info,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  Plus,
  Download,
  RefreshCw,
  Loader2,
  Check,
  Trash2,
  Calendar,
  Building2,
  FileText,
  HelpCircle,
  ArrowRight,
  Percent,
  BarChart3
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CostMarginsProps {
  businessId: string
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice: number | null
  costPrice: number | null
  supplierName: string | null
  sku: string | null
  stock: number
  isActive: boolean
  images: string[]
  category: { id: string; name: string } | null
  margin: number | null
  profit: number | null
}

interface SupplierPayment {
  id: string
  supplierName: string
  amount: number
  currency: string
  periodStart: string | null
  periodEnd: string | null
  paymentMethod: string | null
  reference: string | null
  notes: string | null
  paidAt: string
  createdAt: string
}

interface FinancialData {
  period: { start: string; end: string; label: string }
  summary: {
    totalRevenue: number
    totalCOGS: number
    grossProfit: number
    grossMarginPercent: number
    ordersCount: number
  }
  supplierBalances: {
    owedToSuppliers: number
    alreadyPaid: number
    outstandingBalance: number
  }
  supplierBreakdown: Array<{
    supplierName: string
    cogs: number
    revenue: number
    itemsSold: number
    paid: number
    outstanding: number
  }>
  chartData: Array<{
    date: string
    revenue: number
    cogs: number
    profit: number
  }>
}

export default function CostMargins({ businessId }: CostMarginsProps) {
  const [activeTab, setActiveTab] = useState('products')
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  
  // Products tab state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productFilter, setProductFilter] = useState<'all' | 'with_cost' | 'without_cost'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ costPrice: string; supplierName: string }>({ costPrice: '', supplierName: '' })
  const [savingProduct, setSavingProduct] = useState(false)
  const [productPage, setProductPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // Financial tab state
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [financialLoading, setFinancialLoading] = useState(false)
  const [financialPeriod, setFinancialPeriod] = useState('this_month')
  
  // Payments tab state
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsBySupplier, setPaymentsBySupplier] = useState<Array<{ supplierName: string; totalPaid: number; paymentCount: number }>>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({
    supplierName: '',
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().split('T')[0]
  })
  const [addingPayment, setAddingPayment] = useState(false)
  const [editingPayment, setEditingPayment] = useState<string | null>(null)
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null)

  // Overview data
  const [overviewData, setOverviewData] = useState<any>(null)

  const tabs = [
    { id: 'products', label: 'Product Costs', icon: Package },
    { id: 'financial', label: 'Financial Summary', icon: TrendingUp },
    { id: 'payments', label: 'Supplier Payments', icon: CreditCard },
  ]

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/cost-margins`)
      const data = await res.json()
      
      if (!data.enabled) {
        setEnabled(false)
        setLoading(false)
        return
      }
      
      setEnabled(true)
      setCurrency(data.currency || 'EUR')
      setOverviewData(data.data)
    } catch (error) {
      console.error('Error fetching overview:', error)
      toast.error('Failed to load cost & margins data')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const params = new URLSearchParams({
        page: productPage.toString(),
        limit: '50',
        ...(productSearch && { search: productSearch }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(supplierFilter && { supplier: supplierFilter }),
        ...(productFilter === 'with_cost' && { hasCostPrice: 'true' }),
        ...(productFilter === 'without_cost' && { hasCostPrice: 'false' }),
      })
      
      const res = await fetch(`/api/admin/stores/${businessId}/cost-margins/products?${params}`)
      const data = await res.json()
      
      if (data.enabled) {
        setProducts(data.data.products)
        setTotalProducts(data.data.pagination.total)
        setCategories(data.data.filters.categories)
        setSuppliers(data.data.filters.suppliers)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setProductsLoading(false)
    }
  }, [businessId, productPage, productSearch, categoryFilter, supplierFilter, productFilter])

  // Fetch financial data
  const fetchFinancial = useCallback(async () => {
    setFinancialLoading(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/cost-margins/financial?period=${financialPeriod}`)
      const data = await res.json()
      
      if (data.enabled) {
        setFinancialData(data.data)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    } finally {
      setFinancialLoading(false)
    }
  }, [businessId, financialPeriod])

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/cost-margins/supplier-payments`)
      const data = await res.json()
      
      if (data.enabled) {
        setPayments(data.data.payments)
        setPaymentsBySupplier(data.data.totalsBySupplier)
        setGrandTotal(data.data.grandTotal)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setPaymentsLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    if (enabled && activeTab === 'products') {
      fetchProducts()
    }
  }, [enabled, activeTab, fetchProducts])

  useEffect(() => {
    if (enabled && activeTab === 'financial') {
      fetchFinancial()
    }
  }, [enabled, activeTab, fetchFinancial])

  useEffect(() => {
    if (enabled && activeTab === 'payments') {
      fetchPayments()
    }
  }, [enabled, activeTab, fetchPayments])

  // Format currency
  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', ALL: 'L'
    }
    const symbol = symbols[currency] || currency + ' '
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Save product cost
  const handleSaveProduct = async (productId: string) => {
    setSavingProduct(true)
    try {
      const costPrice = editValues.costPrice === '' ? null : parseFloat(editValues.costPrice)
      const supplierName = editValues.supplierName.trim() || null
      
      const res = await fetch(`/api/admin/stores/${businessId}/cost-margins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [{ productId, costPrice, supplierName }]
        })
      })
      
      if (res.ok) {
        toast.success('Product updated')
        setEditingProduct(null)
        fetchProducts()
        fetchOverview()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to update product')
    } finally {
      setSavingProduct(false)
    }
  }

  // Add payment
  const handleAddPayment = async () => {
    if (!newPayment.supplierName || !newPayment.amount) {
      toast.error('Supplier name and amount are required')
      return
    }
    
    setAddingPayment(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/cost-margins/supplier-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName: newPayment.supplierName,
          amount: parseFloat(newPayment.amount),
          paymentMethod: newPayment.paymentMethod || null,
          reference: newPayment.reference || null,
          notes: newPayment.notes || null,
          paidAt: newPayment.paidAt
        })
      })
      
      if (res.ok) {
        toast.success('Payment recorded')
        setShowAddPayment(false)
        setNewPayment({
          supplierName: '',
          amount: '',
          paymentMethod: '',
          reference: '',
          notes: '',
          paidAt: new Date().toISOString().split('T')[0]
        })
        fetchPayments()
        fetchFinancial()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to add payment')
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    } finally {
      setAddingPayment(false)
    }
  }

  // Delete payment
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return
    
    setDeletingPayment(paymentId)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/cost-margins/supplier-payments/${paymentId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast.success('Payment deleted')
        fetchPayments()
        fetchFinancial()
      } else {
        toast.error('Failed to delete payment')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Failed to delete payment')
    } finally {
      setDeletingPayment(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost & Margins</h1>
          <p className="text-gray-600 mt-1">Track costs, margins, and supplier payments</p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">Feature Not Enabled</h3>
              <p className="text-amber-700">
                Cost & Margins is not enabled for your business. Please contact support to enable this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost & Margins</h1>
          <p className="text-gray-600 mt-1">
            Track product costs, profit margins, and supplier payments
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchOverview()
              if (activeTab === 'products') fetchProducts()
              if (activeTab === 'financial') fetchFinancial()
              if (activeTab === 'payments') fetchPayments()
            }}
            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-teal-900 mb-3">How Cost & Margins Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-teal-800">1. Set Cost Prices</span>
                </div>
                <p className="text-teal-700">
                  Enter the cost price (what you pay your supplier) for each product. Margins are calculated automatically.
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-teal-800">2. Track COGS</span>
                </div>
                <p className="text-teal-700">
                  Cost of Goods Sold (COGS) is calculated from completed orders: quantity × cost price. See your true profit.
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-teal-800">3. Log Payments</span>
                </div>
                <p className="text-teal-700">
                  Record payments to suppliers. Track what you owe vs what you've paid to manage cash flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {overviewData.summary.productsWithCostPrice}/{overviewData.summary.totalProducts}
            </p>
            <p className="text-sm text-gray-600">Products with Cost Set</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {overviewData.summary.averageMargin}%
            </p>
            <p className="text-sm text-gray-600">Average Margin</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{overviewData.summary.uniqueSuppliers}</p>
            <p className="text-sm text-gray-600">Unique Suppliers</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(overviewData.payments.allTime.total)}
            </p>
            <p className="text-sm text-gray-600">Total Paid to Suppliers</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      setProductPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>
              
              <select
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value as any)
                  setProductPage(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Products</option>
                <option value="with_cost">With Cost Price</option>
                <option value="without_cost">Without Cost Price</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setProductPage(1)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              {suppliers.length > 0 && (
                <select
                  value={supplierFilter}
                  onChange={(e) => {
                    setSupplierFilter(e.target.value)
                    setProductPage(1)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map(sup => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            {productsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Cost Price</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sell Price</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Margin %</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Profit/Unit</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Supplier</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                              {product.sku && (
                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {product.category?.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {editingProduct === product.id ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editValues.costPrice}
                              onChange={(e) => setEditValues(prev => ({ ...prev, costPrice: e.target.value }))}
                              className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                              placeholder="0.00"
                            />
                          ) : (
                            <span className={`text-sm ${product.costPrice ? 'text-gray-900' : 'text-gray-400'}`}>
                              {product.costPrice !== null ? formatCurrency(product.costPrice) : 'Not set'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {product.margin !== null ? (
                            <span className={`text-sm font-medium ${
                              product.margin >= 50 ? 'text-green-600' :
                              product.margin >= 20 ? 'text-blue-600' :
                              product.margin >= 0 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>
                              {product.margin}%
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {product.profit !== null ? (
                            <span className={`text-sm ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(product.profit)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingProduct === product.id ? (
                            <input
                              type="text"
                              value={editValues.supplierName}
                              onChange={(e) => setEditValues(prev => ({ ...prev, supplierName: e.target.value }))}
                              className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                              placeholder="Supplier name"
                              list="supplier-list"
                            />
                          ) : (
                            <span className={`text-sm ${product.supplierName ? 'text-gray-900' : 'text-gray-400'}`}>
                              {product.supplierName || 'Not set'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {editingProduct === product.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveProduct(product.id)}
                                disabled={savingProduct}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {savingProduct ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingProduct(product.id)
                                setEditValues({
                                  costPrice: product.costPrice?.toString() || '',
                                  supplierName: product.supplierName || ''
                                })
                              }}
                              className="p-1.5 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalProducts > 50 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((productPage - 1) * 50) + 1} to {Math.min(productPage * 50, totalProducts)} of {totalProducts} products
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProductPage(p => Math.max(1, p - 1))}
                    disabled={productPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setProductPage(p => p + 1)}
                    disabled={productPage * 50 >= totalProducts}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Supplier datalist for autocomplete */}
          <datalist id="supplier-list">
            {suppliers.map(sup => (
              <option key={sup} value={sup} />
            ))}
          </datalist>
        </div>
      )}

      {activeTab === 'financial' && (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={financialPeriod}
                onChange={(e) => setFinancialPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {financialLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <span className="ml-2 text-gray-600">Loading financial data...</span>
            </div>
          ) : financialData ? (
            <>
              {/* Financial Summary Card */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">Financial Summary</h3>
                  <p className="text-teal-100 text-sm">
                    {new Date(financialData.period.start).toLocaleDateString()} - {new Date(financialData.period.end).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">Total Revenue (Sales)</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(financialData.summary.totalRevenue)}</p>
                      <p className="text-xs text-blue-600 mt-1">{financialData.summary.ordersCount} completed orders</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm text-amber-600 font-medium">Cost of Goods Sold (COGS)</p>
                      <p className="text-2xl font-bold text-amber-900">{formatCurrency(financialData.summary.totalCOGS)}</p>
                      <p className="text-xs text-amber-600 mt-1">Based on product cost prices</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Gross Profit</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(financialData.summary.grossProfit)}</p>
                      <p className="text-xs text-green-600 mt-1">{financialData.summary.grossMarginPercent}% margin</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Supplier Balances</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Owed to Suppliers</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(financialData.supplierBalances.owedToSuppliers)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Already Paid</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(financialData.supplierBalances.alreadyPaid)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Outstanding Balance</p>
                        <p className={`text-xl font-bold ${financialData.supplierBalances.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(financialData.supplierBalances.outstandingBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Breakdown */}
              {financialData.supplierBreakdown.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Breakdown by Supplier</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Supplier</th>
                          <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Items Sold</th>
                          <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Revenue</th>
                          <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">COGS</th>
                          <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Paid</th>
                          <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Outstanding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {financialData.supplierBreakdown.map(supplier => (
                          <tr key={supplier.supplierName} className="hover:bg-gray-50">
                            <td className="py-3 px-6 font-medium text-gray-900">{supplier.supplierName}</td>
                            <td className="py-3 px-6 text-right text-gray-600">{supplier.itemsSold}</td>
                            <td className="py-3 px-6 text-right text-gray-900">{formatCurrency(supplier.revenue)}</td>
                            <td className="py-3 px-6 text-right text-amber-600">{formatCurrency(supplier.cogs)}</td>
                            <td className="py-3 px-6 text-right text-green-600">{formatCurrency(supplier.paid)}</td>
                            <td className={`py-3 px-6 text-right font-medium ${supplier.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(supplier.outstanding)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info about COGS calculation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How COGS is Calculated</p>
                    <p>
                      COGS = Sum of (order item quantity × product cost price) for all delivered/completed orders with paid status. 
                      Products without a cost price are calculated as {formatCurrency(0)} cost.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No financial data available for this period</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Add Payment Button */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Total paid to suppliers: <span className="font-semibold text-gray-900">{formatCurrency(grandTotal)}</span>
              </p>
            </div>
            <button
              onClick={() => setShowAddPayment(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Payment
            </button>
          </div>

          {/* Add Payment Form */}
          {showAddPayment && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Record Supplier Payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    value={newPayment.supplierName}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, supplierName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="Enter supplier name"
                    list="payment-supplier-list"
                  />
                  <datalist id="payment-supplier-list">
                    {suppliers.map(sup => (
                      <option key={sup} value={sup} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select method</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={newPayment.paidAt}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paidAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Invoice #</label>
                  <input
                    type="text"
                    value={newPayment.reference}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={newPayment.notes}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowAddPayment(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={addingPayment}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {addingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Payments by Supplier Summary */}
          {paymentsBySupplier.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payments by Supplier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentsBySupplier.map(supplier => (
                  <div key={supplier.supplierName} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{supplier.supplierName}</p>
                    <p className="text-lg font-bold text-teal-600">{formatCurrency(supplier.totalPaid)}</p>
                    <p className="text-xs text-gray-500">{supplier.paymentCount} payment(s)</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Payment History</h3>
            </div>
            
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                <span className="ml-2 text-gray-600">Loading payments...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No payments recorded yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Payment" to record your first supplier payment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Supplier</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Method</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Reference</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-sm text-gray-900">
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6 font-medium text-gray-900">{payment.supplierName}</td>
                        <td className="py-3 px-6 text-right text-sm font-semibold text-teal-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600 capitalize">
                          {payment.paymentMethod?.replace('_', ' ') || '-'}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600">
                          {payment.reference || '-'}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            disabled={deletingPayment === payment.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete payment"
                          >
                            {deletingPayment === payment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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
      )}
    </div>
  )
}
