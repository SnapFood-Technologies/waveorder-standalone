'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Package, 
  Store, 
  Share2,
  Info,
  DollarSign,
  X,
  Minus
} from 'lucide-react'

interface StorePreviewProps {
  businessData: any
  settings: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    whatsappButtonColor: string
    mobileCartStyle: 'bar' | 'badge'
  }
  device: 'mobile' | 'desktop'
}

// Currency symbol helper
const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    case 'GBP': return '£'
    default: return '$'
  }
}

// Demo products based on business type
const getDemoProducts = (businessType: string) => {
  switch (businessType) {
    case 'RESTAURANT':
      return [
        { id: 1, name: 'Signature Pasta', description: 'Fresh homemade pasta with rich tomato sauce and herbs', price: 12.99, featured: true },
        { id: 2, name: 'Grilled Salmon', description: 'Atlantic salmon with lemon butter and seasonal vegetables', price: 18.99, featured: false },
        { id: 3, name: 'House Salad', description: 'Mixed greens with house vinaigrette and fresh toppings', price: 9.99, featured: false }
      ]
    case 'CAFE':
      return [
        { id: 1, name: 'Artisan Coffee', description: 'Premium blend with perfect aroma and rich flavor', price: 4.50, featured: true },
        { id: 2, name: 'Fresh Croissant', description: 'Buttery, flaky pastry baked fresh daily', price: 3.99, featured: false },
        { id: 3, name: 'Avocado Toast', description: 'Smashed avocado on sourdough with cherry tomatoes', price: 8.99, featured: false }
      ]
    case 'RETAIL':
      return [
        { id: 1, name: 'Featured Product', description: 'Our most popular item this season with great reviews', price: 29.99, featured: true },
        { id: 2, name: 'Gift Set', description: 'Perfect gift package for any special occasion', price: 45.00, featured: false },
        { id: 3, name: 'Premium Collection', description: 'High-quality items from our premium line', price: 89.99, featured: false }
      ]
    case 'GROCERY':
      return [
        { id: 1, name: 'Fresh Vegetables', description: 'Locally sourced seasonal vegetables, crisp and fresh', price: 6.99, featured: true },
        { id: 2, name: 'Organic Fruits', description: 'Premium organic fruits picked at perfect ripeness', price: 8.50, featured: false },
        { id: 3, name: 'Dairy Bundle', description: 'Fresh milk, eggs, and cheese from local farms', price: 12.99, featured: false }
      ]
    default:
      return [
        { id: 1, name: 'Popular Item', description: 'Customer favorite with excellent reviews', price: 19.99, featured: true },
        { id: 2, name: 'Daily Special', description: 'Today\'s featured special offer', price: 12.50, featured: false },
        { id: 3, name: 'Premium Choice', description: 'High-quality premium option', price: 24.99, featured: false }
      ]
  }
}

