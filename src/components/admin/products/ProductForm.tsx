// src/components/admin/products/ProductForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Package,
  Star,
  Eye,
  EyeOff,
  AlertTriangle,
  Hash,
  Settings,
  BarChart3,
  Info,
  Lightbulb,
  CheckCircle,
  Tag,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'
import { useImpersonation } from '@/lib/impersonation'
import toast from 'react-hot-toast'

interface ProductFormProps {
  businessId: string
  productId: string // 'new' for creating new product
}

interface ProductVariant {
  id?: string
  name: string
  price: number
  stock: number
  sku?: string
  image?: string
}

interface ProductModifier {
  id?: string
  name: string
  price: number
  required: boolean
}

interface Category {
  id: string
  name: string
  parentId?: string | null
  parent?: {
    id: string
    name: string
  } | null
}

interface Brand {
  id: string
  name: string
}

interface Collection {
  id: string
  name: string
}

interface Group {
  id: string
  name: string
}

interface Business {
  currency: string
  language?: string
  storefrontLanguage?: string
  brandsFeatureEnabled?: boolean
  collectionsFeatureEnabled?: boolean
  groupsFeatureEnabled?: boolean
}

interface ProductForm {
  name: string
  nameAl?: string
  nameEl?: string
  description: string
  descriptionAl?: string
  descriptionEl?: string
  images: string[]
  price: number
  originalPrice?: number
  saleStartDate?: string
  saleEndDate?: string
  sku: string
  stock: number
  trackInventory: boolean
  lowStockAlert?: number
  enableLowStockNotification: boolean
  isActive: boolean
  featured: boolean
  categoryId: string
  brandId?: string
  collectionIds: string[]
  groupIds: string[]
  variants: ProductVariant[]
  modifiers: ProductModifier[]
  metaTitle: string
  metaDescription: string
}

