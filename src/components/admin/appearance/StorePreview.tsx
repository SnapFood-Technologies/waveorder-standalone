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
  X,
  Minus,
  Monitor,
  ExternalLink
} from 'lucide-react'

interface StorePreviewProps {
  businessData: any
  settings: {
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    whatsappButtonColor: string
    mobileCartStyle: 'bar' | 'badge'
    cartBadgeColor: string      // NEW
    featuredBadgeColor: string  // NEW
    coverBackgroundSize?: string
    coverBackgroundPosition?: string
    coverHeight?: string              // legacy / default
    coverHeightMobile?: string
    coverHeightDesktop?: string
    logoPadding?: string
    logoObjectFit?: string
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
    case 'BBD': return 'Bds$'
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
    case 'SALON':
      return [
        { id: 1, name: 'Haircut & Style', description: 'Professional haircut with styling and consultation', price: 35.00, featured: true, duration: 60 },
        { id: 2, name: 'Hair Color', description: 'Full hair coloring service with premium products', price: 85.00, featured: false, duration: 120 },
        { id: 3, name: 'Manicure', description: 'Classic manicure with nail shaping and polish', price: 25.00, featured: false, duration: 45 }
      ]
    case 'SERVICES':
      return [
        { id: 1, name: 'Consultation', description: 'One-on-one consultation to discuss your needs and goals', price: 0, featured: true, duration: 30 },
        { id: 2, name: 'Strategy Session', description: 'Dedicated session to plan and align on next steps', price: 150.00, featured: false, duration: 60 },
        { id: 3, name: 'In-person Review', description: 'Face-to-face review and follow-up session', price: 75.00, featured: false, duration: 45 }
      ]
    default:
      return [
        { id: 1, name: 'Popular Item', description: 'Customer favorite with excellent reviews', price: 19.99, featured: true },
        { id: 2, name: 'Daily Special', description: 'Today\'s featured special offer', price: 12.50, featured: false },
        { id: 3, name: 'Premium Choice', description: 'High-quality premium option', price: 24.99, featured: false }
      ]
  }
}

// Check if device is mobile
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024 // lg breakpoint
}

