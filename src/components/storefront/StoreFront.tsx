'use client'

import React, { useState } from 'react'
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  MapPin, 
  Clock, 
  Heart,
  Share2,
  Truck,
  Store,
  UtensilsCrossed,
  Phone,
  Info,
  Package,
  AlertCircle
} from 'lucide-react'
import { getStorefrontTranslations } from '@/utils/storefront-translations'

interface StoreData {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  coverImage?: string
  phone?: string
  email?: string
  address?: string
  website?: string
  whatsappNumber: string
  businessType: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  currency: string
  language: string
  deliveryFee: number
  minimumOrder: number
  deliveryRadius: number
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled: boolean
  estimatedDeliveryTime?: string
  paymentMethods: string[]
  paymentInstructions?: string
  greetingMessage?: string
  orderNumberFormat: string
  categories: Category[]
  isOpen: boolean
  nextOpenTime?: string
}

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  sortOrder: number
  products: Product[]
}

interface Product {
  id: string
  name: string
  description?: string
  images: string[]
  price: number
  originalPrice?: number
  sku?: string
  stock: number
  featured: boolean
  variants: ProductVariant[]
  modifiers: ProductModifier[]
}

interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  sku?: string
}

interface ProductModifier {
  id: string
  name: string
  price: number
  required: boolean
}

interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  modifiers: ProductModifier[]
  totalPrice: number
}

interface CustomerInfo {
  name: string
  phone: string
  email: string
  address: string
  address2: string
  deliveryTime: string
  specialInstructions: string
}

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    default: return '$'
  }
}

export default function StoreFront({ storeData }: { storeData: StoreData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartModal, setShowCartModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<ProductModifier[]>([])
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'dineIn'>('delivery')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    address2: '',
    deliveryTime: 'asap',
    specialInstructions: ''
  })
  const [isOrderLoading, setIsOrderLoading] = useState(false)

  const currencySymbol = getCurrencySymbol(storeData.currency)
  const translations = getStorefrontTranslations(storeData.language)
  
  // Use WaveOrder default color if no primary color is set
