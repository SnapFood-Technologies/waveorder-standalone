'use client'

import { useState, useEffect } from 'react'
import {
  Bug,
  Building2,
  Tag,
  Layers,
  Package,
  AlertTriangle,
  RefreshCw,
  Link2,
  X,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

interface Business {
  id: string
  name: string
  slug: string
}

interface Brand {
  id: string
  name: string
  businessId: string
}

type DebugTool = 'business' | 'brand' | 'category' | 'product' | 'stock' | 'sync' | 'connections'

export default function DebugToolsPage() {
  // State - NO businesses loaded on mount
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [businessSearch, setBusinessSearch] = useState('')
  const [businessSearchLoading, setBusinessSearchLoading] = useState(false)
  
  // Modal state
  const [activeModal, setActiveModal] = useState<DebugTool | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedBusinessName, setSelectedBusinessName] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [productIdInput, setProductIdInput] = useState('')
  const [debugLoading, setDebugLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<any>(null)
  const [debugError, setDebugError] = useState<string | null>(null)

  // Debounced business search
  useEffect(() => {
    if (!businessSearch || businessSearch.length < 2) {
      setBusinesses([])
      setBusinessSearchLoading(false)
      return
    }

    // Show loading immediately when typing
    setBusinessSearchLoading(true)

    const timer = setTimeout(() => {
      searchBusinesses(businessSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [businessSearch])

  // Fetch brands when business is selected
  useEffect(() => {
    if (selectedBusinessId) {
      fetchBrands(selectedBusinessId)
    } else {
      setBrands([])
    }
  }, [selectedBusinessId])

  const searchBusinesses = async (query: string) => {
    try {
      // Use existing businesses list API with search param
      const response = await fetch(`/api/superadmin/businesses?search=${encodeURIComponent(query)}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        // Map to simple format
        const businesses = (data.businesses || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          slug: b.slug
        }))
        setBusinesses(businesses)
      } else {
        setBusinesses([])
      }
    } catch (error) {
      console.error('Error searching businesses:', error)
      setBusinesses([])
    } finally {
      setBusinessSearchLoading(false)
    }
  }

  const fetchBrands = async (businessId: string) => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/brands`)
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  const selectBusiness = (business: Business) => {
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(`${business.name} (${business.slug})`)
    setBusinesses([]) // Clear dropdown
    setBusinessSearch('') // Clear search
  }

  const runDebug = async (tool: DebugTool) => {
    setDebugLoading(true)
    setDebugResult(null)
    setDebugError(null)

    try {
      let url = ''
      switch (tool) {
        case 'business':
          if (!selectedBusinessId) {
            setDebugError('Please select a business')
            setDebugLoading(false)
            return
          }
          url = `/api/superadmin/debug/business/${selectedBusinessId}`
          break
        case 'brand':
          if (!selectedBusinessId || !selectedBrandId) {
            setDebugError('Please select a business and brand')
            setDebugLoading(false)
            return
          }
          url = `/api/superadmin/debug/brand?businessId=${selectedBusinessId}&brandId=${selectedBrandId}`
          break
        case 'category':
          if (!selectedBusinessId) {
            setDebugError('Please select a business')
            setDebugLoading(false)
            return
          }
          url = `/api/superadmin/debug/category/${selectedBusinessId}`
          break
        case 'product':
          if (!productIdInput) {
            setDebugError('Please enter a product ID')
            setDebugLoading(false)
            return
          }
          url = `/api/superadmin/debug/product/${productIdInput}`
          break
        case 'stock':
          if (!selectedBusinessId) {
            setDebugError('Please select a business')
            setDebugLoading(false)
            return
          }
          url = `/api/superadmin/debug/stock/${selectedBusinessId}`
          break
        case 'sync':
          if (!selectedBusinessId) {
            setDebugError('Please select a business')
            setDebugLoading(false)
            return
          }
          url = `/api/superadmin/debug/sync/${selectedBusinessId}`
          break
        case 'connections':
          if (!selectedBusinessId) {
            setDebugError('Please select a business')
            setDebugLoading(false)
            return
          }
          url = `/api/superadmin/debug/connections/${selectedBusinessId}`
          break
      }

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        setDebugError(data.error || 'Debug failed')
      } else {
        setDebugResult(data)
      }
    } catch (error) {
      setDebugError('Failed to run debug')
      console.error('Debug error:', error)
    } finally {
      setDebugLoading(false)
    }
  }

  const openModal = (tool: DebugTool) => {
    // Reset ALL state when opening new modal
    setActiveModal(tool)
    setDebugResult(null)
    setDebugError(null)
    setDebugLoading(false)
    setBusinessSearch('')
    setBusinesses([])
    setBusinessSearchLoading(false)
    // Reset selection for fresh start
    if (tool === 'product') {
      setProductIdInput('')
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setDebugResult(null)
    setDebugError(null)
    setDebugLoading(false)
    setBusinessSearchLoading(false)
  }

  const clearSelectedBusiness = () => {
    setSelectedBusinessId('')
    setSelectedBusinessName('')
    setBrands([])
    setSelectedBrandId('')
  }

  const debugTools = [
    {
      id: 'business' as DebugTool,
      name: 'Business Health',
      description: 'Quick overview of any business problems - products, categories, sync status',
      icon: Building2,
      color: 'bg-blue-500',
      priority: 'High'
    },
    {
      id: 'brand' as DebugTool,
      name: 'Brand Debug',
      description: 'Analyze products by brand - stock, variants, why products are hidden',
      icon: Tag,
      color: 'bg-purple-500',
      priority: 'High'
    },
    {
      id: 'category' as DebugTool,
      name: 'Category Debug',
      description: 'Find categories with 0 products or 0 displayable products',
      icon: Layers,
      color: 'bg-green-500',
      priority: 'Medium'
    },
    {
      id: 'stock' as DebugTool,
      name: 'Stock Alerts',
      description: 'Products with 0 stock, variants with 0 stock, low stock alerts',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      priority: 'Medium'
    },
    {
      id: 'sync' as DebugTool,
      name: 'Sync Debug',
      description: 'External sync health - last sync, errors, products synced',
      icon: RefreshCw,
      color: 'bg-orange-500',
      priority: 'Medium'
    },
    {
      id: 'product' as DebugTool,
      name: 'Product Debug',
      description: 'Analyze a single product - why is it hidden, stock, variants',
      icon: Package,
      color: 'bg-pink-500',
      priority: 'Low'
    },
    {
      id: 'connections' as DebugTool,
      name: 'Connected Businesses',
      description: 'Originator/supplier relationships, product visibility',
      icon: Link2,
      color: 'bg-teal-500',
      priority: 'Low'
    }
  ]

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">High Priority</span>
      case 'Medium':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Medium</span>
      case 'Low':
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">Low</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Bug className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Debug Tools</h1>
            <p className="text-gray-600">Diagnose and troubleshoot platform issues</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">How to use Debug Tools</h3>
            <p className="text-sm text-blue-700 mt-1">
              Select a debug tool below, search for a business by name, and click "Analyze" to get detailed diagnostics. 
              Results will show why products might not be displaying, stock issues, sync problems, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Debug Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {debugTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => openModal(tool.id)}
            className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-teal-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              {getPriorityBadge(tool.priority)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
            <p className="text-sm text-gray-600">{tool.description}</p>
          </button>
        ))}
      </div>

      {/* Debug Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 border-b border-gray-200 gap-2">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {(() => {
                  const tool = debugTools.find(t => t.id === activeModal)
                  if (!tool) return null
                  return (
                    <>
                      <div className={`w-10 h-10 ${tool.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <tool.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900">{tool.name}</h2>
                        <p className="text-sm text-gray-600 hidden sm:block">{tool.description}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              {/* Input Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Business Search - shown for most tools */}
                {activeModal !== 'product' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Business
                    </label>
                    
                    {/* Show selected business or search input */}
                    {selectedBusinessId ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-gray-900">{selectedBusinessName}</span>
                        <button
                          onClick={clearSelectedBusiness}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {businessSearchLoading ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Type to search businesses..."
                          value={businessSearch}
                          onChange={(e) => setBusinessSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        
                        {/* Search Results Dropdown */}
                        {businesses.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                            {businesses.map(b => (
                              <button
                                key={b.id}
                                onClick={() => selectBusiness(b)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
                              >
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{b.name}</span>
                                <span className="text-gray-500 text-sm">({b.slug})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Type at least 2 characters to search</p>
                  </div>
                )}

                {/* Brand Selector - only for brand debug */}
                {activeModal === 'brand' && selectedBusinessId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Brand
                    </label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Choose a brand...</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Or enter brand ID manually:</p>
                    <input
                      type="text"
                      placeholder="Brand ID..."
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                    />
                  </div>
                )}

                {/* Product ID Input - only for product debug */}
                {activeModal === 'product' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter product ID..."
                      value={productIdInput}
                      onChange={(e) => setProductIdInput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={() => runDebug(activeModal)}
                  disabled={debugLoading}
                  className="w-full sm:w-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {debugLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {debugError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900">Error</h4>
                    <p className="text-sm text-red-700">{debugError}</p>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {debugResult && (
                <DebugResults tool={activeModal} data={debugResult} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Debug Results Component
function DebugResults({ tool, data }: { tool: DebugTool; data: any }) {
  if (data.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{data.error}</p>
      </div>
    )
  }

  switch (tool) {
    case 'business':
      return <BusinessHealthResults data={data} />
    case 'brand':
      return <BrandDebugResults data={data} />
    case 'category':
      return <CategoryDebugResults data={data} />
    case 'product':
      return <ProductDebugResults data={data} />
    case 'stock':
      return <StockDebugResults data={data} />
    case 'sync':
      return <SyncDebugResults data={data} />
    case 'connections':
      return <ConnectionsDebugResults data={data} />
    default:
      return <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
  }
}

// Business Health Results
function BusinessHealthResults({ data }: { data: any }) {
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [pingTime, setPingTime] = useState(0)

  const pingStorefront = async () => {
    if (!data.business?.slug) return
    setPingStatus('loading')
    try {
      const start = Date.now()
      const res = await fetch(`/api/storefront/${data.business.slug}`)
      setPingTime(Date.now() - start)
      setPingStatus(res.ok ? 'ok' : 'error')
    } catch {
      setPingStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Business Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Business Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{data.business?.name}</span></div>
          <div><span className="text-gray-500">Slug:</span> <span className="font-mono text-xs">{data.business?.slug}</span></div>
          <div><span className="text-gray-500">Type:</span> <span className="font-medium">{data.business?.businessType}</span></div>
          <div><span className="text-gray-500">Active:</span> <span className={data.business?.isActive ? 'text-green-600' : 'text-red-600'}>{data.business?.isActive ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      {/* Simple Counts */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Products" value={data.counts?.products || 0} color="blue" />
        <StatCard label="Orders" value={data.counts?.orders || 0} color="green" />
        <StatCard label="Customers" value={data.counts?.customers || 0} color="gray" />
      </div>

      {/* Storefront Ping - Manual Button */}
      {data.business?.slug && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-500 text-sm">Storefront:</span>{' '}
              <a 
                href={`/${data.business.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-mono text-sm text-blue-600 hover:underline"
              >
                /{data.business.slug}
              </a>
            </div>
            <div className="flex items-center gap-3">
              {pingStatus === 'ok' && (
                <span className="text-green-600 text-sm">✓ OK ({pingTime}ms)</span>
              )}
              {pingStatus === 'error' && (
                <span className="text-red-600 text-sm">✗ Failed</span>
              )}
              <button
                onClick={pingStorefront}
                disabled={pingStatus === 'loading'}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {pingStatus === 'loading' ? 'Pinging...' : 'Ping API'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Brand Debug Results
function BrandDebugResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Brand Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Brand Info</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{data.brand?.name}</span></div>
          <div><span className="text-gray-500">ID:</span> <span className="font-mono text-xs">{data.brand?.id}</span></div>
          <div><span className="text-gray-500">Type:</span> 
            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${data.brand?.isOriginatorBrand ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
              {data.brand?.isOriginatorBrand ? 'Originator' : 'Supplier'}
            </span>
          </div>
          <div><span className="text-gray-500">Active:</span> <span className={data.brand?.isActive ? 'text-green-600' : 'text-red-600'}>{data.brand?.isActive ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={data.analysis?.total || 0} color="gray" />
        <StatCard label="Displayable" value={data.storefrontDisplayable?.count || 0} color="green" />
        <StatCard label="Not Displayable" value={data.notDisplayableSample?.count || 0} color="red" />
        <StatCard label="With Variants" value={data.analysis?.hasVariants || 0} color="blue" />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">By Status</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Active:</span> <span className="font-medium text-green-600">{data.analysis?.active || 0}</span></div>
            <div className="flex justify-between"><span>Inactive:</span> <span className="font-medium text-red-600">{data.analysis?.inactive || 0}</span></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">By Price</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Price &gt; 0:</span> <span className="font-medium text-green-600">{data.analysis?.priceGreaterThanZero || 0}</span></div>
            <div className="flex justify-between"><span>Price = 0:</span> <span className="font-medium text-red-600">{data.analysis?.priceZero || 0}</span></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">By Stock (No Variants)</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Stock &gt; 0:</span> <span className="font-medium text-green-600">{data.analysis?.stockGreaterThanZero || 0}</span></div>
            <div className="flex justify-between"><span>Stock = 0:</span> <span className="font-medium text-red-600">{data.analysis?.stockZero || 0}</span></div>
            <div className="flex justify-between"><span>No Inventory Track:</span> <span className="font-medium text-gray-600">{data.analysis?.noTrackInventory || 0}</span></div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">By Images</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Has Images:</span> <span className="font-medium text-green-600">{data.analysis?.hasImages || 0}</span></div>
            <div className="flex justify-between"><span>No Images:</span> <span className="font-medium text-red-600">{data.analysis?.noImages || 0}</span></div>
          </div>
        </div>
      </div>

      {/* Variant Analysis */}
      {data.analysis?.variantAnalysis && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Variant Stock Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold">{data.analysis.variantAnalysis.totalProductsWithVariants}</div>
              <div className="text-xs text-gray-500">Products with Variants</div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold text-red-600">{data.analysis.variantAnalysis.allVariantsZeroStock}</div>
              <div className="text-xs text-gray-500">ALL Variants = 0 Stock</div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold text-yellow-600">{data.analysis.variantAnalysis.someVariantsHaveStock}</div>
              <div className="text-xs text-gray-500">Some Variants Have Stock</div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold text-green-600">{data.analysis.variantAnalysis.allVariantsHaveStock}</div>
              <div className="text-xs text-gray-500">ALL Variants Have Stock</div>
            </div>
          </div>
        </div>
      )}

      {/* Not Displayable Sample */}
      {data.notDisplayableSample?.first10?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Sample of Non-Displayable Products (First 10)</h4>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-red-200">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Price</th>
                  <th className="text-left py-2 px-2">Stock</th>
                  <th className="text-left py-2 px-2">Active</th>
                  <th className="text-left py-2 px-2">Images</th>
                  <th className="text-left py-2 px-2">Variants</th>
                  <th className="text-left py-2 px-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.notDisplayableSample.first10.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-red-100">
                    <td className="py-2 px-2 max-w-[150px] truncate" title={p.name}>{p.name}</td>
                    <td className="py-2 px-2">{p.price}</td>
                    <td className="py-2 px-2">{p.stock}</td>
                    <td className="py-2 px-2">{p.isActive ? '✓' : '✗'}</td>
                    <td className="py-2 px-2">{p.hasImages ? '✓' : '✗'}</td>
                    <td className="py-2 px-2">{p.variantsCount} ({p.variantsWithStock} w/stock)</td>
                    <td className="py-2 px-2">
                      <span className="px-1.5 py-0.5 bg-red-200 text-red-800 rounded text-xs">
                        {p.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Category Debug Results
function CategoryDebugResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Categories" value={data.summary?.total || 0} color="gray" />
        <StatCard label="With Products" value={data.summary?.withProducts || 0} color="green" />
        <StatCard label="Empty" value={data.summary?.empty || 0} color="red" />
        <StatCard label="Parent Categories" value={data.summary?.parents || 0} color="blue" />
      </div>

      {/* Empty Categories */}
      {data.emptyCategories?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Empty Categories ({data.emptyCategories.length})</h4>
          <div className="space-y-1 max-h-60 overflow-y-auto scrollbar-hide">
            {data.emptyCategories.map((cat: any) => (
              <div key={cat.id} className="flex justify-between text-sm py-1 border-b border-red-100 last:border-0">
                <span>{cat.name}</span>
                <span className="font-mono text-xs text-gray-500">{cat.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories with products but 0 displayable */}
      {data.zeroDisplayable?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Categories with Products but 0 Displayable ({data.zeroDisplayable.length})</h4>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-yellow-200">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Total Products</th>
                  <th className="text-left py-2 px-2">Displayable</th>
                  <th className="text-left py-2 px-2">Issue</th>
                </tr>
              </thead>
              <tbody>
                {data.zeroDisplayable.map((cat: any) => (
                  <tr key={cat.id} className="border-b border-yellow-100">
                    <td className="py-2 px-2">{cat.name}</td>
                    <td className="py-2 px-2">{cat.totalProducts}</td>
                    <td className="py-2 px-2">{cat.displayableProducts}</td>
                    <td className="py-2 px-2">
                      <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">{cat.reason}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Product Debug Results
function ProductDebugResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Product Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Product Info</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{data.product?.name}</span></div>
          <div><span className="text-gray-500">Price:</span> <span className="font-medium">{data.product?.price}</span></div>
          <div><span className="text-gray-500">Stock:</span> <span className="font-medium">{data.product?.stock}</span></div>
          <div><span className="text-gray-500">Active:</span> <span className={data.product?.isActive ? 'text-green-600' : 'text-red-600'}>{data.product?.isActive ? 'Yes' : 'No'}</span></div>
          <div><span className="text-gray-500">Track Inventory:</span> <span>{data.product?.trackInventory ? 'Yes' : 'No'}</span></div>
          <div><span className="text-gray-500">Images:</span> <span>{data.product?.images?.length || 0}</span></div>
        </div>
      </div>

      {/* Displayability Check */}
      <div className={`rounded-lg p-4 ${data.isDisplayable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-2">
          {data.isDisplayable ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">This product IS displayable on storefront</span>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">This product is NOT displayable</span>
            </>
          )}
        </div>
        {!data.isDisplayable && data.reason && (
          <p className="mt-2 text-sm text-red-700">Reason: {data.reason}</p>
        )}
      </div>

      {/* Variants */}
      {data.product?.variants?.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Variants ({data.product.variants.length})</h4>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Price</th>
                  <th className="text-left py-2 px-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.product.variants.map((v: any) => (
                  <tr key={v.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 px-2">{v.name}</td>
                    <td className="py-2 px-2">{v.price}</td>
                    <td className={`py-2 px-2 ${v.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{v.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Stock Debug Results
function StockDebugResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={data.summary?.totalProducts || 0} color="gray" />
        <StatCard label="Zero Stock" value={data.summary?.zeroStock || 0} color="red" />
        <StatCard label="Low Stock" value={data.summary?.lowStock || 0} color="yellow" />
        <StatCard label="In Stock" value={data.summary?.inStock || 0} color="green" />
      </div>

      {/* Zero Stock Products */}
      {data.zeroStockProducts?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Products with Zero Stock (First 20)</h4>
          <div className="overflow-x-auto scrollbar-hide max-h-60">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-red-50">
                <tr className="border-b border-red-200">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">SKU</th>
                  <th className="text-left py-2 px-2">Variants</th>
                </tr>
              </thead>
              <tbody>
                {data.zeroStockProducts.map((p: any) => (
                  <tr key={p.id} className="border-b border-red-100">
                    <td className="py-2 px-2 max-w-[200px] truncate">{p.name}</td>
                    <td className="py-2 px-2 font-mono">{p.sku || '-'}</td>
                    <td className="py-2 px-2">{p.variantsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Products */}
      {data.lowStockProducts?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Low Stock Alerts (First 20)</h4>
          <div className="overflow-x-auto scrollbar-hide max-h-60">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-yellow-50">
                <tr className="border-b border-yellow-200">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Stock</th>
                  <th className="text-left py-2 px-2">Alert Threshold</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p: any) => (
                  <tr key={p.id} className="border-b border-yellow-100">
                    <td className="py-2 px-2 max-w-[200px] truncate">{p.name}</td>
                    <td className="py-2 px-2 text-yellow-700 font-medium">{p.stock}</td>
                    <td className="py-2 px-2">{p.lowStockAlert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Sync Debug Results
function SyncDebugResults({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Sync Configs */}
      {data.syncs?.length > 0 ? (
        data.syncs.map((sync: any) => (
          <div key={sync.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{sync.name}</h4>
                <p className="text-sm text-gray-600">{sync.externalSystemName || 'External System'}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                sync.lastSyncStatus === 'success' ? 'bg-green-100 text-green-800' :
                sync.lastSyncStatus === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {sync.lastSyncStatus || 'Never synced'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Last Sync:</span> <span>{sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleString() : 'Never'}</span></div>
              <div><span className="text-gray-500">Active:</span> <span className={sync.isActive ? 'text-green-600' : 'text-red-600'}>{sync.isActive ? 'Yes' : 'No'}</span></div>
              {sync.lastSyncError && (
                <div className="col-span-2"><span className="text-gray-500">Error:</span> <span className="text-red-600">{sync.lastSyncError}</span></div>
              )}
            </div>

            {/* Recent Logs */}
            {sync.recentLogs?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Sync Logs</h5>
                <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-hide">
                  {sync.recentLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between text-xs py-1">
                      <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>{log.status}</span>
                      <span className="text-gray-500">{log.processedCount} processed, {log.errorCount} errors</span>
                      <span className="text-gray-400">{new Date(log.startedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No external sync configurations found for this business
        </div>
      )}
    </div>
  )
}

// Connections Debug Results
function ConnectionsDebugResults({ data }: { data: any }) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'receiver':
        return { class: 'bg-blue-100 text-blue-800', label: 'Receiver (Marketplace/Originator - receives products from others)' }
      case 'sharer':
        return { class: 'bg-purple-100 text-purple-800', label: 'Sharer (Supplier - shares products with others)' }
      case 'both':
        return { class: 'bg-green-100 text-green-800', label: 'Both (Receives and shares products)' }
      default:
        return { class: 'bg-gray-100 text-gray-800', label: 'Standalone (No connections)' }
    }
  }

  const roleBadge = getRoleBadge(data.role)

  return (
    <div className="space-y-4">
      {/* Business Info */}
      {data.business && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Business Info</h3>
          <div className="text-sm">
            <p><span className="text-gray-500">Name:</span> <span className="font-medium">{data.business.name}</span></p>
            <p><span className="text-gray-500">Slug:</span> <span className="font-mono text-xs">{data.business.slug}</span></p>
          </div>
        </div>
      )}

      {/* Business Role */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Connection Role</h3>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleBadge.class}`}>
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Own Products" value={data.summary.ownProducts || 0} color="gray" />
          <StatCard label="Received from Others" value={data.summary.productsReceivedFromOthers || 0} color="blue" />
          <StatCard label="Shared with Others" value={data.summary.productsSharedWithOthers || 0} color="green" />
          <StatCard label="Total Connections" value={data.summary.totalConnections || 0} color="yellow" />
        </div>
      )}

      {/* Connected Businesses */}
      {data.connectedBusinesses?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Connected Businesses ({data.connectedBusinesses.length})</h4>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-200">
                  <th className="text-left py-2 px-2">Business</th>
                  <th className="text-left py-2 px-2">Relationship</th>
                </tr>
              </thead>
              <tbody>
                {data.connectedBusinesses.map((b: any) => (
                  <tr key={b.id} className="border-b border-blue-100">
                    <td className="py-2 px-2">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-gray-500 text-xs ml-2">({b.slug})</span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        {b.relationship || 'connected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.connectedBusinesses?.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          This business has no product sharing connections with other businesses
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    gray: 'text-gray-900',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600'
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className={`text-2xl font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
