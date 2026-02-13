// src/components/admin/services/ServiceForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Scissors,
  Star,
  Eye,
  EyeOff,
  AlertTriangle,
  Hash,
  Info,
  Lightbulb,
  CheckCircle,
  Clock,
  Users,
  Search,
  ChevronDown
} from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'
import { useSubscription } from '@/hooks/useSubscription'
import toast from 'react-hot-toast'

interface ServiceFormProps {
  businessId: string
  serviceId: string // 'new' for creating new service
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
  isActive: boolean
}

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: string
}

interface ServiceForm {
  name: string
  nameAl?: string
  nameEl?: string
  description: string
  descriptionAl?: string
  descriptionEl?: string
  images: string[]
  price: number
  originalPrice?: number
  isActive: boolean
  featured: boolean
  categoryId: string
  modifiers: ProductModifier[]
  serviceDuration?: number | null
  requiresAppointment: boolean
  staffIds: string[]
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCategory = categories.find(cat => cat.id === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-left flex items-center justify-between text-gray-900"
      >
        <span className={selectedCategory ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCategory ? selectedCategory.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No categories found</div>
            ) : (
              filteredCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange(category.id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 text-sm ${
                    value === category.id ? 'bg-teal-50 text-teal-700' : 'text-gray-900'
                  }`}
                >
                  {category.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ServiceForm({ businessId, serviceId }: ServiceFormProps) {
  const { addParams } = useImpersonation(businessId)
  const router = useRouter()
  const { effectivePlan } = useSubscription()
  const isEditing = serviceId !== 'new'
  
  // Staff assignment is only available for PRO+ plans
  const canAssignStaff = effectivePlan === 'PRO' || effectivePlan === 'BUSINESS'
  
  const [form, setForm] = useState<ServiceForm>({
    name: '',
    nameAl: '',
    description: '',
    descriptionAl: '',
    images: [],
    price: 0,
    originalPrice: undefined,
    isActive: true,
    featured: false,
    categoryId: '',
    modifiers: [],
    serviceDuration: null,
    requiresAppointment: true,
    staffIds: [],
    metaTitle: '',
    metaDescription: ''
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [business, setBusiness] = useState<{ 
    currency: string
    language: string
    storefrontLanguage: string
  }>({ 
    currency: 'USD', 
    language: 'en', 
    storefrontLanguage: 'en'
  })
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'al' | 'el'>('en')

  const [limitError, setLimitError] = useState<{ currentCount: number; limit: number; plan: string } | null>(null)

  const [successMessage, setSuccessMessage] = useState<{
    type: 'create' | 'update'
    serviceName: string
  } | null>(null)

  useEffect(() => {
    fetchBusinessData()
    fetchCategories()
    fetchTeamMembers()
    if (isEditing) {
      fetchService()
    }
  }, [businessId, serviceId])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness({ 
          currency: data.business.currency,
          language: data.business.language || 'en',
          storefrontLanguage: data.business.storefrontLanguage || data.business.language || 'en'
        })
        if (data.business.language === 'sq' || data.business.storefrontLanguage === 'sq' || 
            data.business.language === 'el' || data.business.storefrontLanguage === 'el') {
          setActiveLanguage('en')
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

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/services/${serviceId}`)
      if (response.ok) {
        const data = await response.json()
        setForm({
          ...data.service,
          nameAl: data.service.nameAl || '',
          nameEl: data.service.nameEl || '',
          descriptionAl: data.service.descriptionAl || '',
          descriptionEl: data.service.descriptionEl || '',
          originalPrice: data.service.originalPrice || undefined,
          serviceDuration: data.service.serviceDuration || null,
          requiresAppointment: data.service.requiresAppointment ?? true,
          staffIds: data.service.staffIds || [],
          modifiers: data.service.modifiers || []
        })
      }
    } catch (error) {
      console.error('Error fetching service:', error)
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
        ? `/api/admin/stores/${businessId}/services/${serviceId}`
        : `/api/admin/stores/${businessId}/services`
      
      const method = isEditing ? 'PUT' : 'POST'
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
  
      if (response.ok) {
        setSuccessMessage({
          type: isEditing ? 'update' : 'create',
          serviceName: form.name
        })
  
        setTimeout(() => {
          router.push(addParams(`/admin/stores/${businessId}/services`))
        }, 2000)
      } else {
        const errorData = await response.json()
        if (errorData.code === 'SERVICE_LIMIT_REACHED') {
          setLimitError({
            currentCount: errorData.currentCount,
            limit: errorData.limit,
            plan: errorData.plan
          })
        } else {
          toast.error(errorData.message || 'Error saving service')
        }
      }
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('Error saving service')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: Scissors },
    { id: 'modifiers', name: 'Add-ons', icon: Plus },
    { id: 'seo', name: 'SEO', icon: Hash }
  ]

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' }
  ]

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
                  Service {successMessage.type === 'create' ? 'Created' : 'Updated'} Successfully
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  "{successMessage.serviceName}" has been {successMessage.type === 'create' ? 'added to' : 'updated in'} your catalog
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

      {limitError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-amber-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Service Limit Reached</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Your {limitError.plan} plan allows up to {limitError.limit} services. You currently have {limitError.currentCount} services.
                </p>
                <Link
                  href={addParams(`/admin/stores/${businessId}/settings/billing`)}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-2 inline-block"
                >
                  Upgrade Plan →
                </Link>
              </div>
              <button
                onClick={() => setLimitError(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/services`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {isEditing ? 'Edit Service' : 'Add New Service'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {isEditing ? 'Update service information and settings' : 'Create a new service for your catalog'}
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
                  type="button"
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

                {/* Language Toggle */}
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
                    Service Name {activeLanguage === 'al' ? '(Albanian)' : activeLanguage === 'el' ? '(Greek)' : ''} *
                  </label>
                  <input
                    type="text"
                    required={activeLanguage === 'en' || !(business.language === 'sq' || business.language === 'el')}
                    value={activeLanguage === 'en' ? form.name : activeLanguage === 'el' ? (form.nameEl || '') : (form.nameAl || '')}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      [activeLanguage === 'en' ? 'name' : activeLanguage === 'el' ? 'nameEl' : 'nameAl']: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                    placeholder={activeLanguage === 'en' ? "Enter service name" : activeLanguage === 'el' ? "Εισάγετε το όνομα της υπηρεσίας" : "Shkruani emrin e shërbimit"}
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
                    placeholder={activeLanguage === 'en' ? "Describe your service..." : activeLanguage === 'el' ? "Περιγράψτε την υπηρεσία σας..." : "Përshkruani shërbimin tuaj..."}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Images
                  </label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {form.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Service image ${index + 1}`}
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
                    Upload up to 5 images. First image will be the main service image.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Price * ({business.currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                        {getCurrencySymbol()}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={form.price || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration *
                    </label>
                    <select
                      required
                      value={form.serviceDuration || ''}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        serviceDuration: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select duration</option>
                      {durationOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      <option value="custom">Custom (enter minutes)</option>
                    </select>
                  </div>
                </div>

                {form.serviceDuration === 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.serviceDuration || ''}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        serviceDuration: parseInt(e.target.value) || null 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="Enter duration in minutes"
                    />
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

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Requires Appointment</h4>
                    <p className="text-sm text-gray-600">
                      Enable if customers need to book this service in advance
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.requiresAppointment}
                      onChange={(e) => setForm(prev => ({ ...prev, requiresAppointment: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                {teamMembers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Staff Members (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Select which team members can perform this service
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                      {teamMembers.map(member => (
                        <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={form.staffIds.includes(member.userId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm(prev => ({ 
                                  ...prev, 
                                  staffIds: [...prev.staffIds, member.userId] 
                                }))
                              } else {
                                setForm(prev => ({ 
                                  ...prev, 
                                  staffIds: prev.staffIds.filter(id => id !== member.userId) 
                                }))
                              }
                            }}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm text-gray-900">{member.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {form.staffIds.length > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        {form.staffIds.length} staff member{form.staffIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                )}
                {teamMembers.length > 0 && !canAssignStaff && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">
                          Staff Assignment Available on Pro Plan
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Upgrade to Pro or Business plan to assign team members to services.
                        </p>
                        <Link
                          href={`/admin/stores/${businessId}/settings/billing`}
                          className="text-xs text-amber-800 underline hover:no-underline mt-2 inline-block"
                        >
                          View Plans →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'modifiers' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Service Add-ons</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Add optional extras or upgrades (e.g., "Deep Conditioning +$20")
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addModifier}
                    className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Add-on
                  </button>
                </div>

                {form.modifiers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>No add-ons added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.modifiers.map((modifier, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Add-on {index + 1}</h4>
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
                              placeholder="e.g., Deep Conditioning"
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
                      placeholder={form.name || "Service title for search engines"}
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
                      placeholder={form.description || "Service description for search engines"}
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
                href={addParams(`/admin/stores/${businessId}/services`)}
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
                {saving ? 'Saving...' : (isEditing ? 'Update Service' : 'Create Service')}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Helper Content (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Service Information</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use clear, descriptive service names</li>
                        <li>• Add detailed descriptions to help customers</li>
                        <li>• First image becomes the main service photo</li>
                        <li>• Set duration to help with scheduling</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Duration & Staff</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Set accurate duration for scheduling</li>
                        <li>• Assign staff to control who can perform services</li>
                        <li>• Leave staff unassigned for any staff member</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'modifiers' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Plus className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-emerald-900 mb-2">Service Add-ons</h4>
                    <ul className="text-sm text-emerald-800 space-y-1">
                      <li>• Add optional extras or upgrades</li>
                      <li>• Examples: Deep Conditioning, Hair Treatment</li>
                      <li>• Can be free or add to service cost</li>
                      <li>• Mark as required if mandatory</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
