'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FileText,
  Loader2,
  X,
  Eye,
  EyeOff,
  Settings,
  Save,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface StorePage {
  id: string | null
  slug: string
  title: string
  content: string
  isEnabled: boolean
  showInFooter: boolean
  sortOrder: number
  pageType: string | null
  noIndex: boolean
  createdAt: string | null
  updatedAt: string | null
}

const PREDEFINED_PAGES = [
  { slug: 'privacy-policy', title: 'Privacy Policy', pageType: 'PRIVACY_POLICY' },
  { slug: 'terms-of-use', title: 'Terms of Use', pageType: 'TERMS' },
  { slug: 'payment-methods', title: 'Payment Methods', pageType: 'PAYMENT' },
  { slug: 'cancellation-return', title: 'Cancellation and Return Policy', pageType: 'CANCELLATION' },
  { slug: 'shipping-policy', title: 'Shipping Policy', pageType: 'SHIPPING' },
  { slug: 'refund-policy', title: 'Refund Policy', pageType: 'REFUND' },
]

export default function PagesPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [pages, setPages] = useState<StorePage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPage, setEditingPage] = useState<StorePage | null>(null)
  const [pageToDelete, setPageToDelete] = useState<StorePage | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featureDisabled, setFeatureDisabled] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    ctaEnabled: false,
    ctaText: 'Privacy & Policies',
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [stats, setStats] = useState<{
    totalViews: number
    totalEnabledViews: number
    totalPages: number
    enabledPages: number
    mostViewed: { slug: string; title: string; views: number } | null
    pages: Array<{ slug: string; title: string; views: number; isEnabled: boolean }>
    topCountries?: Array<{ country: string; views: number }>
    topCities?: Array<{ city: string; country: string; views: number }>
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    isEnabled: true,
    showInFooter: true,
    sortOrder: 0,
    pageType: 'CUSTOM',
    noIndex: false,
  })

  useEffect(() => {
    fetchPages()
    fetchSettings()
    fetchStats()
  }, [businessId])

  const fetchPages = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/pages`)
      if (response.status === 403) {
        setFeatureDisabled(true)
        setLoading(false)
        return
      }
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/pages/settings`)
      if (response.ok) {
        const data = await response.json()
        setSettings({
          ctaEnabled: data.ctaEnabled || false,
          ctaText: data.ctaText || 'Privacy & Policies',
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/pages/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleOpenForm = (page?: StorePage) => {
    if (page && page.id) {
      // Existing page
      setEditingPage(page)
      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content,
        isEnabled: page.isEnabled,
        showInFooter: page.showInFooter,
        sortOrder: page.sortOrder,
        pageType: page.pageType || 'CUSTOM',
        noIndex: page.noIndex || false,
      })
    } else if (page) {
      // Predefined page (no id)
      setEditingPage(page)
      setFormData({
        slug: page.slug,
        title: page.title,
        content: page.content || '',
        isEnabled: page.isEnabled,
        showInFooter: page.showInFooter,
        sortOrder: page.sortOrder,
        pageType: page.pageType || 'CUSTOM',
        noIndex: page.noIndex || false,
      })
    } else {
      // New custom page
      setEditingPage(null)
      setFormData({
        slug: '',
        title: '',
        content: '',
        isEnabled: true,
        showInFooter: true,
        sortOrder: pages.length,
        pageType: 'CUSTOM',
        noIndex: false,
      })
    }
    setShowForm(true)
    setError(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingPage(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!formData.slug || !formData.title) {
        throw new Error('Slug and title are required')
      }

      // Validate slug format
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(formData.slug)) {
        throw new Error('Slug must be lowercase alphanumeric with hyphens only')
      }

      const url = editingPage?.id
        ? `/api/admin/stores/${businessId}/pages/${editingPage.id}`
        : `/api/admin/stores/${businessId}/pages`
      
      const method = editingPage?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save page')
      }

      toast.success(editingPage?.id ? 'Page updated successfully' : 'Page created successfully')
      await fetchPages()
      await fetchStats()
      handleCloseForm()
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!pageToDelete || !pageToDelete.id) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/pages/${pageToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete page')
      }

      toast.success('Page deleted successfully')
      await fetchPages()
      await fetchStats()
      setPageToDelete(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleEnabled = async (page: StorePage) => {
    if (!page.id) {
      // Predefined page - need to create it first
      handleOpenForm(page)
      return
    }

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !page.isEnabled })
      })

      if (!response.ok) {
        throw new Error('Failed to update page')
      }

      await fetchPages()
      await fetchStats()
      toast.success(`Page ${!page.isEnabled ? 'enabled' : 'disabled'}`)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleToggleFooter = async (page: StorePage) => {
    if (!page.id) {
      toast.error('Please create the page first')
      return
    }

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showInFooter: !page.showInFooter })
      })

      if (!response.ok) {
        throw new Error('Failed to update page')
      }

      await fetchPages()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/pages/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Settings saved successfully')
      setShowSettings(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleMoveOrder = async (page: StorePage, direction: 'up' | 'down') => {
    if (!page.id) return

    const currentIndex = pages.findIndex(p => p.id === page.id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= pages.length) return

    const targetPage = pages[newIndex]
    if (!targetPage.id) return

    try {
      // Swap sort orders
      await Promise.all([
        fetch(`/api/admin/stores/${businessId}/pages/${page.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: targetPage.sortOrder })
        }),
        fetch(`/api/admin/stores/${businessId}/pages/${targetPage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: page.sortOrder })
        })
      ])

      await fetchPages()
    } catch (err: any) {
      toast.error('Failed to reorder pages')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (featureDisabled) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Not Enabled</h3>
        <p className="text-gray-600">
          Legal Pages feature is not enabled for this business. Please contact SuperAdmin to enable it.
        </p>
      </div>
    )
  }

  const existingPages = pages.filter(p => p.id !== null)
  const predefinedPages = pages.filter(p => p.id === null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Legal Pages</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage privacy policy, terms of use, and other legal pages for your storefront
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Page
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Legal Pages Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ctaEnabled}
                    onChange={(e) => setSettings({ ...settings, ctaEnabled: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show informative CTA above search bar
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Display a clickable banner above the search bar that opens the legal pages modal
                </p>
              </div>

              {settings.ctaEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={settings.ctaText}
                    onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
                    placeholder="Privacy & Policies"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {savingSettings ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pages List */}
      {pages.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first legal page or enable one of the predefined pages.
          </p>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Page
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Footer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pages
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((page, index) => (
                    <tr key={page.slug} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{page.title}</div>
                            <div className="text-xs text-gray-500">/{page.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          page.pageType === 'CUSTOM' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {page.pageType === 'CUSTOM' ? 'Custom' : 'Predefined'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEnabled(page)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                            page.isEnabled
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {page.isEnabled ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Enabled
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Disabled
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {page.id && (
                          <button
                            onClick={() => handleToggleFooter(page)}
                            className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                              page.showInFooter
                                ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {page.showInFooter ? 'Yes' : 'No'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {page.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveOrder(page, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(page, 'down')}
                              disabled={index === pages.length - 1}
                              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenForm(page)}
                            className="text-teal-600 hover:text-teal-900 p-2 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {page.id && page.pageType === 'CUSTOM' && (
                            <button
                              onClick={() => setPageToDelete(page)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Page Views Statistics</h2>
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Views</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Enabled Pages Views</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalEnabledViews.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Pages</div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalPages}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Enabled Pages</div>
                <div className="text-2xl font-bold text-gray-900">{stats.enabledPages}</div>
              </div>
            </div>
          )}
          {stats.mostViewed && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Most Viewed Page</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{stats.mostViewed.title}</div>
                  <div className="text-xs text-gray-500">/{stats.mostViewed.slug}</div>
                </div>
                <div className="text-lg font-semibold text-teal-600">{stats.mostViewed.views.toLocaleString()} views</div>
              </div>
            </div>
          )}
          {stats.topCountries && stats.topCountries.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">Top Countries</div>
              <div className="space-y-2">
                {stats.topCountries.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">{item.country}</div>
                    <div className="text-sm font-semibold text-gray-900">{item.views.toLocaleString()} views</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.topCities && stats.topCities.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">Top Cities</div>
              <div className="space-y-2">
                {stats.topCities.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.city}</div>
                      <div className="text-xs text-gray-500">{item.country}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{item.views.toLocaleString()} views</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.pages && stats.pages.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">Views by Page</div>
              <div className="space-y-2">
                {stats.pages.slice(0, 5).map((page) => (
                  <div key={page.slug} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{page.title}</div>
                      <div className="text-xs text-gray-500">/{page.slug}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {page.isEnabled ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                      <div className="text-sm font-semibold text-gray-900">{page.views.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.topCountries && stats.topCountries.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">Top Countries</div>
              <div className="space-y-2">
                {stats.topCountries.map((item, idx) => (
                  <div key={item.country} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{item.country}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{item.views.toLocaleString()} views</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.topCities && stats.topCities.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-3">Top Cities</div>
              <div className="space-y-2">
                {stats.topCities.map((item, idx) => (
                  <div key={`${item.city}-${item.country}`} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">{item.city}</span>
                        <span className="text-xs text-gray-500 ml-1">({item.country})</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{item.views.toLocaleString()} views</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPage?.id ? 'Edit Page' : editingPage ? 'Create Predefined Page' : 'Create Custom Page'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="privacy-policy"
                      disabled={!!editingPage?.pageType && editingPage.pageType !== 'CUSTOM'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL-friendly identifier (lowercase, hyphens only)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Privacy Policy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content (HTML) *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="<h1>Privacy Policy</h1><p>Your content here...</p>"
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Write your page content in HTML format
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isEnabled"
                      checked={formData.isEnabled}
                      onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Enabled
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showInFooter"
                      checked={formData.showInFooter}
                      onChange={(e) => setFormData({ ...formData, showInFooter: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="showInFooter" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Show in Footer
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="noIndex"
                      checked={formData.noIndex}
                      onChange={(e) => setFormData({ ...formData, noIndex: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="noIndex" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Prevent Search Engine Indexing
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingPage?.id ? 'Update' : 'Create'} Page
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Delete Page</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{pageToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPageToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
