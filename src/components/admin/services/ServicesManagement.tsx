// src/components/admin/services/ServicesManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Scissors, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Star, 
  Eye,
  EyeOff,
  MoreVertical,
  Clock,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface Service {
  id: string
  name: string
  description?: string
  images: string[]
  price: number
  originalPrice?: number
  isActive: boolean
  featured: boolean
  categoryId: string
  category: {
    id: string
    name: string
  }
  business: {
    id: string
    name: string
  }
  modifiers: ProductModifier[]
  serviceDuration?: number | null
  requiresAppointment: boolean
  staffIds: string[]
  createdAt: string
  updatedAt: string
}

interface ProductModifier {
  id: string
  name: string
  price: number
  required: boolean
}

interface Category {
  id: string
  name: string
  isActive: boolean
  _count: {
    products: number
  }
}

interface Business {
  currency: string
}

interface ServicesPageProps {
  businessId: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ServicesManagement({ businessId }: ServicesPageProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [business, setBusiness] = useState<Business>({ currency: 'USD' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [deleteModalService, setDeleteModalService] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  const [stats, setStats] = useState({
    active: 0,
    featured: 0
  })

  // Fetch categories only once on mount
  useEffect(() => {
    fetchBusinessData()
    fetchCategories()
  }, [businessId])

  // Fetch services when filters change
  useEffect(() => {
    fetchServices()
  }, [businessId, currentPage, debouncedSearchTerm, selectedCategory, filterStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness({ currency: data.business.currency })
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/categories?lightweight=true`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: debouncedSearchTerm,
        category: selectedCategory,
        status: filterStatus
      })

      const servicesRes = await fetch(`/api/admin/stores/${businessId}/services?${params}`)

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.services || [])
        setPagination(servicesData.pagination)
        if (servicesData.stats) {
          setStats(servicesData.stats)
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
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

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setServices(prev => prev.map(s => 
          s.id === serviceId ? { ...s, isActive } : s
        ))
      }
    } catch (error) {
      console.error('Error updating service status:', error)
    }
  }

  const toggleFeatured = async (serviceId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured })
      })

      if (response.ok) {
        setServices(prev => prev.map(s => 
          s.id === serviceId ? { ...s, featured } : s
        ))
      }
    } catch (error) {
      console.error('Error updating service featured status:', error)
    }
  }

  const confirmDelete = async () => {
    if (!deleteModalService) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/services/${deleteModalService.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== deleteModalService.id))
        setDeleteModalService(null)
        fetchServices() // Refresh to update pagination
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const bulkUpdateStatus = async (isActive: boolean) => {
    try {
      // Update each service individually
      await Promise.all(
        selectedServices.map(serviceId => 
          fetch(`/api/admin/stores/${businessId}/services/${serviceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive })
          })
        )
      )
      setServices(prev => prev.map(s => 
        selectedServices.includes(s.id) ? { ...s, isActive } : s
      ))
      setSelectedServices([])
      fetchServices() // Refresh
    } catch (error) {
      console.error('Error bulk updating services:', error)
    }
  }

  if (loading && services.length === 0) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            Manage your service catalog
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={addParams(`/admin/stores/${businessId}/services/new`)}
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <Scissors className="w-8 h-8 text-teal-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Services</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-purple-600">{stats.featured}</p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any)
                setCurrentPage(1)
              }}
              className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Search info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {services.length} of {pagination.total} services
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedServices.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-teal-800">
              {selectedServices.length} service(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus(true)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => bulkUpdateStatus(false)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => setSelectedServices([])}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {pagination.total === 0 ? 'No services yet' : 'No services found'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {pagination.total === 0 
              ? 'Start building your service catalog by adding your first service.'
              : 'Try adjusting your search terms or filter criteria to find the services you\'re looking for.'
            }
          </p>
          {pagination.total === 0 && (
            <Link
              href={addParams(`/admin/stores/${businessId}/services/new`)}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Service
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {services.map(service => (
              <div key={service.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Service Image */}
                <div className="relative h-48 bg-gray-100">
                  {service.images.length > 0 ? (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Scissors className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {service.business.id !== businessId && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                        {service.business.name}
                      </span>
                    )}
                    {service.featured && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                        Featured
                      </span>
                    )}
                    {!service.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium">
                        Inactive
                      </span>
                    )}
                    {service.serviceDuration && (
                      <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(service.serviceDuration)}
                      </span>
                    )}
                  </div>

                  {/* Selection checkbox */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServices(prev => [...prev, service.id])
                        } else {
                          setSelectedServices(prev => prev.filter(id => id !== service.id))
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Service Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">
                      {service.name}
                    </h3>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenDropdown(openDropdown === service.id ? null : service.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openDropdown === service.id && (
                        <div className="absolute right-0 top-8 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setDeleteModalService(service)
                                setOpenDropdown(null)
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-3" />
                              Delete Service
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {service.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {formatCurrency(service.price)}
                      </span>
                      {service.originalPrice && service.originalPrice > service.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(service.originalPrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {service.category.name}
                    </span>
                  </div>

                  {/* Service Duration & Staff */}
                  <div className="mb-3 space-y-1">
                    {service.serviceDuration && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(service.serviceDuration)}</span>
                      </div>
                    )}
                    {service.staffIds.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-3 h-3" />
                        <span>{service.staffIds.length} staff member(s)</span>
                      </div>
                    )}
                  </div>

                  {/* Modifiers info */}
                  {service.modifiers.length > 0 && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                        {service.modifiers.length} add-on(s)
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={addParams(`/admin/stores/${businessId}/services/${service.id}`)}
                      className="flex-1 px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 transition-colors text-center"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Manage
                    </Link>
                    
                    <button
                      onClick={() => toggleServiceStatus(service.id, !service.isActive)}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        service.isActive 
                          ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      title={service.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {service.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={() => toggleFeatured(service.id, !service.featured)}
                      className={`px-3 py-2 text-sm rounded transition-colors ${
                        service.featured
                          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      title={service.featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} services
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm text-gray-900">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Service</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{deleteModalService.name}</strong>? This will permanently remove the service from your catalog.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModalService(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Service'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
