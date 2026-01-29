'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SlidersHorizontal, Check, X, Loader2, AlertTriangle, ChevronDown, Search } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface FilterSettings {
  categoriesEnabled: boolean
  categoriesMode: 'all' | 'custom'
  selectedCategories: string[]
  collectionsEnabled: boolean
  collectionsMode: 'all' | 'custom'
  selectedCollections: string[]
  groupsEnabled: boolean
  groupsMode: 'all' | 'custom'
  selectedGroups: string[]
  brandsEnabled: boolean
  brandsMode: 'all' | 'custom'
  selectedBrands: string[]
  priceRangeEnabled: boolean
}

interface AvailableEntity {
  id: string
  name: string
  nameAl?: string | null
  nameEl?: string | null
}

export default function CustomFilteringPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [settings, setSettings] = useState<FilterSettings>({
    categoriesEnabled: true,
    categoriesMode: 'all',
    selectedCategories: [],
    collectionsEnabled: false,
    collectionsMode: 'all', 
    selectedCollections: [],
    groupsEnabled: false,
    groupsMode: 'all',
    selectedGroups: [],
    brandsEnabled: false,
    brandsMode: 'all',
    selectedBrands: [],
    priceRangeEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [featureEnabled, setFeatureEnabled] = useState(true)
  
  // Available entities for selection
  const [availableCategories, setAvailableCategories] = useState<AvailableEntity[]>([])
  const [availableCollections, setAvailableCollections] = useState<AvailableEntity[]>([])
  const [availableGroups, setAvailableGroups] = useState<AvailableEntity[]>([])
  const [availableBrands, setAvailableBrands] = useState<AvailableEntity[]>([])
  
  // Search states for dropdowns
  const [searchQueries, setSearchQueries] = useState({
    categories: '',
    collections: '',
    groups: '',
    brands: ''
  })

  useEffect(() => {
    fetchSettings()
    fetchBusiness()
  }, [businessId])

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setFeatureEnabled(data.business?.customFilteringEnabled || false)
      }
    } catch (error) {
      console.error('Error fetching business:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const [settingsRes, entitiesRes] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}/custom-filtering`),
        fetch(`/api/admin/stores/${businessId}/custom-filtering/entities`)
      ])
      
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }
      
      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json()
        setAvailableCategories(entitiesData.categories || [])
        setAvailableCollections(entitiesData.collections || [])
        setAvailableGroups(entitiesData.groups || [])
        setAvailableBrands(entitiesData.brands || [])
      }
    } catch (error) {
      console.error('Error fetching filter settings:', error)
      toast.error('Failed to load filter settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: 'categoriesEnabled' | 'collectionsEnabled' | 'groupsEnabled' | 'brandsEnabled') => {
    if (key === 'categoriesEnabled') {
      return
    }
    setSettings({ ...settings, [key]: !settings[key] })
  }
  
  const handleModeChange = (type: 'categories' | 'collections' | 'groups' | 'brands', mode: 'all' | 'custom') => {
    const modeKey = `${type}Mode` as keyof FilterSettings
    const selectedKey = `selected${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FilterSettings
    
    setSettings({
      ...settings,
      [modeKey]: mode,
      // Clear selections when switching to 'all' mode
      [selectedKey]: mode === 'all' ? [] : settings[selectedKey]
    })
  }
  
  const handleEntityToggle = (type: 'categories' | 'collections' | 'groups' | 'brands', entityId: string) => {
    const selectedKey = `selected${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FilterSettings
    const currentSelections = settings[selectedKey] as string[]
    
    const newSelections = currentSelections.includes(entityId)
      ? currentSelections.filter(id => id !== entityId)
      : [...currentSelections, entityId]
    
    setSettings({
      ...settings,
      [selectedKey]: newSelections
    })
  }
  
  const getFilteredEntities = (type: 'categories' | 'collections' | 'groups' | 'brands') => {
    const entities = type === 'categories' ? availableCategories
      : type === 'collections' ? availableCollections
      : type === 'groups' ? availableGroups
      : availableBrands
    
    const query = searchQueries[type].toLowerCase()
    if (!query) return entities
    
    return entities.filter(entity => 
      entity.name.toLowerCase().includes(query) ||
      (entity.nameAl && entity.nameAl.toLowerCase().includes(query))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/custom-filtering`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoriesEnabled: settings.categoriesEnabled,
          categoriesMode: settings.categoriesMode,
          selectedCategories: settings.selectedCategories,
          collectionsEnabled: settings.collectionsEnabled,
          collectionsMode: settings.collectionsMode,
          selectedCollections: settings.selectedCollections,
          groupsEnabled: settings.groupsEnabled,
          groupsMode: settings.groupsMode,
          selectedGroups: settings.selectedGroups,
          brandsEnabled: settings.brandsEnabled,
          brandsMode: settings.brandsMode,
          selectedBrands: settings.selectedBrands,
          priceRangeEnabled: settings.priceRangeEnabled
        })
      })
      
      if (!response.ok) throw new Error('Failed to save settings')
      
      toast.success('Filter settings saved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!featureEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center max-w-2xl mx-auto mt-8">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Filtering Feature Not Enabled</h3>
        <p className="text-gray-600">
          This feature is not enabled for your business. Contact your administrator to enable it.
        </p>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Filtering</h1>
        <p className="text-sm text-gray-600 mt-1">
          Choose which filters to display on your storefront
        </p>
      </div>

      {/* Filter Options */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 space-y-3">
          {/* Categories - Now Configurable */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('categoriesEnabled')}
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
                settings.categoriesEnabled
                  ? 'bg-teal-50 border-teal-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  settings.categoriesEnabled ? 'bg-teal-100' : 'bg-gray-100'
                }`}>
                  <SlidersHorizontal className={`h-5 w-5 transition-colors ${
                    settings.categoriesEnabled ? 'text-teal-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-900">Categories Filter</div>
                  <div className="text-sm text-gray-600">Override default category navigation</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {settings.categoriesEnabled ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Disabled</span>
                  </>
                )}
              </div>
            </button>
            
            {settings.categoriesEnabled && (
              <div className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="categoriesMode"
                          value="all"
                          checked={settings.categoriesMode === 'all'}
                          onChange={(e) => handleModeChange('categories', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show all categories ({availableCategories.length} available)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="categoriesMode"
                          value="custom"
                          checked={settings.categoriesMode === 'custom'}
                          onChange={(e) => handleModeChange('categories', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Custom selection ({settings.selectedCategories.length} selected)</span>
                      </label>
                    </div>
                  </div>
                  
                  {settings.categoriesMode === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Categories</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={searchQueries.categories}
                          onChange={(e) => setSearchQueries({...searchQueries, categories: e.target.value})}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                        {getFilteredEntities('categories').map((category) => (
                          <label key={category.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.selectedCategories.includes(category.id)}
                              onChange={() => handleEntityToggle('categories', category.id)}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              {category.name}
                              {category.nameAl && <span className="text-gray-500 ml-1">({category.nameAl})</span>}
                            </span>
                          </label>
                        ))}
                        {getFilteredEntities('categories').length === 0 && (
                          <div className="p-3 text-center text-sm text-gray-500">
                            {searchQueries.categories ? 'No categories found' : 'No categories available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collections */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('collectionsEnabled')}
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
                settings.collectionsEnabled
                  ? 'bg-teal-50 border-teal-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  settings.collectionsEnabled ? 'bg-teal-100' : 'bg-gray-100'
                }`}>
                  <SlidersHorizontal className={`h-5 w-5 transition-colors ${
                    settings.collectionsEnabled ? 'text-teal-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-900">Collections</div>
                  <div className="text-sm text-gray-600">Filter products by collection</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {settings.collectionsEnabled ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Disabled</span>
                  </>
                )}
              </div>
            </button>
            
            {settings.collectionsEnabled && (
              <div className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="collectionsMode"
                          value="all"
                          checked={settings.collectionsMode === 'all'}
                          onChange={(e) => handleModeChange('collections', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show all collections ({availableCollections.length} available)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="collectionsMode"
                          value="custom"
                          checked={settings.collectionsMode === 'custom'}
                          onChange={(e) => handleModeChange('collections', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Custom selection ({settings.selectedCollections.length} selected)</span>
                      </label>
                    </div>
                  </div>
                  
                  {settings.collectionsMode === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Collections</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search collections..."
                          value={searchQueries.collections}
                          onChange={(e) => setSearchQueries({...searchQueries, collections: e.target.value})}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                        {getFilteredEntities('collections').map((collection) => (
                          <label key={collection.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.selectedCollections.includes(collection.id)}
                              onChange={() => handleEntityToggle('collections', collection.id)}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              {collection.name}
                              {collection.nameAl && <span className="text-gray-500 ml-1">({collection.nameAl})</span>}
                            </span>
                          </label>
                        ))}
                        {getFilteredEntities('collections').length === 0 && (
                          <div className="p-3 text-center text-sm text-gray-500">
                            {searchQueries.collections ? 'No collections found' : 'No collections available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('groupsEnabled')}
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
                settings.groupsEnabled
                  ? 'bg-teal-50 border-teal-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  settings.groupsEnabled ? 'bg-teal-100' : 'bg-gray-100'
                }`}>
                  <SlidersHorizontal className={`h-5 w-5 transition-colors ${
                    settings.groupsEnabled ? 'text-teal-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-900">Groups</div>
                  <div className="text-sm text-gray-600">Filter products by group</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {settings.groupsEnabled ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Disabled</span>
                  </>
                )}
              </div>
            </button>
            
            {settings.groupsEnabled && (
              <div className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="groupsMode"
                          value="all"
                          checked={settings.groupsMode === 'all'}
                          onChange={(e) => handleModeChange('groups', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show all groups ({availableGroups.length} available)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="groupsMode"
                          value="custom"
                          checked={settings.groupsMode === 'custom'}
                          onChange={(e) => handleModeChange('groups', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Custom selection ({settings.selectedGroups.length} selected)</span>
                      </label>
                    </div>
                  </div>
                  
                  {settings.groupsMode === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Groups</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search groups..."
                          value={searchQueries.groups}
                          onChange={(e) => setSearchQueries({...searchQueries, groups: e.target.value})}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                        {getFilteredEntities('groups').map((group) => (
                          <label key={group.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.selectedGroups.includes(group.id)}
                              onChange={() => handleEntityToggle('groups', group.id)}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              {group.name}
                              {group.nameAl && <span className="text-gray-500 ml-1">({group.nameAl})</span>}
                            </span>
                          </label>
                        ))}
                        {getFilteredEntities('groups').length === 0 && (
                          <div className="p-3 text-center text-sm text-gray-500">
                            {searchQueries.groups ? 'No groups found' : 'No groups available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('brandsEnabled')}
              className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
                settings.brandsEnabled
                  ? 'bg-teal-50 border-teal-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  settings.brandsEnabled ? 'bg-teal-100' : 'bg-gray-100'
                }`}>
                  <SlidersHorizontal className={`h-5 w-5 transition-colors ${
                    settings.brandsEnabled ? 'text-teal-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-900">Brands</div>
                  <div className="text-sm text-gray-600">Filter products by brand</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {settings.brandsEnabled ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <X className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Disabled</span>
                  </>
                )}
              </div>
            </button>
            
            {settings.brandsEnabled && (
              <div className="ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="brandsMode"
                          value="all"
                          checked={settings.brandsMode === 'all'}
                          onChange={(e) => handleModeChange('brands', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show all brands ({availableBrands.length} available)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="brandsMode"
                          value="custom"
                          checked={settings.brandsMode === 'custom'}
                          onChange={(e) => handleModeChange('brands', e.target.value as 'all' | 'custom')}
                          className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Custom selection ({settings.selectedBrands.length} selected)</span>
                      </label>
                    </div>
                  </div>
                  
                  {settings.brandsMode === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Brands</label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search brands..."
                          value={searchQueries.brands}
                          onChange={(e) => setSearchQueries({...searchQueries, brands: e.target.value})}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                        {getFilteredEntities('brands').map((brand) => (
                          <label key={brand.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.selectedBrands.includes(brand.id)}
                              onChange={() => handleEntityToggle('brands', brand.id)}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                              {brand.name}
                              {brand.nameAl && <span className="text-gray-500 ml-1">({brand.nameAl})</span>}
                            </span>
                          </label>
                        ))}
                        {getFilteredEntities('brands').length === 0 && (
                          <div className="p-3 text-center text-sm text-gray-500">
                            {searchQueries.brands ? 'No brands found' : 'No brands available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Price Range - Always Enabled */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal className="h-5 w-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900">Price Range</div>
                <div className="text-sm text-gray-600">Always enabled (required)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600 font-medium">Enabled</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          How Enhanced Custom Filtering Works
        </h3>
        <ul className="text-sm text-blue-700 space-y-1.5 list-disc list-inside">
          <li><strong>Categories Filter:</strong> Override default category navigation with custom filter in filter modal</li>
          <li><strong>Price Range:</strong> Always enabled (required for all storefronts)</li>
          <li><strong>Show All vs Custom:</strong> Choose to show all available items or hand-pick specific ones</li>
          <li><strong>Custom Selection:</strong> Select only the categories, collections, groups, or brands you want customers to see</li>
          <li><strong>Curated Experience:</strong> Guide customers to specific products by limiting filter options</li>
          <li><strong>Multi-Filter Support:</strong> Customers can combine multiple filters for precise product discovery</li>
        </ul>
      </div>
    </>
  )
}
