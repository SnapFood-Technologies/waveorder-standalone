// src/components/admin/products/ProductForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  DollarSign,
  Hash,
  Settings,
  BarChart3,
  Info,
  Lightbulb,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

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
}

interface ProductForm {
  name: string
  description: string
  images: string[]
  price: number
  originalPrice?: number
  sku: string
  stock: number
  trackInventory: boolean
  lowStockAlert?: number
  isActive: boolean
  featured: boolean
  categoryId: string
  variants: ProductVariant[]
  modifiers: ProductModifier[]
  metaTitle: string
  metaDescription: string
}

export function ProductForm({ businessId, productId }: ProductFormProps) {
  const router = useRouter()
  const isEditing = productId !== 'new'
  
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    images: [],
    price: 0,
    originalPrice: undefined,
    sku: '',
    stock: 0,
    trackInventory: true,
    lowStockAlert: undefined,
    isActive: true,
    featured: false,
    categoryId: '',
    variants: [],
    modifiers: [],
    metaTitle: '',
    metaDescription: ''
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    fetchCategories()
    if (isEditing) {
      fetchProduct()
    }
  }, [businessId, productId])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setForm({
          ...data.product,
          originalPrice: data.product.originalPrice || undefined,
          lowStockAlert: data.product.lowStockAlert || undefined
        })
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('image', file)

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

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        { name: '', price: 0, stock: 0, sku: '' }
      ]
    }))
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
        router.push(`/admin/stores/${businessId}/products`)
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
                    <li>• Original price shows strikethrough when set</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Tips for Better Sales</h4>
                  <ul className="text-sm text-green-800 space-y-1">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/stores/${businessId}/products`}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Update product information and settings' : 'Create a new product for your catalog'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              form.isActive 
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {form.isActive ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {form.isActive ? 'Active' : 'Inactive'}
          </button>

          <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, featured: !prev.featured }))}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              form.featured 
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Star className="w-4 h-4 mr-2" />
            {form.featured ? 'Featured' : 'Not Featured'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'basic' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Describe your product..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {form.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {form.images.length < 5 && (
                      <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500 transition-colors">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={form.price || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={form.originalPrice || ''}
                        onChange={(e) => setForm(prev => ({ 
                          ...prev, 
                          originalPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                        }))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="5"
                        />
                      </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Add different variations of this product (e.g., sizes, colors)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
                          <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="e.g., Large, Red"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={variant.price || ''}
                              onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="0.00"
                            />
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="VARIANT-001"
                            />
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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Product Modifiers</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Add optional extras or required choices (e.g., toppings, sides)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addModifier}
                    className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="e.g., Extra Cheese"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Price *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={modifier.price || ''}
                              onChange={(e) => updateModifier(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder="0.00"
                            />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder={form.name || "Product title for search engines"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.metaTitle.length}/60 characters (recommended)
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder={form.description || "Product description for search engines"}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {form.metaDescription.length}/160 characters (recommended)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Link
                href={`/admin/stores/${businessId}/products`}
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
    </div>
  )
}