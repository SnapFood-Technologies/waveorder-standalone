'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Instagram, 
  Facebook, 
  Twitter,
  Share2,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  MapPin,
  Clock,
  Truck,
  Store,
  UtensilsCrossed,
  Info,
  Package,
  CalendarClock,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import { signIn } from 'next-auth/react'

interface StoreReadyStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
  setupToken?: string | null
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

// Language-specific content
const storeContent = {
  en: {
    title: "Your store is ready to share!",
    subtitle: "Start taking orders right away",
    storeInfo: "Store Information",
    storeUrl: "Store URL",
    copyUrl: "Copy URL",
    copied: "✓ Copied to clipboard!",
    viewStore: "View My Store",
    shareStore: "Share Your Store",
    addToInstagram: "Add to Instagram Bio",
    instagramDesc: "Copy link for your Instagram bio",
    shareOnFacebook: "Share on Facebook",
    facebookDesc: "Post to your Facebook page",
    shareOnTwitter: "Share on Twitter",
    twitterDesc: "Tweet your store link",
    nextSteps: "Next Steps",
    storePreview: "Store Preview",
    previewDesc: "Interactive demo with sample data",
    mockDataDisclaimer: "This preview uses sample data. Click 'View Live Store' to see your actual store.",
    welcomeMessage: "Welcome to our online store! Browse our menu and order directly through WhatsApp.",
    categories: "Categories",
    sampleCategories: "Main Dishes, Beverages, Desserts",
    orderOptions: "Order Options",
    orderWhatsApp: "Order on WhatsApp",
    back: "Back",
    enterDashboard: "Enter Dashboard",
    loading: "Loading...",
    all: "All",
    delivery: "Delivery",
    pickup: "Pickup",
    dineIn: "Dine-in",
    search: "Search dishes...",
    open: "Open",
    addToCart: "Add to Cart",
    viewLiveStore: "View Live Store",
    setupTips: [
      'Add high-quality photos to your products',
      'Set up delivery zones if you offer delivery',
      'Create categories to organize your menu',
      'Test your ordering flow before going live',
      'Share your store link on social media'
    ]
  },
  sq: {
    title: "Dyqani juaj është gati për ndarje!",
    subtitle: "Filloni të merrni porosi menjëherë",
    storeInfo: "Informacioni i Dyqanit",
    storeUrl: "URL e Dyqanit",
    copyUrl: "Kopjo URL",
    copied: "✓ U kopjua në clipboard!",
    viewStore: "Shiko Dyqanin Tim",
    shareStore: "Ndaj Dyqanin Tënd",
    addToInstagram: "Shto në Bio të Instagram",
    instagramDesc: "Kopjo linkun për bio-n e Instagram",
    shareOnFacebook: "Ndaj në Facebook",
    facebookDesc: "Posto në faqen tënde të Facebook",
    shareOnTwitter: "Ndaj në Twitter", 
    twitterDesc: "Tweet linkun e dyqanit tënd",
    nextSteps: "Hapat e Ardhshëm",
    storePreview: "Pamja e Dyqanit",
    previewDesc: "Demo interaktive me të dhëna shembull",
    mockDataDisclaimer: "Kjo pamje përdor të dhëna shembull. Kliko 'Shiko Dyqanin Live' për të parë dyqanin tuaj aktual.",
    welcomeMessage: "Mirë se vini në dyqanin tonë online! Shfletoni menunë tonë dhe porosisni direkt nëpërmjet WhatsApp.",
    categories: "Kategoritë",
    sampleCategories: "Pjatat Kryesore, Pijet, Ëmbëlsirat",
    orderOptions: "Opsionet e Porositjes",
    orderWhatsApp: "Porosit në WhatsApp",
    back: "Prapa",
    enterDashboard: "Hyr në Dashboard",
    loading: "Duke u ngarkuar...",
    all: "Të gjitha",
    delivery: "Dorëzim",
    pickup: "Marrje",
    dineIn: "Në vend",
    search: "Kërko pjata...",
    open: "Hapur",
    addToCart: "Shto në Shportë",
    viewLiveStore: "Shiko Dyqanin Live",
    setupTips: [
      'Shtoni foto me cilësi të lartë në produktet tuaja',
      'Krijoni zona dorëzimi nëse ofroni dorëzim',
      'Krijoni kategori për të organizuar menunë tuaj',
      'Testoni rrjedhën e porosive para se të shkoni live',
      'Ndani linkun e dyqanit tuaj në rrjetet sociale'
    ]
  }
}