export function StorePreview({ businessData, settings, device }: StorePreviewProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cartCount, setCartCount] = useState(2)
  const [searchTerm, setSearchTerm] = useState('')
  const [fontsLoaded, setFontsLoaded] = useState(false)

  // Load Google Fonts for preview
  useEffect(() => {
    const fontLink = document.createElement('link')
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&family=Lato:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;500;600;700&display=swap'
    fontLink.rel = 'stylesheet'
    fontLink.id = 'store-preview-fonts'
    
    if (!document.getElementById('store-preview-fonts')) {
      document.head.appendChild(fontLink)
    }

    // Force re-render after fonts load
    fontLink.onload = () => {
      setTimeout(() => setFontsLoaded(true), 100)
    }
    
    return () => {
      const existingLink = document.getElementById('store-preview-fonts')
      if (existingLink) {
        document.head.removeChild(existingLink)
      }
    }
  }, [])

  // Create dynamic styles
  const previewStyles = {
    fontFamily: settings.fontFamily === 'Arial' 
      ? 'Arial, Helvetica, sans-serif'
      : `'${settings.fontFamily}', Arial, Helvetica, sans-serif`,
    '--preview-font': settings.fontFamily === 'Arial' 
      ? 'Arial, Helvetica, sans-serif'
      : `'${settings.fontFamily}', Arial, Helvetica, sans-serif`
  } as React.CSSProperties

  const currencySymbol = getCurrencySymbol(businessData.currency)
  const demoProducts = getDemoProducts(businessData.businessType)

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'popular', name: 'Popular' },
    { id: 'specials', name: 'Specials' }
  ]

  const addToCart = () => {
    setCartCount(prev => prev + 1)
  }

  const calculateCartTotal = () => {
    const baseTotal = 42.98 + (cartCount - 2) * 8.50
    return baseTotal.toFixed(2)
  }

  // Filter products based on search
  const getFilteredProducts = () => {
    if (!searchTerm.trim()) return demoProducts
    return demoProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredProducts = getFilteredProducts()

  if (device === 'desktop') {
    return (
      <div className="bg-gray-100 rounded-xl p-4 max-w-6xl mx-auto" style={{ fontFamily: settings.fontFamily }}>
        <div className="text-center mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Desktop Preview</h3>
          <p className="text-xs text-gray-500">Desktop view shows the responsive layout</p>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden shadow-sm" style={{ fontFamily: `${settings.fontFamily} !important` }}>
          {/* Header with Cover Image */}
          <div 
            className="relative h-48"
            style={{ 
              background: businessData.coverImage 
                ? `linear-gradient(135deg, ${settings.primaryColor}CC, ${settings.primaryColor}99), url(${businessData.coverImage})` 
                : `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}CC)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute top-4 right-4 flex gap-3">
              <div className="w-8 h-8 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <div className="w-8 h-8 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                <Info className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Store Info Section */}
            <div className="flex items-start justify-between mb-8 relative">
              {/* Logo positioned over cover image */}
              <div 
                className="absolute -top-16 left-0 w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl bg-white"
                style={{ color: settings.primaryColor }}
              >
                {businessData.logo ? (
                  <img src={businessData.logo} alt={businessData.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  businessData.name?.charAt(0) || 'S'
                )}
              </div>

              <div className="pt-6 flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900">{businessData.name}</h1>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">Open</span>
                  
                  {/* Desktop Delivery Switcher */}
                  <div className="ml-auto">
                    <div className="inline-flex bg-gray-100 p-1 rounded-full">
                      <button 
                        className="px-4 py-2 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <Package className="w-4 h-4 mr-1 inline" />
                        Delivery
                      </button>
                      <button className="px-4 py-2 rounded-full text-sm font-medium text-gray-600">
                        <Store className="w-4 h-4 mr-1 inline" />
                        Pickup
                      </button>
                    </div>
                  </div>
                </div>
                
                {businessData.description && (
                  <p className="text-gray-600 text-lg mb-4">{businessData.description}</p>
                )}
                
                <div className="flex items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">123 Sample Street</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">20-30 min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Free delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl p-0 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchTerm ? `Searching for "${searchTerm}"...` : "Search for dishes, ingredients..."}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    // Auto-switch to "All" category when searching
                    if (e.target.value.trim() && selectedCategory !== 'all') {
                      setSelectedCategory('all')
                    }
                  }}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-2 transition-colors"
                  style={{ '--focus-border-color': settings.primaryColor } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = settings.primaryColor}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                {/* Clear search button */}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Search results count */}
              {searchTerm && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                  <p className="text-sm text-gray-600">
                    {filteredProducts.length === 0 
                      ? `No results for "${searchTerm}"`
                      : `${filteredProducts.length} result${filteredProducts.length !== 1 ? 's' : ''} for "${searchTerm}"`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto">
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  // Keep search term when switching to "All"
                }}
                className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 relative ${
                  selectedCategory === 'all'
                    ? 'border-b-2'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
                style={{ 
                  color: selectedCategory === 'all' ? settings.primaryColor : undefined,
                  borderBottomColor: selectedCategory === 'all' ? settings.primaryColor : 'transparent'
                }}
              >
                All
                {searchTerm && selectedCategory === 'all' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {filteredProducts.length}
                  </span>
                )}
              </button>
              {categories.slice(1).map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    // Clear search when switching to specific category
                    if (searchTerm) {
                      setSearchTerm('')
                    }
                  }}
                  className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 relative ${
                    selectedCategory === category.id
                      ? 'border-b-2'
                      : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                  }`}
                  style={{ 
                    color: selectedCategory === category.id ? settings.primaryColor : undefined,
                    borderBottomColor: selectedCategory === category.id ? settings.primaryColor : 'transparent'
                  }}
                >
                  {category.name}
                  {searchTerm && selectedCategory !== 'all' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      0
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedCategory === 'all' ? filteredProducts : demoProducts.filter(p => p.featured && selectedCategory === 'popular')).map(product => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image Placeholder */}
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    <Package className="w-12 h-12 text-gray-400" />
                    {product.featured && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                        Popular
                      </span>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{product.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xl" style={{ color: settings.primaryColor }}>
                        {currencySymbol}{product.price.toFixed(2)}
                      </span>
                      <button
                        onClick={addToCart}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary (Desktop) - Matches storefront mobile cart styles */}
            {cartCount > 0 && (
              <div className="mt-8">
                {settings.mobileCartStyle === 'badge' ? (
                  /* Floating Cart Badge Style */
                  <div className="flex justify-end">
                    <div 
                      className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer"
                      style={{ backgroundColor: settings.whatsappButtonColor || settings.primaryColor }}
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
                      </svg>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        {cartCount}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Cart Bar Style */
                  <div className="bg-gray-50 rounded-xl p-6">
                    <button
                      className="w-full py-4 rounded-xl font-semibold text-white text-lg flex items-center justify-between shadow-lg hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: settings.whatsappButtonColor || settings.primaryColor }}
                    >
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
                        </svg>
                        <span>{cartCount} items in cart</span>
                      </div>
                      <span>{currencySymbol}{calculateCartTotal()}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Mobile Preview
  return (
    <div className="bg-gray-100 rounded-xl p-4 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Mobile Preview</h3>
        <p className="text-xs text-gray-500">Interactive demo with your custom styling</p>
      </div>
      
      {/* Mobile Phone Frame */}
      <div className="bg-black rounded-3xl p-2 mx-auto" style={{ width: '310px' }}>
        <div className="bg-white rounded-2xl overflow-hidden h-[600px] relative" style={previewStyles}>
          
          {/* Cover Image Header */}
          <div 
            className="relative h-32"
            style={{ 
              background: businessData.coverImage 
                ? `linear-gradient(135deg, ${settings.primaryColor}CC, ${settings.primaryColor}99), url(${businessData.coverImage})` 
                : `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}CC)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Status Bar */}
            <div className="absolute top-2 left-4 right-4 flex justify-between items-center text-white text-xs">
              <span>9:41 AM</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Header Icons */}
            <div className="absolute top-5 right-5 flex gap-2">
              <div className="w-6 h-6 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                <Share2 className="w-3 h-3 text-white" />
              </div>
              <div className="w-6 h-6 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                <Search className="w-3 h-3 text-white" />
              </div>
              <div className="w-6 h-6 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                <Info className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Store Info Section */}
          <div className="bg-white p-4 relative">
            {/* Logo */}
            <div 
              className="absolute -top-6 left-4 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg bg-white"
              style={{ color: settings.primaryColor }}
            >
              {businessData.logo ? (
                <img src={businessData.logo} alt={businessData.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                businessData.name?.charAt(0) || 'S'
              )}
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {businessData.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Open
                </span>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {businessData.description || 'Fresh food delivered to your door'}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">123 Sample Street</span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>20-30 min</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Free delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Type Switcher */}
          <div className="px-4 py-2">
            <div className="inline-flex bg-gray-100 p-1 rounded-full">
              <button 
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <Package className="w-3 h-3 mr-1 inline" />
                Delivery
              </button>
              <button className="px-3 py-1 rounded-full text-xs font-medium text-gray-600">
                <Store className="w-3 h-3 mr-1 inline" />
                Pickup
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-2 transition-colors"
                style={{ '--focus-border-color': settings.primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-4 py-2">
            <div className="flex gap-1 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    selectedCategory === category.id
                      ? 'border-b-2'
                      : 'text-gray-600 border-transparent hover:text-gray-800'
                  }`}
                  style={{ 
                    color: selectedCategory === category.id ? settings.primaryColor : undefined,
                    borderBottomColor: selectedCategory === category.id ? settings.primaryColor : 'transparent'
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto px-4 pb-16">
            <div className="space-y-3">
              {(selectedCategory === 'all' ? filteredProducts : demoProducts.filter(p => p.featured && selectedCategory === 'popular')).map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex items-center p-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-sm text-gray-900 truncate mr-2">
                          {product.name}
                        </h3>
                        {product.featured && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium whitespace-nowrap">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm" style={{ color: settings.primaryColor }}>
                          {currencySymbol}{product.price.toFixed(2)}
                        </span>
                        <button
                          onClick={addToCart}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-16 h-16 ml-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Button - Bar Style */}
          {cartCount > 0 && settings.mobileCartStyle === 'bar' && (
            <div className="absolute bottom-4 left-4 right-4">
              <button
                className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm flex items-center justify-between shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: settings.whatsappButtonColor }}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
                  </svg>
                  <span>Order via WhatsApp</span>
                </div>
                <span>{currencySymbol}{calculateCartTotal()}</span>
              </button>
            </div>
          )}

          {/* Floating Cart Badge */}
          {cartCount > 0 && settings.mobileCartStyle === 'badge' && (
            <div 
              className="absolute bottom-10 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer"
              style={{ backgroundColor: settings.whatsappButtonColor }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {cartCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="mt-4 flex justify-center space-x-2">
        <button
          onClick={addToCart}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Add Item
        </button>
        <button
          onClick={() => setCartCount(Math.max(0, cartCount - 1))}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <Minus className="w-4 h-4 inline mr-1" />
          Remove
        </button>
        <button
          onClick={() => setCartCount(0)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          <X className="w-4 h-4 inline mr-1" />
          Clear
        </button>
      </div>
    </div>
  )
}