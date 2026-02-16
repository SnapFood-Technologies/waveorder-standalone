import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronLeft, ChevronRight, Eye, Percent } from 'lucide-react'

interface DiscountsListProps {
  businessId: string
}

interface CategoryRef {
  id: string
  name: string
}

interface DiscountedProduct {
  id: string
  name: string
  sku: string | null
  price: number
  originalPrice: number
  isActive: boolean
  category: CategoryRef | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface Business {
  currency: string
  businessType?: string
}

export default function DiscountsList({ businessId }: DiscountsListProps) {
  const [products, setProducts] = useState<DiscountedProduct[]>([])
  const [business, setBusiness] = useState<Business>({ currency: 'USD', businessType: 'RESTAURANT' })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 })
  const [categories, setCategories] = useState<CategoryRef[]>([])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      if (search !== debouncedSearch) setCurrentPage(1)
    }, 500)
    return () => clearTimeout(t)
  }, [search])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness({ 
          currency: data.business.currency,
          businessType: data.business.businessType || 'RESTAURANT'
        })
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/categories?lightweight=true`)
      if (res.ok) {
        const data = await res.json()
        setCategories((data.categories || []).map((c: any) => ({ id: c.id, name: c.name })))
      }
    } catch (e) {
      // ignore
    }
  }

  const fetchDiscounts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pagination.limit),
        search: debouncedSearch,
      })
      if (selectedCategory) params.append('category', selectedCategory)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/stores/${businessId}/discounts?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error('Failed to fetch discounts', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinessData()
    fetchCategories()
  }, [businessId])

  useEffect(() => {
    fetchDiscounts()
  }, [businessId, currentPage, debouncedSearch, selectedCategory, statusFilter])

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

  const discountPercent = (p: DiscountedProduct) => {
    const diff = p.originalPrice - p.price
    if (p.originalPrice <= 0) return 0
    return Math.round((diff / p.originalPrice) * 100)
  }

  const baseUrl = useMemo(() => `/admin/stores/${businessId}`, [businessId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-semibold">Discounts</h1>
          </div>
          <p className="text-gray-600 mt-1">
            {business.businessType === 'SALON' 
              ? 'Manage your service discounts and their statuses'
              : 'Manage your product discounts and their statuses'}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={business.businessType === 'SALON' ? 'Search by name...' : 'Search by name or SKU...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Count */}
            <div className="text-sm text-gray-600">
              {pagination.total} discounted {business.businessType === 'SALON' ? 'services' : 'products'}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                {business.businessType !== 'SALON' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={business.businessType === 'SALON' ? 7 : 8} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={business.businessType === 'SALON' ? 7 : 8} className="px-4 py-8 text-center text-gray-500">
                    No discounted {business.businessType === 'SALON' ? 'services' : 'products'} found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                    {business.businessType !== 'SALON' && (
                      <td className="px-4 py-3 text-sm text-gray-600">{p.sku || '-'}</td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 line-through">{formatCurrency(p.originalPrice)}</td>
                    <td className="px-4 py-3 text-sm text-teal-700 font-semibold">{discountPercent(p)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${p.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <Link
                        href={business.businessType === 'SALON' 
                          ? `${baseUrl}/services/${p.id}`
                          : `${baseUrl}/products/${p.id}`}
                        className="inline-flex items-center px-2 py-1 text-teal-700 hover:text-teal-900"
                        title={business.businessType === 'SALON' ? 'View service' : 'View product'}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 bg-white">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {Math.max(1, pagination.pages)}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded border border-gray-200 text-gray-700 disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded border border-gray-200 text-gray-700 disabled:opacity-50"
              disabled={currentPage >= pagination.pages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}