// Searchable Category Select Component
function SearchableCategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Select category'
}: {
  categories: Category[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  // Get display name for a category (with parent if subcategory)
  const getCategoryDisplayName = (category: Category) => {
    if (category.parentId) {
      const parent = categories.find(c => c.id === category.parentId)
      if (parent) {
        return `${parent.name} > ${category.name}`
      }
    }
    return category.name
  }

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => {
    const displayName = getCategoryDisplayName(category).toLowerCase()
    return displayName.includes(searchTerm.toLowerCase())
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedCategory = value ? categories.find(c => c.id === value) : null

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-left flex items-center justify-between bg-white hover:border-gray-400 transition-colors"
      >
        <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCategory ? getCategoryDisplayName(selectedCategory) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-56">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange(category.id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    value === category.id ? 'bg-teal-50 text-teal-900 font-medium' : 'text-gray-900'
                  }`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))
            ) : searchTerm ? (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No categories found for "{searchTerm}"
              </div>
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No categories available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ProductForm({ businessId, productId }: ProductFormProps) {
  const { addParams } = useImpersonation(businessId)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = productId !== 'new'
  const { isPro } = useSubscription()
  
  const [form, setForm] = useState<ProductForm>({
    name: '',
    nameAl: '',
    description: '',
    descriptionAl: '',
    images: [],
    price: 0,
    originalPrice: undefined,
    sku: '',
    stock: 0,
    trackInventory: true,
    lowStockAlert: undefined,
    enableLowStockNotification: false,
    isActive: true,
    featured: false,
    categoryId: '',
    brandId: undefined,
    collectionIds: [],
    groupIds: [],
    variants: [],
    modifiers: [],
    metaTitle: '',
    metaDescription: ''
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [business, setBusiness] = useState<Business>({ 
    currency: 'USD', 
    language: 'en', 
    storefrontLanguage: 'en',
    brandsFeatureEnabled: false,
    collectionsFeatureEnabled: false,
    groupsFeatureEnabled: false
  })
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'al' | 'el'>('en')
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  const [limitError, setLimitError] = useState<{ currentCount: number; limit: number; plan: string } | null>(null)

  const [successMessage, setSuccessMessage] = useState<{
    type: 'create' | 'update'
    productName: string
  } | null>(null)

  useEffect(() => {
    fetchBusinessData()
    fetchCategories()
    fetchBrands()
    fetchCollections()
    fetchGroups()
    if (isEditing) {
      fetchProduct()
    }
  }, [businessId, productId])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness({ 
          currency: data.business.currency,
          language: data.business.language || 'en',
          storefrontLanguage: data.business.storefrontLanguage || data.business.language || 'en',
          brandsFeatureEnabled: data.business.brandsFeatureEnabled || false,
          collectionsFeatureEnabled: data.business.collectionsFeatureEnabled || false,
          groupsFeatureEnabled: data.business.groupsFeatureEnabled || false
        })
        // Set default language based on business language
        if (data.business.language === 'sq' || data.business.storefrontLanguage === 'sq' || 
            data.business.language === 'el' || data.business.storefrontLanguage === 'el') {
          setActiveLanguage('en') // Start with English, but show multi-language fields
        }
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
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/brands`)
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands)
      }
    } catch (error) {
      // Feature might not be enabled, silently fail
      console.log('Brands feature not available or not enabled')
    }
  }

  const fetchCollections = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/collections`)
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections)
      }
    } catch (error) {
      // Feature might not be enabled, silently fail
      console.log('Collections feature not available or not enabled')
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/groups`)
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    } catch (error) {
      // Feature might not be enabled, silently fail
      console.log('Groups feature not available or not enabled')
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        // Extract image from variant metadata
        const variantsWithImage = data.product.variants?.map((variant: any) => {
          const metadata = variant.metadata as any
          return {
            ...variant,
            image: metadata?.image || undefined
          }
        }) || []
        
        // Format dates for input fields (YYYY-MM-DDTHH:mm format)
        const formatDateForInput = (date: Date | string | null | undefined): string | undefined => {
          if (!date) return undefined
          const d = typeof date === 'string' ? new Date(date) : date
          if (isNaN(d.getTime())) return undefined
          // Format as YYYY-MM-DDTHH:mm for datetime-local input
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          const hours = String(d.getHours()).padStart(2, '0')
          const minutes = String(d.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${minutes}`
        }

        setForm({
          ...data.product,
          nameAl: data.product.nameAl || '',
          descriptionAl: data.product.descriptionAl || '',
          variants: variantsWithImage,
          originalPrice: data.product.originalPrice || undefined,
          saleStartDate: formatDateForInput(data.product.saleStartDate),
          saleEndDate: formatDateForInput(data.product.saleEndDate),
          lowStockAlert: data.product.lowStockAlert || undefined,
          brandId: data.product.brandId || undefined,
          collectionIds: data.product.collectionIds || [],
          groupIds: data.product.groupIds || []
        })
      }
    } catch (error) {
      console.error('Error fetching product:', error)
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

    const getCurrencySymbol = () => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
    }
    return currencySymbols[business.currency] || business.currency
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('folder', 'products')

        const response = await fetch(`/api/admin/stores/${businessId}/upload`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          setForm(prev => ({
            ...prev,
            images: [...prev.images, data.imageUrl]
          }))
        } else {
          const errorData = await response.json()
          console.error('Upload failed:', errorData.message)
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= form.images.length) return
    setForm(prev => {
      const newImages = [...prev.images]
      const [moved] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, moved)
      return { ...prev, images: newImages }
    })
  }

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: '', price: 0, stock: 0, sku: '', image: undefined }
      ]
    }))
  }

  const handleVariantImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'products')

      const response = await fetch(`/api/admin/stores/${businessId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        updateVariant(index, 'image', data.imageUrl)
      } else {
        const errorData = await response.json()
        console.error('Upload failed:', errorData.message)
      }
    } catch (error) {
      console.error('Error uploading variant image:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const removeVariantImage = (index: number) => {
    updateVariant(index, 'image', undefined)
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }))
  }

  const removeVariant = (index: number) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  const moveVariant = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= form.variants.length) return
    setForm(prev => {
      const newVariants = [...prev.variants]
      const [moved] = newVariants.splice(fromIndex, 1)
      newVariants.splice(toIndex, 0, moved)
      return { ...prev, variants: newVariants }
    })
  }

  const addModifier = () => {
    setForm(prev => ({
      ...prev,
      modifiers: [
        ...prev.modifiers,
        { name: '', price: 0, required: false }
      ]
    }))
  }

  const updateModifier = (index: number, field: keyof ProductModifier, value: any) => {
    setForm(prev => ({
      ...prev,
      modifiers: prev.modifiers.map((modifier, i) => 
        i === index ? { ...modifier, [field]: value } : modifier
      )
    }))
  }

  const removeModifier = (index: number) => {
    setForm(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
  
    try {
      const url = isEditing 
        ? `/api/admin/stores/${businessId}/products/${productId}`
        : `/api/admin/stores/${businessId}/products`
      
      const method = isEditing ? 'PUT' : 'POST'
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
  
      if (response.ok) {
        setSuccessMessage({
          type: isEditing ? 'update' : 'create',
          productName: form.name
        })
  
        setTimeout(() => {
          const base = addParams(`/admin/stores/${businessId}/products`)
          const page = searchParams.get('page')
          const url = page ? `${base}${base.includes('?') ? '&' : '?'}page=${page}` : base
          router.push(url)
        }, 2000)
      } else {
        const errorData = await response.json()
        // Handle product limit reached error
        if (errorData.code === 'PRODUCT_LIMIT_REACHED') {
          setLimitError({
            currentCount: errorData.currentCount,
            limit: errorData.limit,
            plan: errorData.plan
          })
        } else {
          toast.error(errorData.message || 'Error saving product')
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Package },
    { id: 'inventory', name: 'Inventory', icon: BarChart3 },
    { id: 'variants', name: 'Variants', icon: Settings },
    { id: 'modifiers', name: 'Modifiers', icon: Plus },
    { id: 'seo', name: 'SEO', icon: Hash }
  ]

  const getTabHelperContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Product Information</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Use clear, descriptive product names</li>
                    <li>• Add detailed descriptions to help customers</li>
                    <li>• First image becomes the main product photo</li>
                    <li>• Set regular price for standard pricing</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Tag className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Pricing Strategy</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Regular Price:</strong> Your standard selling price</li>
                    <li>• <strong>Sale Price:</strong> Discounted price (optional)</li>
                    <li>• Sale price will show as strikethrough on regular price</li>
                    <li>• Leave sale price empty if no discount</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-2">Tips for Better Sales</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Use high-quality, well-lit photos</li>
                    <li>• Include multiple angles of the product</li>
                    <li>• Write compelling descriptions that highlight benefits</li>
                    <li>• Use SKUs to track inventory efficiently</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'inventory':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <BarChart3 className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-purple-900 mb-2">Inventory Tracking</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Enable tracking to monitor stock levels</li>
                    <li>• Set low stock alerts to avoid stockouts</li>
                    <li>• Disabled tracking means unlimited stock</li>
                    <li>• Stock changes are automatically logged</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'variants':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-start">
                <Settings className="w-5 h-5 text-indigo-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-indigo-900 mb-2">Product Variants</h4>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• Use for different sizes, colors, or styles</li>
                    <li>• Each variant can have its own price and stock</li>
                    <li>• Examples: T-Shirt sizes, Pizza portions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'modifiers':
        return (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start">
                <Plus className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-emerald-900 mb-2">Product Modifiers</h4>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• Add optional extras or required choices</li>
                    <li>• Examples: Pizza toppings, Drink add-ons</li>
                    <li>• Can be free or add to product cost</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <Hash className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">SEO Optimization</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Keep titles under 60 characters</li>
                    <li>• Keep descriptions under 160 characters</li>
                    <li>• Include main keywords naturally</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const calculateSavings = () => {
    if (form.originalPrice && form.originalPrice > form.price && form.price > 0) {
      const savings = form.originalPrice - form.price
      const percentage = Math.round((savings / form.originalPrice) * 100)
      return { amount: savings, percentage }
    }
    return null
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div>

{successMessage && (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                Product {successMessage.type === 'create' ? 'Created' : 'Updated'} Successfully
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                "{successMessage.productName}" has been {successMessage.type === 'create' ? 'added to' : 'updated in'} your catalog
              </p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Product Limit Reached Alert */}
    {limitError && (
      <div className="fixed top-4 right-4 z-50 max-w-md">
        <div className="bg-white border border-amber-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">Product Limit Reached</h4>
              <p className="text-sm text-amber-700 mt-1">
                Your {limitError.plan} plan allows up to {limitError.limit} products. 
                You currently have {limitError.currentCount}.
              </p>
              <Link
                href={addParams(`/admin/stores/${businessId}/settings/billing`)}
                className="inline-block mt-3 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
              >
                Upgrade to add more products
              </Link>
            </div>
            <button
              onClick={() => setLimitError(null)}
              className="text-amber-400 hover:text-amber-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )}

     {/* Header */}
    <div className="flex flex-col gap-4 mb-6">
    <div className="flex items-start gap-4">
        <Link
        href={addParams(`/admin/stores/${businessId}/products`)}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0 mt-1"
        >
        <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
            {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">
            {isEditing ? 'Update product information and settings' : 'Create a new product for your catalog'}
        </p>
        </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">
        <button
        type="button"
        onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
        className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            form.isActive 
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        >
        {form.isActive ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
        <span className="whitespace-nowrap">{form.isActive ? 'Active' : 'Inactive'}</span>
        </button>

        <button
        type="button"
        onClick={() => setForm(prev => ({ ...prev, featured: !prev.featured }))}
        className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
            form.featured 
            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        >
        <Star className="w-4 h-4 mr-2" />
        <span className="whitespace-nowrap">{form.featured ? 'Featured' : 'Not Featured'}</span>
        </button>

        {/* View Analytics Button - Only for existing products and PRO plans */}
        {isEditing && isPro && (
        <Link
            href={addParams(`/admin/stores/${businessId}/products/${productId}/analytics`)}
            className="flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg transition-colors"
        >
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="whitespace-nowrap">View Analytics</span>
        </Link>
        )}
    </div>
    </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="bg-gray-100 p-1 rounded-lg mb-6 overflow-hidden">
  <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
          activeTab === tab.id
            ? 'bg-white text-teal-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <tab.icon className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">{tab.name}</span>
        <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
      </button>
    ))}
  </div>
</div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'basic' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                {/* Language Toggle - Show for Albanian or Greek businesses */}
                {(business.language === 'sq' || business.language === 'el') && (
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveLanguage('en')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeLanguage === 'en'
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      English
                    </button>
                    {business.language === 'sq' && (
                      <button
                        type="button"
                        onClick={() => setActiveLanguage('al')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeLanguage === 'al'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Albanian
                      </button>
                    )}
                    {business.language === 'el' && (
                      <button
                        type="button"
                        onClick={() => setActiveLanguage('el')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeLanguage === 'el'
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Greek
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name {activeLanguage === 'al' ? '(Albanian)' : activeLanguage === 'el' ? '(Greek)' : ''} *
                  </label>
                  <input
                    type="text"
                    required={activeLanguage === 'en' || !(business.language === 'sq' || business.language === 'el' || business.storefrontLanguage === 'sq' || business.storefrontLanguage === 'el')}
                    value={activeLanguage === 'en' ? form.name : activeLanguage === 'el' ? (form.nameEl || '') : (form.nameAl || '')}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      [activeLanguage === 'en' ? 'name' : activeLanguage === 'el' ? 'nameEl' : 'nameAl']: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder={activeLanguage === 'en' ? "Enter product name" : activeLanguage === 'el' ? "Εισάγετε το όνομα του προϊόντος" : "Shkruani emrin e produktit"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description {activeLanguage === 'al' ? '(Albanian)' : activeLanguage === 'el' ? '(Greek)' : ''}
                  </label>
                  <textarea
                    value={activeLanguage === 'en' ? form.description : activeLanguage === 'el' ? (form.descriptionEl || '') : (form.descriptionAl || '')}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      [activeLanguage === 'en' ? 'description' : activeLanguage === 'el' ? 'descriptionEl' : 'descriptionAl']: e.target.value 
                    }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder={activeLanguage === 'en' ? "Describe your product..." : activeLanguage === 'el' ? "Περιγράψτε το προϊόν σας..." : "Përshkruani produktin tuaj..."}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {form.images.map((image, index) => (
                      <div key={index} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setViewingImage(image)}
                          className="w-full px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1.5 justify-center"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View better quality
                        </button>
                        <div className="relative h-48">
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {form.images.length > 1 && (
                            <span className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                              {index === 0 ? 'Main' : `#${index + 1}`}
                            </span>
                          )}
                        </div>
                        {form.images.length > 1 && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move earlier"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-gray-400 min-w-[1rem] text-center">{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              disabled={index === form.images.length - 1}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move later"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {form.images.length < 5 && (
                      <label className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500 transition-colors">
                        {uploadingImage ? (
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                            <span className="text-xs text-gray-500">Uploading...</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <span className="text-xs text-gray-500">Add Image</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload up to 5 images. First image will be the main product image.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Regular Price * ({business.currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        {getCurrencySymbol()}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={form.originalPrice || form.price || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          if (!form.originalPrice) {
                            setForm(prev => ({ ...prev, price: value }))
                          } else {
                            setForm(prev => ({ ...prev, originalPrice: value }))
                          }
                        }}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Your standard selling price
                    </p>
                  </div>

                  {isPro && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale Price (Optional) ({business.currency})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          {getCurrencySymbol()}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={form.originalPrice ? form.price || '' : ''}
                          onChange={(e) => {
                            const salePrice = parseFloat(e.target.value) || 0
                            if (salePrice > 0) {
                              if (!form.originalPrice) {
                                setForm(prev => ({ 
                                  ...prev, 
                                  originalPrice: prev.price || 0, 
                                  price: salePrice 
                                }))
                              } else {
                                setForm(prev => ({ ...prev, price: salePrice }))
                              }
                            } else {
                              setForm(prev => ({ 
                                ...prev, 
                                price: prev.originalPrice || prev.price, 
                                originalPrice: undefined,
                                saleStartDate: undefined,
                                saleEndDate: undefined
                              }))
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Discounted price (shows strikethrough on regular)
                      </p>
                    </div>
                  )}
                </div>

                {/* Sale Date Fields - Show when sale price is set OR when editing and dates exist */}
                {isPro && ((form.originalPrice && form.price < form.originalPrice) || form.saleStartDate || form.saleEndDate) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale Start Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={form.saleStartDate || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, saleStartDate: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        When the sale price becomes active
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale End Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={form.saleEndDate || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, saleEndDate: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        When the sale price expires
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <SearchableCategorySelect
                    categories={categories}
                    value={form.categoryId}
                    onChange={(value) => setForm(prev => ({ ...prev, categoryId: value }))}
                    placeholder="Select category"
                  />
                </div>

                {business.brandsFeatureEnabled && brands.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <select
                      value={form.brandId || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, brandId: e.target.value || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    >
                      <option value="">No brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {business.collectionsFeatureEnabled && collections.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Collections
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {collections.map(collection => (
                        <label key={collection.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={form.collectionIds.includes(collection.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm(prev => ({ 
                                  ...prev, 
                                  collectionIds: [...prev.collectionIds, collection.id] 
                                }))
                              } else {
                                setForm(prev => ({ 
                                  ...prev, 
                                  collectionIds: prev.collectionIds.filter(id => id !== collection.id) 
                                }))
                              }
                            }}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-900">{collection.name}</span>
                        </label>
                      ))}
                    </div>
                    {form.collectionIds.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {form.collectionIds.length} collection{form.collectionIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}

                {business.groupsFeatureEnabled && groups.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Groups
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {groups.map(group => (
                        <label key={group.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={form.groupIds.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm(prev => ({ 
                                  ...prev, 
                                  groupIds: [...prev.groupIds, group.id] 
                                }))
                              } else {
                                setForm(prev => ({ 
                                  ...prev, 
                                  groupIds: prev.groupIds.filter(id => id !== group.id) 
                                }))
                              }
                            }}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                          />
                          <span className="text-sm text-gray-900">{group.name}</span>
                        </label>
                      ))}
                    </div>
                    {form.groupIds.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {form.groupIds.length} group{form.groupIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}

                {isPro && form.originalPrice && form.price < form.originalPrice && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Pricing Preview</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-900">
                        {formatCurrency(form.price)}
                      </span>
                      <span className="text-gray-500 line-through">
                        {formatCurrency(form.originalPrice)}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                        {calculateSavings()?.percentage}% OFF
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Customers save {formatCurrency(calculateSavings()?.amount || 0)}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder="e.g., PROD-001"
                  />
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Track Inventory</h4>
                    <p className="text-sm text-gray-600">
                      Enable to track stock levels and get low stock alerts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.trackInventory}
                      onChange={(e) => setForm(prev => ({ ...prev, trackInventory: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                {form.trackInventory && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Stock *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required={form.trackInventory}
                          value={form.stock || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Low Stock Alert (Optional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.lowStockAlert || ''}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            lowStockAlert: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Enable Low Stock Notifications</h4>
                        <p className="text-sm text-gray-600">
                          Receive email alerts when this product reaches low stock levels
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.enableLowStockNotification}
                          onChange={(e) => setForm(prev => ({ ...prev, enableLowStockNotification: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {form.lowStockAlert && (
                      <div className="p-4 rounded-lg border">
                        {form.stock === 0 ? (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <span className="font-medium">Out of Stock</span>
                          </div>
                        ) : form.stock <= form.lowStockAlert ? (
                          <div className="flex items-center text-yellow-600">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <span className="font-medium">Low Stock Alert</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <Package className="w-4 h-4 mr-2" />
                            <span className="font-medium">Stock Level Good</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'variants' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                    <p className="text-sm text-gray-600 mt-1">
                    Add different variations of this product (e.g., sizes, colors)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variant
                </button>
                </div>
                
                {form.variants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No variants added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.variants.map((variant, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {form.variants.length > 1 && (
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => moveVariant(index, index - 1)}
                                  disabled={index === 0}
                                  className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Move up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveVariant(index, index + 1)}
                                  disabled={index === form.variants.length - 1}
                                  className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  title="Move down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Variant Image */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Variant Image
                            </label>
                            {variant.image ? (
                              <div className="flex items-center gap-4">
                                <img
                                  src={variant.image}
                                  alt={variant.name || 'Variant'}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                                />
                                <div className="flex gap-2">
                                  <label className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer text-sm">
                                    Change Image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleVariantImageUpload(index, e)}
                                      className="hidden"
                                      disabled={uploadingImage}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeVariantImage(index)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 cursor-pointer text-center">
                                <span className="text-sm text-gray-600">
                                  {uploadingImage ? 'Uploading...' : 'Click to upload variant image'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleVariantImageUpload(index, e)}
                                  className="hidden"
                                  disabled={uploadingImage}
                                />
                              </label>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={variant.name}
                                onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                placeholder="e.g., Large, Red"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price * ({business.currency})
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                  {getCurrencySymbol()}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  value={variant.price || ''}
                                  onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={variant.stock || ''}
                                onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU
                              </label>
                              <input
                                type="text"
                                value={variant.sku || ''}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                placeholder="VARIANT-001"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'modifiers' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Product Modifiers</h3>
                    <p className="text-sm text-gray-600 mt-1">
                    Add optional extras or required choices (e.g., toppings, sides)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addModifier}
                    className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Modifier
                </button>
                </div>

                {form.modifiers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No modifiers added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.modifiers.map((modifier, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Modifier {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeModifier(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={modifier.name}
                              onChange={(e) => updateModifier(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                              placeholder="e.g., Extra Cheese"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price ({business.currency})
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                {getCurrencySymbol()}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={modifier.price || ''}
                                onChange={(e) => updateModifier(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                                placeholder="0.00 (free)"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Leave empty or 0 for free</p>
                          </div>

                          <div className="flex items-center">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={modifier.required}
                                onChange={(e) => updateModifier(index, 'required', e.target.checked)}
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Required</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={form.metaTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder={form.name || "Product title for search engines"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.metaTitle?.length ?? 0}/60 characters (recommended)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={form.metaDescription}
                      onChange={(e) => setForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder={form.description || "Product description for search engines"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.metaDescription?.length ?? 0}/160 characters (recommended)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Link
                href={addParams(`/admin/stores/${businessId}/products`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Helper Content (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {getTabHelperContent()}
          </div>
        </div>
      </div>

      {/* Image View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <img
              src={viewingImage}
              alt="Product image full quality"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}