export function StorePreview({ businessData, settings, device }: StorePreviewProps) {
  const isSalon = businessData.businessType === 'SALON' || businessData.businessType === 'SERVICES'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cartCount, setCartCount] = useState(2)
  const [searchTerm, setSearchTerm] = useState('')
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice())
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const categories = isSalon 
    ? [
        { id: 'all', name: 'All' },
        { id: 'popular', name: 'Popular' },
        { id: 'hair', name: 'Hair Services' }
      ]
    : [
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

  // Filter products/services based on search
  const getFilteredProducts = () => {
    if (!searchTerm.trim()) return demoProducts
    return demoProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredProducts = getFilteredProducts()

  // Mobile responsive message
  if (isMobile && device === 'desktop') {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Desktop Preview Unavailable
          </h3>
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            Due to responsive design constraints, live previews work best on laptop or desktop computers. 
            For the best preview experience, please use a larger screen.
          </p>
          <a
            href={`/${businessData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Live Store Instead
          </a>
        </div>
      </div>
    )
  }

  // Mobile responsive messages
if (isMobile && device === 'mobile') {
  return (
    <div className="bg-gray-50 rounded-xl p-6 text-center">
      <div className="max-w-sm mx-auto">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 1C5.9 1 5 1.9 5 3v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2H7zm0 2h10v16H7V3z"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Mobile Preview Unavailable
        </h3>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          Mobile preview requires a larger screen to display properly. 
          For the best mobile preview experience, please use a tablet or desktop computer.
        </p>
        <a
          href={`/${businessData.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Live Store Instead
        </a>
      </div>
    </div>
  )
}

  // Fixed cover image background - removed double background
  const getCoverImageStyle = () => {
    if (businessData.coverImage) {
      return {
        backgroundImage: `url(${businessData.coverImage})`,
        backgroundSize: settings.coverBackgroundSize || 'cover',
        backgroundPosition: settings.coverBackgroundPosition || 'center',
        backgroundRepeat: 'no-repeat'
      }
    } else {
      return {
        background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.primaryColor}CC)`
      }
    }
  }

  // Desktop version of StorePreview with fixed layout issues
  if (device === 'desktop') {
    return (
      <div className="bg-gray-100 rounded-xl p-4 max-w-6xl mx-auto" style={{ fontFamily: settings.fontFamily }}>
        <div className="text-center mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Desktop Preview</h3>
          <p className="text-xs text-gray-500">Desktop view shows the responsive layout</p>
        </div>
        
        <div className="bg-white rounded-xl overflow-hidden shadow-sm" style={{ fontFamily: `${settings.fontFamily} !important` }}>
          {/* Header with Cover Image - FIXED: No double background */}
          <div 
            className="relative"
            style={{
              ...getCoverImageStyle(),
              height: settings.coverHeightDesktop || settings.coverHeight || '220px'
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
                className="absolute -top-16 left-0 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-xl bg-white"
                style={{ 
                  color: settings.primaryColor,
                  padding: settings.logoPadding || '0px'
                }}
              >
                {businessData.logo ? (
                  <img 
                    src={businessData.logo} 
                    alt={businessData.name} 
                    className="w-full h-full rounded-full" 
                    style={{
                      objectFit: (settings.logoObjectFit || 'cover') as 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
                    }}
                  />
                ) : (
                  businessData.name?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
  
              <div className="pt-6 flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900">{businessData.name}</h1>
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">Open</span>
                  
                  {/* Desktop Delivery Switcher - Hidden for salons */}
                  {!isSalon && (
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
                  )}
                </div>
                
                {businessData.description && (
                  <p className="text-gray-600 text-lg mb-4">{businessData.description}</p>
                )}
                
                {/* FIXED: Address on separate line from delivery info */}
                <div className="space-y-2">
                  {/* Address line */}
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">123 Sample Street, Downtown</span>
                  </div>
                  
                  {/* Time and delivery fee on same line - Hidden for salons */}
                  {!isSalon && (
                    <div className="flex items-center gap-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">20-30 min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span className="text-sm">Free delivery</span>
                      </div>
                    </div>
                  )}
                  {/* Service duration for salons */}
                  {isSalon && (
                    <div className="flex items-center gap-6 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">60 min</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
  
            {/* Search Section */}
            <div className="bg-white rounded-2xl p-0 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchTerm ? `Searching for "${searchTerm}"...` : (isSalon ? "Search for services..." : "Search for dishes, ingredients...")}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    if (e.target.value.trim() && selectedCategory !== 'all') {
                      setSelectedCategory('all')
                    }
                  }}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-2 transition-colors"
                  style={{ '--focus-border-color': settings.primaryColor } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = settings.primaryColor}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                )}
              </div>
              
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
  
            {/* Check if there are products/services to show */}
            {(() => {
              const productsToShow = selectedCategory === 'all' ? filteredProducts : demoProducts.filter(p => p.featured && selectedCategory === 'popular')
              
              if (productsToShow.length === 0 && searchTerm) {
                return (
                  /* Empty state for no search results */
                  <div className="text-center py-16 px-4">
                    <div className="max-w-md mx-auto">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${settings.primaryColor}15` }}
                      >
                        <Search 
                          className="w-10 h-10"
                          style={{ color: settings.primaryColor }}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        No results found for "{searchTerm}"
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Try a different search term or browse all {isSalon ? 'services' : 'products'}
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={() => setSearchTerm('')}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          Clear Search
                        </button>
                        <button
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedCategory('all')
                          }}
                          className="block w-full sm:w-auto px-6 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors mx-auto"
                          style={{ borderColor: settings.primaryColor, color: settings.primaryColor }}
                        >
                          Browse All {isSalon ? 'Services' : 'Products'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              } else if (productsToShow.length === 0) {
                return (
                  /* Empty state for no products in category */
                  <div className="text-center py-16 px-4">
                    <div className="max-w-md mx-auto">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                        style={{ backgroundColor: `${settings.primaryColor}15` }}
                      >
                        <Package 
                          className="w-10 h-10"
                          style={{ color: settings.primaryColor }}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {selectedCategory === 'all' 
                          ? (isSalon ? 'No Services Yet' : 'No Products Yet')
                          : `No ${isSalon ? 'services' : 'products'} in ${categories.find(c => c.id === selectedCategory)?.name || 'this category'}`
                        }
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {selectedCategory === 'all' 
                          ? `Your desktop store preview will show here once you add ${isSalon ? 'services' : 'products'} to your categories.`
                          : 'This category is currently empty. Browse other categories or check back later.'
                        }
                      </p>
                      {selectedCategory !== 'all' && (
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className="px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          Browse All {isSalon ? 'Services' : 'Products'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              } else {
                return (
                  /* FIXED: Products Grid - 1 product per row instead of 2 */
                  <div className="grid grid-cols-1 gap-5">
                    {productsToShow.map(product => (
                      <div key={product.id} className="bg-white rounded-xl pr-5 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                        <div className="flex items-center min-h-[120px]">
                          <div className="p-5 flex-1 flex flex-col justify-between h-full min-h-[120px]">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                                {product.featured && (
                                  <span 
                                    className="px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                                    style={{ backgroundColor: settings.featuredBadgeColor }}
                                  >
                                    Popular
                                  </span>
                                )}

                              </div>
                              
                              {/* Reserve space for description */}
                              <div className="h-10 mb-1">
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{product.description}</p>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-xl" style={{ color: settings.primaryColor }}>
                                    {currencySymbol}{product.price.toFixed(2)}
                                  </span>
                                </div>
                                
                                <button
                                  onClick={addToCart}
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                                  style={{ backgroundColor: settings.primaryColor }}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
  
                              {/* Stock info space */}
                              <div className="h-4 mt-2">
                              </div>
                            </div>
                          </div>
                          
                          {/* FIXED: Square product image */}
                          <div className="w-30 h-30 flex-shrink-0">
                            <div className="w-30 h-30 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            })()}
  
            {/* Cart/Booking Summary (Desktop) */}
            {cartCount > 0 && (
              <div className="mt-8">
                {settings.mobileCartStyle === 'badge' ? (
                  <div className="flex justify-end">
                    <div 
                      className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer"
                      style={{ backgroundColor: settings.whatsappButtonColor || settings.primaryColor }}
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
                      </svg>
                      <span 
  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
  style={{ backgroundColor: settings.cartBadgeColor }}
>
  {cartCount}
</span>
                    </div>
                  </div>
                ) : (
                  <div className="">
                    <button
                      className="w-full py-4 px-6 rounded-xl font-semibold text-white text-lg flex items-center justify-between shadow-lg hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: settings.whatsappButtonColor || settings.primaryColor }}
                    >
                      <div className="flex items-center">
                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
                        </svg>
                        <span>{cartCount} {businessData.businessType === 'SALON' ? 'services in booking' : businessData.businessType === 'SERVICES' ? 'sessions' : 'items in cart'}</span>
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
      <div className="bg-black rounded-3xl p-2 mx-auto" style={{ width: '330px' }}>
        <div className="bg-white rounded-2xl overflow-hidden h-[600px] relative" style={previewStyles}>
          
          {/* Cover Image Header - FIXED: No double background */}
          <div 
            className="relative"
            style={{
              ...getCoverImageStyle(),
              height: settings.coverHeightMobile || settings.coverHeight || '160px'
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
              className="absolute -top-6 left-4 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg bg-white"
              style={{ 
                color: settings.primaryColor,
                padding: settings.logoPadding || '0px'
              }}
            >
              {businessData.logo ? (
                <img 
                  src={businessData.logo} 
                  alt={businessData.name} 
                  className="w-full h-full rounded-full" 
                  style={{
                    objectFit: (settings.logoObjectFit || 'cover') as 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
                  }}
                />
              ) : (
                businessData.name?.charAt(0).toUpperCase() || 'S'
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
                {businessData.description || (isSalon ? 'Professional beauty services, book online' : 'Fresh food delivered to your door')}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">123 Sample Street</span>
              </div>
              
              {/* Delivery info - Hidden for salons */}
              {!isSalon && (
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>20-30 min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>Free delivery</span>
                  </div>
                </div>
              )}
              {/* Service duration for salons */}
              {isSalon && (
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>60 min</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Type Switcher - Hidden for salons */}
          {!isSalon && (
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
          )}

          {/* Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder={isSalon ? "Search services..." : "Search dishes..."}
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

          {/* Products/Services List */}
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
                          <span 
                            className="px-1.5 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
                            style={{ backgroundColor: settings.featuredBadgeColor }}
                          >
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

          {/* Cart/Booking Button - Bar Style */}
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
                  <span>{businessData.businessType === 'SALON' ? 'Book via WhatsApp' : businessData.businessType === 'SERVICES' ? 'Book session via WhatsApp' : 'Order via WhatsApp'}</span>
                </div>
                <span>{currencySymbol}{calculateCartTotal()}</span>
              </button>
            </div>
          )}

          {/* Floating Cart/Booking Badge */}
          {cartCount > 0 && settings.mobileCartStyle === 'badge' && (
            <div 
              className="absolute bottom-10 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer"
              style={{ backgroundColor: settings.whatsappButtonColor }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
              </svg>
              <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: settings.cartBadgeColor }}
                >
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