// Business type translations
const businessTypeTranslations = {
  en: {
    RESTAURANT: "Restaurant",
    CAFE: "Cafe", 
    RETAIL: "Retail Store",
    GROCERY: "Grocery Store",
    JEWELRY: "Jewelry Store",
    FLORIST: "Florist",
    OTHER: "Business"
  },
  sq: {
    RESTAURANT: "Restorant",
    CAFE: "Kafene",
    RETAIL: "Dyqan",
    GROCERY: "Ushqimore",
    JEWELRY: "Stolitë",
    FLORIST: "Lulishte",
    OTHER: "Biznes"
  }
}

// Enhanced Mobile Store Preview Component
function EnhancedMobilePreview({ data, primaryColor, content, currencySymbol }: { 
  data: SetupData, 
  primaryColor: string, 
  content: any,
  currencySymbol: string 
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cartCount, setCartCount] = useState(0)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Mock categories based on business type
  const mockCategories = [
    { id: 'all', name: content.all },
    { id: 'mains', name: content.sampleCategories?.split(', ')[0] || 'Main Dishes' },
    { id: 'drinks', name: content.sampleCategories?.split(', ')[1] || 'Beverages' },
    { id: 'desserts', name: content.sampleCategories?.split(', ')[2] || 'Desserts' }
  ]

  // Mock products based on business type with appropriate pricing
  const getMockProducts = () => {
    switch (data.businessType) {
      case 'RESTAURANT':
        return [
          { id: 1, name: 'Signature Pasta', description: 'Fresh homemade pasta with rich tomato sauce', price: 12.99, featured: true, category: 'mains' },
          { id: 2, name: 'House Wine', description: 'Premium selection from local vineyard', price: 8.50, category: 'drinks' },
          { id: 3, name: 'Tiramisu', description: 'Classic Italian dessert with coffee flavor', price: 6.99, category: 'desserts' }
        ]
      case 'CAFE':
        return [
          { id: 1, name: 'Artisan Coffee', description: 'Premium blend with perfect aroma', price: 4.50, featured: true, category: 'drinks' },
          { id: 2, name: 'Croissant', description: 'Freshly baked buttery pastry', price: 3.99, category: 'mains' },
          { id: 3, name: 'Cheesecake', description: 'Creamy New York style cheesecake', price: 5.99, category: 'desserts' }
        ]
      case 'RETAIL':
        return [
          { id: 1, name: 'Featured Item', description: 'Our most popular product this season', price: 29.99, featured: true, category: 'mains' },
          { id: 2, name: 'Gift Card', description: 'Perfect gift for any occasion', price: 25.00, category: 'drinks' },
          { id: 3, name: 'Accessories', description: 'Complete your look with our accessories', price: 15.99, category: 'desserts' }
        ]
      default:
        return [
          { id: 1, name: 'Popular Item', description: 'Customer favorite with great reviews', price: 19.99, featured: true, category: 'mains' },
          { id: 2, name: 'Daily Special', description: 'Today\'s special offer', price: 12.50, category: 'drinks' },
          { id: 3, name: 'Premium Option', description: 'High-quality premium choice', price: 24.99, category: 'desserts' }
        ]
    }
  }

  const mockProducts = getMockProducts()

  const getBusinessTypeDisplay = () => {
    // @ts-ignore
    const businessTypes = businessTypeTranslations[data.language || 'en' as keyof typeof businessTypeTranslations]
    const businessType = data.businessType || 'OTHER'
    return businessTypes[businessType as keyof typeof businessTypes] || businessTypes.OTHER
  }

  const addToCart = (product: any) => {
    setCartCount(prev => prev + 1)
    setShowProductModal(false)
  }

  const openProductModal = (product: any) => {
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  // Calculate total with proper currency
  const calculateCartTotal = () => {
    const baseTotal = mockProducts.slice(0, cartCount).reduce((sum, product) => sum + product.price, 0)
    return baseTotal.toFixed(2)
  }

  return (
    <div className="bg-gray-100 rounded-xl p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {content.storePreview}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {content.previewDesc}
        </p>
        
        {/* Mock Data Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              {content.mockDataDisclaimer}
            </p>
          </div>
        </div>
      </div>
      
      {/* Mobile Phone Frame */}
      <div className="bg-black rounded-3xl p-2 mx-auto" style={{ width: '310px' }}>
        <div className="bg-white rounded-2xl overflow-hidden h-[600px] relative">
          
          {/* Cover Image Header */}
          <div 
            className="relative h-32"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}CC, ${primaryColor}99)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Header Icons */}
            <div className="absolute top-2 right-2 flex gap-2">
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
              style={{ color: primaryColor }}
            >
              {data.businessName?.charAt(0) || 'S'}
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {data.businessName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {content.open}
                </span>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {getBusinessTypeDisplay()}
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
                style={{ backgroundColor: primaryColor }}
              >
                <Package className="w-3 h-3 mr-1 inline" />
                {content.delivery}
              </button>
              <button className="px-3 py-1 rounded-full text-xs font-medium text-gray-600">
                <Store className="w-3 h-3 mr-1 inline" />
                {content.pickup}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder={content.search}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs outline-none text-gray-900 placeholder:text-gray-500"
                style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-4 py-2">
            <div className="flex gap-1 overflow-x-auto">
              {mockCategories.slice(0, 3).map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 text-xs font-medium whitespace-nowrap border-b-2 ${
                    selectedCategory === category.id
                      ? 'border-b-2'
                      : 'text-gray-600 border-transparent'
                  }`}
                  style={{ 
                    color: selectedCategory === category.id ? primaryColor : undefined,
                    borderBottomColor: selectedCategory === category.id ? primaryColor : 'transparent'
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
              {mockProducts.slice(0, 3).map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                        <span className="font-bold text-sm" style={{ color: primaryColor }}>
                          {currencySymbol}{product.price.toFixed(2)}
                        </span>
                        <button
                          onClick={() => openProductModal(product)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-16 h-16 ml-3 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Button */}
          {cartCount > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <button
                className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm flex items-center justify-between shadow-lg"
                style={{ backgroundColor: primaryColor }}
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

          {/* Floating WhatsApp Badge */}
          {cartCount > 0 && (
            <div 
              className="absolute bottom-20 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
              </svg>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {cartCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Actions */}
      <div className="mt-4 space-y-3">
        <button
          onClick={() => window.open(`https://waveorder.app/${data.storeSlug || 'demo'}`, '_blank')}
          className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {content.viewLiveStore}
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCartCount(prev => prev + 1)}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </button>
          <button
            onClick={() => setCartCount(0)}
            className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Cart
          </button>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedProduct.name}</h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">{selectedProduct.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {currencySymbol}{selectedProduct.price.toFixed(2)}
                </span>
              </div>
              
              <button
                onClick={() => addToCart(selectedProduct)}
                className="w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                {content.addToCart}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StoreReadyStep({ data, onComplete, onBack, setupToken }: StoreReadyStepProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const selectedLanguage = data.language || 'en'
  const content = storeContent[selectedLanguage as keyof typeof storeContent]
  const businessTypes = businessTypeTranslations[selectedLanguage as keyof typeof businessTypeTranslations]
   // @ts-ignore
  const primaryColor = data.primaryColor || '#0D9488'
  const currencySymbol = getCurrencySymbol(data.currency || 'USD')

  const storeUrl = `https://waveorder.app/${data.storeSlug}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareOnSocial = (platform: string) => {
    const text = selectedLanguage === 'sq' 
      ? `Shikoni dyqanin tim online: ${data.businessName}`
      : `Check out my online store: ${data.businessName}`
    const url = storeUrl
    
    const shareUrls = {
      instagram: `https://www.instagram.com/`, // Instagram doesn't have direct sharing URL
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    }
    
    if (platform === 'instagram') {
      // For Instagram, we just copy the URL since they don't have direct sharing
      copyToClipboard()
    } else {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400')
    }
  }

  const handleViewStore = () => {
    window.open(storeUrl, '_blank')
  }

  const handleEnterDashboard = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken })
      })
  
      if (response.ok) {
        const data = await response.json()
        
        // Auto-login for token users
        if (data.autoLogin) {
          const result = await signIn('credentials', { 
            setupToken: setupToken,
            email: data.email,
            redirect: false 
          })
          
          if (result?.error) {
            console.error('Auto-login failed:', result.error)
          }

          if (result?.ok) {
            // Now clear the token
            await fetch('/api/setup/clear-token', {
              method: 'POST',
              body: JSON.stringify({ setupToken })
            })
          }
        }
        
        // Redirect to dashboard
        window.location.href = data.redirectUrl || `/admin/stores/${data.business.id}/dashboard`
      } else {
        console.error('Failed to complete setup')
      }
    } catch (error) {
      console.error('Error completing setup:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get business type display name
  const getBusinessTypeDisplay = () => {
    const businessType = data.businessType || 'OTHER'
    return businessTypes[businessType as keyof typeof businessTypes] || businessTypes.OTHER
  }

  // Get delivery methods display
  const getDeliveryMethodsDisplay = () => {
    const methods = []
    if (data.deliveryMethods?.delivery) {
      methods.push(selectedLanguage === 'sq' ? 'Dorëzim' : 'Delivery')
    }
    if (data.deliveryMethods?.pickup) {
      methods.push(selectedLanguage === 'sq' ? 'Marrje' : 'Pickup')
    }
    if (data.deliveryMethods?.dineIn) {
      methods.push(selectedLanguage === 'sq' ? 'Në vend' : 'Dine-in')
    }
    return methods.join(', ') || (selectedLanguage === 'sq' ? 'Marrje' : 'Pickup')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          {content.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-2">
          {content.subtitle}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Store Information */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.storeInfo}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">{content.storeUrl}</label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1 px-3 py-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs sm:text-sm break-all">
                      {storeUrl}
                    </div>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center sm:justify-start min-w-0"
                    >
                      <Copy className="w-4 h-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">{content.copyUrl}</span>
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-2">{content.copied}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleViewStore}
                    className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {content.viewStore}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Share2 className="w-5 h-5 mr-2 text-teal-600" />
                {content.shareStore}
              </h3>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => shareOnSocial('instagram')}
                  className="w-full flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Instagram className="w-5 h-5 mr-3 text-pink-600 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{content.addToInstagram}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{content.instagramDesc}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => shareOnSocial('facebook')}
                  className="w-full flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Facebook className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{content.shareOnFacebook}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{content.facebookDesc}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => shareOnSocial('twitter')}
                  className="w-full flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Twitter className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0" />
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">{content.shareOnTwitter}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{content.twitterDesc}</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.nextSteps}</h3>
              <ul className="space-y-2 sm:space-y-3">
                {content.setupTips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-600">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enhanced Live Preview */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-8">
            <EnhancedMobilePreview 
              data={data}
              primaryColor={primaryColor}
              content={content}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {content.back}
          </button>
          
          <button
            onClick={handleEnterDashboard}
            disabled={loading}
            className="flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
          >
            {loading ? content.loading : content.enterDashboard}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    )
  }