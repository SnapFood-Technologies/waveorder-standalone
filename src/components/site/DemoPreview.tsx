import { useState } from 'react'
import { 
  Search,
  Plus,
  MapPin,
  Clock,
  Package,
  Store,
  Share2,
  Info
} from 'lucide-react'
import Link from 'next/link'

const mockData = {
  businessName: "Wave Restaurant",
  businessType: "RESTAURANT",
  primaryColor: "#0D9488",
  currency: "USD"
}

const mockProducts = [
  { 
    id: 1, 
    name: 'Grilled Salmon', 
    description: 'Fresh Atlantic salmon with lemon herbs and seasonal vegetables', 
    price: 24.99, 
    featured: true, 
    category: 'mains' 
  },
  { 
    id: 2, 
    name: 'Craft Beer Selection', 
    description: 'Local brewery favorites on tap - IPA, Lager, Wheat', 
    price: 6.50, 
    category: 'drinks' 
  },
  { 
    id: 3, 
    name: 'Chocolate Lava Cake', 
    description: 'Warm chocolate cake with molten center and vanilla ice cream', 
    price: 8.99, 
    category: 'desserts' 
  }
]

const mockCategories = [
  { id: 'all', name: 'All' },
  { id: 'mains', name: 'Main Dishes' },
  { id: 'drinks', name: 'Beverages' },
  { id: 'desserts', name: 'Desserts' }
]

export default function DemoPreview() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cartCount, setCartCount] = useState(2)
  const [animatingProduct, setAnimatingProduct] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const addToCart = (productId: number) => {
    setAnimatingProduct(productId)
    setCartCount(prev => prev + 1)
    
    // Reset animation after delay
    setTimeout(() => {
      setAnimatingProduct(null)
    }, 600)
  }

  const calculateCartTotal = () => {
    const baseTotal = 42.98 + (cartCount - 2) * 8.50 // Base total + additional items
    return baseTotal.toFixed(2)
  }

  return (
    <div className="relative">
      {/* Mobile Phone Frame */}
      <div className="bg-black rounded-3xl p-2 mx-auto" style={{ width: '310px' }}>
        <div className="bg-white rounded-2xl overflow-hidden h-[600px] relative">
          
          {/* Cover Image Header */}
          <div 
            className="relative h-32"
            style={{ 
              background: `linear-gradient(135deg, ${mockData.primaryColor}CC, ${mockData.primaryColor}99)`,
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
              style={{ color: mockData.primaryColor }}
            >
              WR
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {mockData.businessName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Open
                </span>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                Fresh Seafood & Grill
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="w-3 h-3" />
                <span className="truncate">425 Ocean Avenue, Santa Monica</span>
              </div>
              
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
            </div>
          </div>

          {/* Delivery Type Switcher */}
          <div className="px-4 py-2">
            <div className="inline-flex bg-gray-100 p-1 rounded-full">
              <button 
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: mockData.primaryColor }}
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

          {/* Interactive Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder={searchTerm ? `Searching "${searchTerm}"...` : "Search dishes..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-2 transition-colors"
                style={{ 
                  '--focus-border-color': mockData.primaryColor,
                  borderColor: searchTerm ? mockData.primaryColor : '#e5e7eb'
                } as React.CSSProperties}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                >
                  <span className="text-xs text-gray-600">×</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-4 py-2">
            <div className="flex gap-1 overflow-x-auto">
              {mockCategories.slice(0, 3).map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    selectedCategory === category.id
                      ? 'border-b-2'
                      : 'text-gray-600 border-transparent hover:text-gray-800'
                  }`}
                  style={{ 
                    color: selectedCategory === category.id ? mockData.primaryColor : undefined,
                    borderBottomColor: selectedCategory === category.id ? mockData.primaryColor : 'transparent'
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
              {mockProducts
                .filter(product => 
                  searchTerm === '' || 
                  product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .filter(product => 
                  selectedCategory === 'all' || product.category === selectedCategory
                )
                .map(product => (
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
                        <span className="font-bold text-sm" style={{ color: mockData.primaryColor }}>
                          ${product.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => addToCart(product.id)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                            animatingProduct === product.id ? 'scale-125 animate-pulse' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: mockData.primaryColor }}
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
              
              {/* No results message */}
              {searchTerm && mockProducts.filter(product => 
                  product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No dishes found for "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="text-xs mt-1 hover:underline"
                    style={{ color: mockData.primaryColor }}
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cart Button - Always visible when items in cart */}
          {cartCount > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <button
                className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm flex items-center justify-between shadow-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: mockData.primaryColor }}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
                  </svg>
                  <span>Order via WhatsApp</span>
                </div>
                <span>${calculateCartTotal()}</span>
              </button>
            </div>
          )}

          {/* Floating WhatsApp Badge */}
          {cartCount > 0 && (
            <div 
              className="absolute bottom-20 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer"
              style={{ backgroundColor: mockData.primaryColor }}
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

      {/* Interactive Demo Badge */}
      <Link href="/auth/register">
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse cursor-pointer hover:bg-green-600 transition-colors">
          Try Me!
        </div>
      </Link>

    </div>
  )
}