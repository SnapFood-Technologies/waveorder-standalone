// src/components/admin/settings/OrderNotificationSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useImpersonation } from '@/lib/impersonation'
import { 
  Bell, 
  Mail, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ShoppingBag,
  X,
  RefreshCw,
  ExternalLink,
  User,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface OrderNotificationSettingsProps {
  businessId: string
}

interface NotificationSettings {
  orderNotificationsEnabled: boolean
  orderNotificationEmail: string | null
  orderNotificationLastUpdate: string | null
  lastOrderNotified?: string | null
}

interface OrderNotification {
  id: string
  orderNumber: string
  orderStatus: string
  customerName: string
  total: number
  notifiedAt: string
  emailSent: boolean
  emailError: string | null
}

interface Business {
  currency: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export function OrderNotificationSettings({ businessId }: OrderNotificationSettingsProps) {
  const { addParams } = useImpersonation(businessId)
  const router = useRouter()
  
  const [settings, setSettings] = useState<NotificationSettings>({
    orderNotificationsEnabled: false,
    orderNotificationEmail: null,
    orderNotificationLastUpdate: null,
    lastOrderNotified: null
  })
  
  const [business, setBusiness] = useState<Business>({ currency: 'USD' })
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (businessId) {
      fetchSettings()
      fetchNotifications()
    }
  }, [businessId, currentPage])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/settings/notifications`)
      if (response.ok) {
        const data = await response.json()
        setSettings({
          orderNotificationsEnabled: data.business.orderNotificationsEnabled || false,
          orderNotificationEmail: data.business.orderNotificationEmail || data.business.email || '',
          orderNotificationLastUpdate: data.business.orderNotificationLastUpdate,
          lastOrderNotified: data.business.lastOrderNotified
        })
        setBusiness({ currency: data.business.currency })
      } else {
        setError('Failed to load notification settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Failed to load notification settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      const response = await fetch(`/api/admin/stores/${businessId}/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L'
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const formatStatus = (status: string) => {
    return 'New Order Received'
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'confirmed': return 'text-blue-600 bg-blue-100'
      case 'preparing': return 'text-orange-600 bg-orange-100'
      case 'ready': return 'text-green-600 bg-green-100'
      case 'out_for_delivery': return 'text-cyan-600 bg-cyan-100'
      case 'delivered': return 'text-emerald-600 bg-emerald-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'refunded': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const saveSettings = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/settings/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          orderNotificationLastUpdate: data.business.orderNotificationLastUpdate
        }))
        
        setSuccessMessage('Notification settings updated successfully')
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationClick = (orderNumber: string) => {
    router.push(addParams(`/admin/stores/${businessId}/orders?search=${orderNumber}`))
  }

  const refreshNotifications = () => {
    setCurrentPage(1)
    fetchNotifications()
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Bell className="w-6 h-6 text-teal-600 mr-3" />
            Order Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            Get notified when customers place orders
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div className="text-sm text-green-700">{successMessage}</div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Mail className="w-5 h-5 text-teal-600 mr-2" />
          Email Notification Settings
        </h2>

        <div className="space-y-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="orderNotificationsEnabled"
              checked={settings.orderNotificationsEnabled}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label className="ml-3 text-sm font-medium text-gray-700">
              Enable order email notifications
            </label>
          </div>

          {settings.orderNotificationsEnabled && (
            <div className="pl-7 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Email Address
                </label>
                <input
                  type="email"
                  name="orderNotificationEmail"
                  value={settings.orderNotificationEmail || ''}
                  onChange={handleInputChange}
                  className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="notifications@yourbusiness.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Order notifications will be sent to this email address. Leave empty to use your business email.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">What you'll be notified about:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• New orders placed by customers</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.orderNotificationLastUpdate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    Email last updated: {formatDate(settings.orderNotificationLastUpdate)}
                  </div>
                )}
                {settings.lastOrderNotified && (
                  <div className="flex items-center text-sm text-gray-600">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Last notified: {settings.lastOrderNotified}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            {pagination?.total > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {pagination.total} total notifications
              </p>
            )}
          </div>
          <button
            onClick={refreshNotifications}
            disabled={loadingNotifications}
            className="flex items-center text-sm text-teal-600 hover:text-teal-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loadingNotifications ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loadingNotifications ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">
              {settings.orderNotificationsEnabled 
                ? "Notifications will appear here when customers place orders"
                : "Enable notifications above to start receiving order alerts"
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification.orderNumber)}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-teal-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-teal-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900 flex items-center">
                            {notification.orderNumber}
                            <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.orderStatus)}`}>
                            {formatStatus(notification.orderStatus)}
                          </span>
                        </div>
                        
                        {/* Details */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            <span className="truncate">{notification.customerName}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            <span className="font-medium">{formatCurrency(notification.total)}</span>
                          </div>
                        </div>
                        
                        {/* Timestamp */}
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Notified {formatDateTime(notification.notifiedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center text-sm">
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Admin Received</span>
                        </div>
                      </div>
                      
                      {/* Error details */}
                      {notification.emailError && (
                        <div className="max-w-xs">
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <p className="text-xs text-red-700 truncate" title={notification.emailError}>
                              {notification.emailError}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination?.pages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} notifications
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-2">Email Notification Tips:</p>
            <ul className="space-y-1">
              <li>• Check your spam folder if you don't receive notifications</li>
              <li>• Add the sender to your contacts to ensure delivery</li>
              <li>• Test notifications by placing a test order</li>
              <li>• Use a dedicated email for better organization</li>
              <li>• Click on notification rows above to view order details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}