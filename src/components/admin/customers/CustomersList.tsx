import React, { useState, useEffect } from 'react'
import { Search, Plus, Users, Phone, Mail, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import Link from 'next/link'

interface CustomersListProps {
  businessId: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  totalOrders: number
  addressJson: any
  tags: string[]
  notes: string | null
  addedByAdmin: boolean
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function CustomersList({ businessId }: CustomersListProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: debouncedSearchQuery
      })

      const response = await fetch(`/api/admin/stores/${businessId}/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [businessId, currentPage, debouncedSearchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const filteredCustomers = customers.filter(customer => {
    if (filterTier === 'all') return true
    return customer.tier === filterTier.toUpperCase()
  })

  const getTierBadge = (tier: string) => {
    const styles = {
      REGULAR: 'bg-gray-100 text-gray-700',
      VIP: 'bg-purple-100 text-purple-700',
      WHOLESALE: 'bg-blue-100 text-blue-700'
    }
    return styles[tier as keyof typeof styles] || styles.REGULAR
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCustomerTypeLabel = (totalOrders: number) => {
    if (totalOrders === 0) return { label: 'No Order Customer', color: 'text-blue-600' }
    if (totalOrders === 1) return { label: 'New Customer Customer', color: 'text-teal-600' }
    if (totalOrders < 5) return { label: 'Regular', color: 'text-green-600' }
    return { label: 'Frequent', color: 'text-purple-600' }
  }

  if (loading && customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer database and relationships
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Link
            href={`/admin/stores/${businessId}/customers/create`}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, phone, or email..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Tier Filter and Count */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Tiers</option>
              <option value="regular">Regular</option>
              <option value="vip">VIP</option>
              <option value="wholesale">Wholesale</option>
            </select>

            <div className="text-sm text-gray-600">
              {pagination.total} customers
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {debouncedSearchQuery ? 'No customers found' : 'No customers yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {debouncedSearchQuery 
                ? 'Try adjusting your search terms or filters to find the customers you\'re looking for.'
                : 'Start building your customer base by adding your first customer. You can manually add customers or they can register through orders.'
              }
            </p>
            {!debouncedSearchQuery && (
              <Link
                href={`/admin/stores/${businessId}/customers/create`}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Customer
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const customerType = getCustomerTypeLabel(customer.totalOrders)
                    
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-teal-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.addedByAdmin ? 'Added by admin' : 'Self-registered'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <Phone className="w-3 h-3 mr-2 text-gray-400" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-3 h-3 mr-2 text-gray-400" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(customer.tier)}`}>
                            {customer.tier}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {customer.totalOrders}
                            </div>
                            <div className={`text-xs ${customerType.color}`}>
                              {customerType.label}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {customer.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{customer.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                          {formatDate(customer.createdAt)}
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/stores/${businessId}/customers/${customer.id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} customers
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                      disabled={pagination.page === pagination.pages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}