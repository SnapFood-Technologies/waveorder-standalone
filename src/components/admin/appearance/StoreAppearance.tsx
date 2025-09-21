'use client'

import { useState, useEffect } from 'react'
import { 
  Palette, 
  Type, 
  Smartphone, 
  Eye, 
  Save, 
  RotateCcw, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Monitor,
  ShoppingCart,
  Settings
} from 'lucide-react'
import { StorePreview } from './StorePreview'

interface StoreAppearanceProps {
  businessId: string
}

interface BusinessData {
  id: string
  name: string
  slug: string
  businessType: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  whatsappButtonColor: string
  mobileCartStyle: 'bar' | 'badge'
  currency: string
  language: string
  description?: string
  logo?: string
  coverImage?: string
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled: boolean
}

interface AppearanceSettings {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  whatsappButtonColor: string
  mobileCartStyle: 'bar' | 'badge'
}

const defaultColors = [
  '#0D9488', // Teal (Default)
  '#059669', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#10B981', // Green
  '#6366F1', // Indigo
  '#84CC16', // Lime
]

const fontOptions = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
]

export function StoreAppearance({ businessId }: StoreAppearanceProps) {
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [settings, setSettings] = useState<AppearanceSettings>({
    primaryColor: '#0D9488',
    secondaryColor: '#1F2937',
    fontFamily: 'Inter',
    whatsappButtonColor: '#25D366',
    mobileCartStyle: 'bar'
  })
  const [originalSettings, setOriginalSettings] = useState<AppearanceSettings>({
    primaryColor: '#0D9488',
    secondaryColor: '#1F2937',
    fontFamily: 'Inter',
    whatsappButtonColor: '#25D366',
    mobileCartStyle: 'bar'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')

  useEffect(() => {
    fetchBusinessData()
  }, [businessId])

  useEffect(() => {
    const hasChangedSettings = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasChanges(hasChangedSettings)
  }, [settings, originalSettings])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusinessData(data.business)
        
        const appearanceSettings = {
          primaryColor: data.business.primaryColor,
          secondaryColor: data.business.secondaryColor,
          fontFamily: data.business.fontFamily,
          whatsappButtonColor: data.business.whatsappButtonColor || data.business.primaryColor,
          mobileCartStyle: data.business.mobileCartStyle
        }
        
        setSettings(appearanceSettings)
        setOriginalSettings(appearanceSettings)
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/appearance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setOriginalSettings({ ...settings })
        setHasChanges(false)
        // Show success notification
      }
    } catch (error) {
      console.error('Error saving appearance settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({ ...originalSettings })
  }

  const handleColorChange = (type: 'primaryColor' | 'secondaryColor' | 'whatsappButtonColor', color: string) => {
    setSettings(prev => ({ ...prev, [type]: color }))
  }

  const handleCustomColorChange = (type: 'primaryColor' | 'secondaryColor' | 'whatsappButtonColor', color: string) => {
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      setSettings(prev => ({ ...prev, [type]: color }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!businessData) {
    return <div>Error loading business data</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Appearance</h1>
          <p className="text-gray-600 mt-1">
            Customize how your store looks to customers
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <a
            href={`/site/${businessData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Live Store
          </a>
          {hasChanges && (
            <button
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Colors Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <Palette className="w-5 h-5 text-teal-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Colors</h3>
            </div>

            {/* Primary Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Primary Color
                <span className="text-gray-500 text-xs ml-1">(buttons, links, accents)</span>
              </label>
              <div className="grid grid-cols-5 gap-3 mb-3">
                {defaultColors.map(color => (
                  <button
                    key={color}
                    onClick={() => handleColorChange('primaryColor', color)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      settings.primaryColor === color ? 'border-gray-400 scale-110' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => handleCustomColorChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="#0D9488"
                />
              </div>
            </div>

            {/* WhatsApp Button Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                WhatsApp Button Color
                <span className="text-gray-500 text-xs ml-1">(order button color)</span>
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleColorChange('whatsappButtonColor', '#25D366')}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    settings.whatsappButtonColor === '#25D366' ? 'border-gray-400 scale-110' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: '#25D366' }}
                  title="WhatsApp Green"
                />
                <button
                  onClick={() => handleColorChange('whatsappButtonColor', settings.primaryColor)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    settings.whatsappButtonColor === settings.primaryColor ? 'border-gray-400 scale-110' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: settings.primaryColor }}
                  title="Same as Primary Color"
                />
                <input
                  type="color"
                  value={settings.whatsappButtonColor}
                  onChange={(e) => handleColorChange('whatsappButtonColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.whatsappButtonColor}
                  onChange={(e) => handleCustomColorChange('whatsappButtonColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="#25D366"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Secondary Color
                <span className="text-gray-500 text-xs ml-1">(text, borders)</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => handleCustomColorChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="#1F2937"
                />
              </div>
            </div>
          </div>

          {/* Typography Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <Type className="w-5 h-5 text-teal-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Font Family</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {fontOptions.map(font => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Settings */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <Smartphone className="w-5 h-5 text-teal-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Mobile Experience</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Cart Style</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="bar"
                    checked={settings.mobileCartStyle === 'bar'}
                    onChange={(e) => setSettings(prev => ({ ...prev, mobileCartStyle: e.target.value as 'bar' | 'badge' }))}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                  />
                  <span className="ml-3 flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Bottom Bar (Recommended)
                    <span className="text-gray-500 text-xs ml-2">- Full-width cart button at bottom</span>
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="badge"
                    checked={settings.mobileCartStyle === 'badge'}
                    onChange={(e) => setSettings(prev => ({ ...prev, mobileCartStyle: e.target.value as 'bar' | 'badge' }))}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                  />
                  <span className="ml-3 flex items-center">
                    <div className="w-4 h-4 rounded-full bg-teal-600 mr-2 flex items-center justify-center">
                      <span className="text-white text-xs">3</span>
                    </div>
                    Floating Badge
                    <span className="text-gray-500 text-xs ml-2">- Small floating cart badge</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Customization Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Choose colors that match your brand</li>
                  <li>• Use high contrast for better readability</li>
                  <li>• Test on mobile devices for best experience</li>
                  <li>• Keep WhatsApp button easily recognizable</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:sticky lg:top-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-teal-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewDevice === 'mobile' ? 'bg-teal-100 text-teal-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-2 rounded-lg transition-colors ${
                    previewDevice === 'desktop' ? 'bg-teal-100 text-teal-600' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Demo Data Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Preview uses demo data</p>
                  <p className="text-xs mt-1">
                    Want to see your real store? {' '}
                    <a 
                      href={`/site/${businessData.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline font-medium"
                    >
                      View live store
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <StorePreview 
              businessData={businessData}
              settings={settings}
              device={previewDevice}
            />
          </div>
        </div>
      </div>

      {/* Save Changes Banner */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-amber-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">You have unsaved changes</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}