//   const primaryColor = storeData.primaryColor || '#0D9488' // teal-600
  const primaryColor = '#0D9488' // teal-600

  // Calculate cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const cartDeliveryFee = deliveryType === 'delivery' ? storeData.deliveryFee : 0
  const cartTotal = cartSubtotal + cartDeliveryFee
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Check minimum order requirement
  const meetsMinimumOrder = cartSubtotal >= storeData.minimumOrder || deliveryType !== 'delivery'

  // Filter products
  const filteredProducts = storeData.categories.flatMap(category => 
    category.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory
      return matchesSearch && matchesCategory
    }).map(product => ({ ...product, categoryName: category.name }))
  )

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    setSelectedVariant(product.variants.length > 0 ? product.variants[0] : null)
    setSelectedModifiers([])
    setShowProductModal(true)
  }

  const addToCart = (product: Product, variant?: ProductVariant, modifiers: ProductModifier[] = []) => {
    const basePrice = variant?.price || product.price
    const modifierPrice = modifiers.reduce((sum, mod) => sum + mod.price, 0)
    const totalPrice = basePrice + modifierPrice

    const cartItem: CartItem = {
      id: `${product.id}-${variant?.id || 'default'}-${modifiers.map(m => m.id).join(',')}`,
      productId: product.id,
      variantId: variant?.id,
      name: `${product.name}${variant ? ` (${variant.name})` : ''}`,
      price: basePrice,
      quantity: 1,
      modifiers,
      totalPrice
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === cartItem.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          totalPrice: (updated[existingIndex].quantity + 1) * (basePrice + modifierPrice)
        }
        return updated
      }
      return [...prev, cartItem]
    })

    setShowProductModal(false)
  }

  const updateCartItemQuantity = (itemId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          if (newQuantity === 0) return null
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * (item.price + item.modifiers.reduce((sum, mod) => sum + mod.price, 0))
          }
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const submitOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please fill in required customer information')
      return
    }

    if (!meetsMinimumOrder) {
      alert(`${translations.minimumOrder} ${currencySymbol}${storeData.minimumOrder.toFixed(2)} ${translations.forDelivery}`)
      return
    }

    setIsOrderLoading(true)

    try {
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        deliveryAddress: `${customerInfo.address} ${customerInfo.address2}`.trim(),
        deliveryType,
        deliveryTime: customerInfo.deliveryTime === 'asap' ? null : customerInfo.deliveryTime,
        paymentMethod: storeData.paymentMethods[0] || 'CASH',
        specialInstructions: customerInfo.specialInstructions,
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers
        })),
        subtotal: cartSubtotal,
        deliveryFee: cartDeliveryFee,
        tax: 0,
        discount: 0,
        total: cartTotal
      }

      const response = await fetch(`/api/storefront/${storeData.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        window.open(result.whatsappUrl, '_blank')
        setCart([])
        setShowCartModal(false)
        alert('Order sent to WhatsApp!')
      } else {
        alert('Failed to create order. Please try again.')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setIsOrderLoading(false)
    }
  }

  const getDeliveryOptions = () => {
    const options = []
    if (storeData.deliveryEnabled) options.push({ key: 'delivery', label: translations.delivery, icon: Truck })
    if (storeData.pickupEnabled) options.push({ key: 'pickup', label: translations.pickup, icon: Store })
    if (storeData.dineInEnabled) options.push({ key: 'dineIn', label: translations.dineIn, icon: UtensilsCrossed })
    return options
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: storeData.fontFamily }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            {storeData.logo ? (
              <img src={storeData.logo} alt={storeData.name} className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {storeData.name.charAt(0)}
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{storeData.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  storeData.isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {storeData.isOpen ? translations.open : translations.closed}
                </span>
              </div>
              {storeData.description && (
                <p className="text-gray-600 mt-1 hidden sm:block">{storeData.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                {storeData.address && (
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {storeData.address}
                  </span>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="hidden md:flex items-center space-x-2">
              {storeData.phone && (
                <a href={`tel:${storeData.phone}`} className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
                  <Phone className="w-5 h-5" />
                </a>
              )}
              <button className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Banner */}
      {storeData.coverImage && (
        <div className="h-32 md:h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${storeData.coverImage})` }}>
          <div className="h-full bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-xl md:text-3xl font-bold">{storeData.greetingMessage || translations.welcome}</h2>
              {storeData.estimatedDeliveryTime && (
                <p className="text-sm md:text-base mt-2 flex items-center justify-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {translations.deliveryIn} {storeData.estimatedDeliveryTime}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Menu */}
          <div className="lg:col-span-2">
            {/* Search & Filter */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={translations.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                >
                  <option value="all">{translations.allCategories}</option>
                  {storeData.categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  selectedCategory === 'all'
                    ? 'text-white shadow-sm'
                    : 'text-gray-700 hover:bg-white'
                }`}
                style={{ 
                  backgroundColor: selectedCategory === 'all' ? primaryColor : 'transparent'
                }}
              >
                {translations.all}
              </button>
              {storeData.categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    selectedCategory === category.id
                      ? 'text-white shadow-sm'
                      : 'text-gray-700 hover:bg-white'
                  }`}
                  style={{ 
                    backgroundColor: selectedCategory === category.id ? primaryColor : 'transparent'
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Products */}
            <div className="space-y-8">
              {selectedCategory === 'all' ? (
                storeData.categories.length === 0 ? (
                  <EmptyState 
                    type="no-categories"
                    primaryColor={primaryColor}
                    translations={translations}
                  />
                ) : storeData.categories.every(category => category.products.length === 0) ? (
                  <EmptyState 
                    type="no-products"
                    primaryColor={primaryColor}
                    translations={translations}
                  />
                ) : (
                  storeData.categories.map(category => (
                    <div key={category.id}>
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">{category.name}</h2>
                      {category.products.length === 0 ? (
                        <EmptyState 
                          type="category-empty"
                          primaryColor={primaryColor}
                          translations={translations}
                          onShowAll={() => setSelectedCategory('all')}
                        />
                      ) : (
                        <div className="space-y-4">
                          {category.products.map(product => (
                            <ProductCard 
                              key={product.id} 
                              product={product} 
                              onOpenModal={openProductModal}
                              primaryColor={primaryColor}
                              currencySymbol={currencySymbol}
                              translations={translations}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                filteredProducts.length === 0 ? (
                  searchTerm ? (
                    <EmptyState 
                      type="search-empty"
                      primaryColor={primaryColor}
                      translations={translations}
                      onClearSearch={() => setSearchTerm('')}
                      onShowAll={() => setSelectedCategory('all')}
                    />
                  ) : (
                    <EmptyState 
                      type="category-empty"
                      primaryColor={primaryColor}
                      translations={translations}
                      onShowAll={() => setSelectedCategory('all')}
                    />
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onOpenModal={openProductModal}
                        primaryColor={primaryColor}
                        currencySymbol={currencySymbol}
                        translations={translations}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Side - Order Panel (Desktop) */}
          <div className="hidden lg:block">
            <OrderPanel 
              storeData={storeData}
              cart={cart}
              deliveryType={deliveryType}
              setDeliveryType={setDeliveryType}
              customerInfo={customerInfo}
              setCustomerInfo={setCustomerInfo}
              cartSubtotal={cartSubtotal}
              cartDeliveryFee={cartDeliveryFee}
              cartTotal={cartTotal}
              meetsMinimumOrder={meetsMinimumOrder}
              currencySymbol={currencySymbol}
              updateCartItemQuantity={updateCartItemQuantity}
              removeFromCart={removeFromCart}
              submitOrder={submitOrder}
              isOrderLoading={isOrderLoading}
              deliveryOptions={getDeliveryOptions()}
              primaryColor={primaryColor}
              translations={translations}
            />
          </div>
        </div>
      </div>

      {/* Mobile Cart Bar */}
      {cartItemCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <button
            onClick={() => setShowCartModal(true)}
            className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              <span>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
            </div>
            <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Mobile Cart Modal */}
      {showCartModal && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] rounded-t-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{translations.yourOrder}</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
              <OrderPanel 
                storeData={storeData}
                cart={cart}
                deliveryType={deliveryType}
                setDeliveryType={setDeliveryType}
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                cartSubtotal={cartSubtotal}
                cartDeliveryFee={cartDeliveryFee}
                cartTotal={cartTotal}
                meetsMinimumOrder={meetsMinimumOrder}
                currencySymbol={currencySymbol}
                updateCartItemQuantity={updateCartItemQuantity}
                removeFromCart={removeFromCart}
                submitOrder={submitOrder}
                isOrderLoading={isOrderLoading}
                deliveryOptions={getDeliveryOptions()}
                primaryColor={primaryColor}
                translations={translations}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
          selectedModifiers={selectedModifiers}
          setSelectedModifiers={setSelectedModifiers}
          onAddToCart={addToCart}
          onClose={() => setShowProductModal(false)}
          currencySymbol={currencySymbol}
          primaryColor={primaryColor}
          translations={translations}
        />
      )}

      {/* Powered by WaveOrder Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {translations.poweredBy}{' '}
              <a 
                href="https://waveorder.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                WaveOrder
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Empty State Component
function EmptyState({ 
  type, 
  primaryColor, 
  translations,
  onClearSearch,
  onShowAll
}: { 
  type: 'no-categories' | 'no-products' | 'category-empty' | 'search-empty'
  primaryColor: string
  translations: any
  onClearSearch?: () => void
  onShowAll?: () => void
}) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-categories':
        return {
          icon: Package,
          title: translations.comingSoon,
          description: translations.checkBackLater,
          showActions: false
        }
      case 'no-products':
        return {
          icon: Package,
          title: translations.comingSoon,
          description: translations.checkBackLater,
          showActions: false
        }
      case 'category-empty':
        return {
          icon: Package,
          title: translations.noProductsInCategory,
          description: translations.noProductsInCategoryDescription,
          showActions: true,
          actionText: translations.browseAllProducts,
          actionCallback: onShowAll
        }
      case 'search-empty':
        return {
          icon: AlertCircle,
          title: translations.noProductsFound,
          description: translations.noProductsFoundDescription,
          showActions: true,
          actionText: translations.tryDifferentSearch,
          actionCallback: onClearSearch,
          secondaryActionText: translations.browseAllProducts,
          secondaryActionCallback: onShowAll
        }
      default:
        return {
          icon: Package,
          title: translations.comingSoon,
          description: translations.checkBackLater,
          showActions: false
        }
    }
  }

  const content = getEmptyStateContent()
  const IconComponent = content.icon

  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <IconComponent 
            className="w-10 h-10"
            style={{ color: primaryColor }}
          />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {content.title}
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {content.description}
        </p>
        
        {content.showActions && (
          <div className="space-y-3">
            {content.actionCallback && (
              <button
                onClick={content.actionCallback}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                {content.actionText}
              </button>
            )}
            
            {content.secondaryActionCallback && (
              <button
                onClick={content.secondaryActionCallback}
                className="block w-full sm:w-auto px-6 py-3 border-2 rounded-lg font-medium hover:bg-gray-50 transition-colors mx-auto"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {content.secondaryActionText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Product Card Component
function ProductCard({ 
  product, 
  onOpenModal, 
  primaryColor, 
  currencySymbol,
  translations
}: { 
  product: Product
  onOpenModal: (product: Product) => void
  primaryColor: string
  currencySymbol: string
  translations: any
}) {
  const hasVariantsOrModifiers = product.variants.length > 0 || product.modifiers.length > 0

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {product.images.length > 0 && (
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover flex-shrink-0"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base md:text-lg">{product.name}</h3>
              {product.description && (
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>
              )}
              
              <div className="flex items-center space-x-2 mt-2">
                <span className="font-semibold text-lg" style={{ color: primaryColor }}>
                  {currencySymbol}{product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-gray-500 line-through text-sm">
                    {currencySymbol}{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-orange-600 text-xs mt-1">{translations.onlyLeft} {product.stock} {translations.left}</p>
              )}
              {product.stock === 0 && (
                <p className="text-red-600 text-xs mt-1">{translations.outOfStock}</p>
              )}
            </div>
            
            <button
              onClick={() => onOpenModal(product)}
              disabled={product.stock === 0}
              className="ml-4 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              {hasVariantsOrModifiers ? translations.customize : translations.add}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Modal Component
function ProductModal({
  product,
  selectedVariant,
  setSelectedVariant,
  selectedModifiers,
  setSelectedModifiers,
  onAddToCart,
  onClose,
  currencySymbol,
  primaryColor,
  translations
}: {
  product: Product
  selectedVariant: ProductVariant | null
  setSelectedVariant: (variant: ProductVariant | null) => void
  selectedModifiers: ProductModifier[]
  setSelectedModifiers: (modifiers: ProductModifier[]) => void
  onAddToCart: (product: Product, variant?: ProductVariant, modifiers?: ProductModifier[]) => void
  onClose: () => void
  currencySymbol: string
  primaryColor: string
  translations: any
}) {
  const [quantity, setQuantity] = useState(1)

  const basePrice = selectedVariant?.price || product.price
  const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
  const totalPrice = (basePrice + modifierPrice) * quantity

  const toggleModifier = (modifier: ProductModifier) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.id === modifier.id)
      if (exists) {
        return prev.filter(m => m.id !== modifier.id)
      } else {
        return [...prev, modifier]
      }
    })
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, selectedVariant || undefined, selectedModifiers)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {product.images.length > 0 && (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            
            {product.description && (
              <p className="text-gray-600 mb-4">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">{translations.chooseSize}</h3>
                <div className="space-y-2">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{variant.name}</span>
                        <span className="font-semibold">
                          {currencySymbol}{variant.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers */}
            {product.modifiers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">{translations.addExtras}</h3>
                <div className="space-y-2">
                  {product.modifiers.map(modifier => (
                    <button
                      key={modifier.id}
                      onClick={() => toggleModifier(modifier)}
                      className={`w-full p-3 border-2 rounded-lg text-left transition-colors ${
                        selectedModifiers.find(m => m.id === modifier.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{modifier.name}</span>
                          {modifier.required && (
                            <span className="text-red-500 text-sm ml-1">{translations.required}</span>
                          )}
                        </div>
                        <span className="font-semibold">
                          +{currencySymbol}{modifier.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">{translations.quantity}</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">{translations.total}</span>
            <span className="text-xl font-bold" style={{ color: primaryColor }}>
              {currencySymbol}{totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            {translations.addToCart}
          </button>
        </div>
      </div>
    </div>
  )
}

// Order Panel Component
function OrderPanel({
  storeData,
  cart,
  deliveryType,
  setDeliveryType,
  customerInfo,
  setCustomerInfo,
  cartSubtotal,
  cartDeliveryFee,
  cartTotal,
  meetsMinimumOrder,
  currencySymbol,
  updateCartItemQuantity,
  removeFromCart,
  submitOrder,
  isOrderLoading,
  deliveryOptions,
  primaryColor,
  translations,
  isMobile = false
}: {
  storeData: StoreData
  cart: CartItem[]
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  setDeliveryType: (type: 'delivery' | 'pickup' | 'dineIn') => void
  customerInfo: CustomerInfo
  setCustomerInfo: (info: CustomerInfo) => void
  cartSubtotal: number
  cartDeliveryFee: number
  cartTotal: number
  meetsMinimumOrder: boolean
  currencySymbol: string
  updateCartItemQuantity: (itemId: string, change: number) => void
  removeFromCart: (itemId: string) => void
  submitOrder: () => void
  isOrderLoading: boolean
  deliveryOptions: Array<{ key: string; label: string; icon: any }>
  primaryColor: string
  translations: any
  isMobile?: boolean
}) {
  return (
    <div className={`${isMobile ? 'p-4' : 'sticky top-6'}`}>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">{translations.orderDetails}</h2>
        
        {/* Delivery Type Toggle */}
        {deliveryOptions.length > 1 && (
          <div className="mb-6">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {deliveryOptions.map(option => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.key}
                    onClick={() => setDeliveryType(option.key as any)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center ${
                      deliveryType === option.key
                        ? 'text-white shadow-sm'
                        : 'text-gray-700 hover:bg-white'
                    }`}
                    style={{ 
                      backgroundColor: deliveryType === option.key ? primaryColor : 'transparent'
                    }}
                  >
                    <IconComponent className="w-4 h-4 mr-1" />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{translations.name} *</label>
            <input
              type="text"
              required
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              placeholder="Your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{translations.whatsappNumber} *</label>
            <input
              type="tel"
              required
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{translations.email}</label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              placeholder="your.email@example.com"
            />
          </div>

          {deliveryType === 'delivery' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{translations.addressLine1} *</label>
                <input
                  type="text"
                  required
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  placeholder={translations.streetAddress}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{translations.addressLine2}</label>
                <input
                  type="text"
                  value={customerInfo.address2}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                  placeholder={translations.apartment}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {deliveryType === 'delivery' ? translations.deliveryTime : deliveryType === 'pickup' ? translations.pickupTime : translations.arrivalTime}
            </label>
            <select
              value={customerInfo.deliveryTime}
              onChange={(e) => setCustomerInfo({ ...customerInfo, deliveryTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            >
              <option value="asap">{translations.asap} ({storeData.estimatedDeliveryTime || '30-45 ' + translations.mins})</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="1:30 PM">1:30 PM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="2:30 PM">2:30 PM</option>
              <option value="3:00 PM">3:00 PM</option>
            </select>
          </div>
        </div>

        {/* Cart Items */}
        {cart.length > 0 && (
          <div className="border-t pt-4 mb-6">
            <h3 className="font-semibold mb-3">{translations.cartItems}</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-gray-600">
                        + {item.modifiers.map(m => m.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm font-semibold">{currencySymbol}{item.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => updateCartItemQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItemQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 text-red-600 ml-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        {cart.length > 0 && (
          <div className="border-t pt-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{translations.subtotal}</span>
                <span>{currencySymbol}{cartSubtotal.toFixed(2)}</span>
              </div>
              {cartDeliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>{translations.deliveryFee}</span>
                  <span>{currencySymbol}{cartDeliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>{translations.total}</span>
                <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Minimum Order Warning */}
        {!meetsMinimumOrder && deliveryType === 'delivery' && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
            <p className="text-yellow-800 text-sm">
              {translations.minimumOrder} {currencySymbol}{storeData.minimumOrder.toFixed(2)} {translations.forDelivery} 
              {translations.moreTo.replace('Add', '').replace('more', '')} {currencySymbol}{(storeData.minimumOrder - cartSubtotal).toFixed(2)} {translations.moreTo.split('Add')[1]}
            </p>
          </div>
        )}

        {/* Special Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">{translations.specialInstructions}</label>
          <textarea
            value={customerInfo.specialInstructions}
            onChange={(e) => setCustomerInfo({ ...customerInfo, specialInstructions: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
            rows={3}
            placeholder={translations.anySpecialRequests}
          />
        </div>

        {/* Payment Info */}
        {storeData.paymentInstructions && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 mr-2" />
              <p className="text-sm text-gray-600">{storeData.paymentInstructions}</p>
            </div>
          </div>
        )}

        {/* Order Button */}
        <button
          onClick={submitOrder}
          disabled={isOrderLoading || cart.length === 0 || !meetsMinimumOrder || !customerInfo.name || !customerInfo.phone}
          className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          {isOrderLoading ? translations.placingOrder : `${translations.orderViaWhatsapp} - ${currencySymbol}${cartTotal.toFixed(2)}`}
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          {translations.clickingButton}
        </p>
      </div>
    </div>
  )
}