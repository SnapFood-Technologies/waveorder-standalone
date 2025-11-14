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
  notifyOnAdminCreatedOrders: boolean
  notifyAdminOnPickedUpAndPaid: boolean
  notifyAdminOnStatusUpdates: boolean
  lastOrderNotified?: string | null
  // Customer notification settings (global)
  customerNotificationEnabled: boolean
  notifyCustomerOnConfirmed: boolean
  notifyCustomerOnPreparing: boolean
  notifyCustomerOnReady: boolean
  notifyCustomerOnOutForDelivery: boolean
  notifyCustomerOnDelivered: boolean
  notifyCustomerOnCancelled: boolean
  // Order-type specific settings
  notifyDeliveryOnConfirmed: boolean
  notifyDeliveryOnPreparing: boolean
  notifyDeliveryOnOutForDelivery: boolean
  notifyDeliveryOnDelivered: boolean
  notifyPickupOnConfirmed: boolean
  notifyPickupOnPreparing: boolean
  notifyPickupOnReady: boolean
  notifyPickupOnDelivered: boolean
  notifyDineInOnConfirmed: boolean
  notifyDineInOnPreparing: boolean
  notifyDineInOnReady: boolean
  notifyDineInOnDelivered: boolean
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
  timeFormat?: string
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
    notifyOnAdminCreatedOrders: false,
    notifyAdminOnPickedUpAndPaid: true,
    notifyAdminOnStatusUpdates: false,
    lastOrderNotified: null,
    // Customer notification settings (global)
    customerNotificationEnabled: false,
    notifyCustomerOnConfirmed: false,
    notifyCustomerOnPreparing: false,
    notifyCustomerOnReady: true,
    notifyCustomerOnOutForDelivery: true,
    notifyCustomerOnDelivered: true,
    notifyCustomerOnCancelled: true,
    // Order-type specific settings
    notifyDeliveryOnConfirmed: false,
    notifyDeliveryOnPreparing: false,
    notifyDeliveryOnOutForDelivery: true,
    notifyDeliveryOnDelivered: true,
    notifyPickupOnConfirmed: false,
    notifyPickupOnPreparing: false,
    notifyPickupOnReady: true,
    notifyPickupOnDelivered: false,
    notifyDineInOnConfirmed: false,
    notifyDineInOnPreparing: false,
    notifyDineInOnReady: true,
    notifyDineInOnDelivered: false
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
          notifyOnAdminCreatedOrders: data.business.notifyOnAdminCreatedOrders || false,
          notifyAdminOnPickedUpAndPaid: data.business.notifyAdminOnPickedUpAndPaid ?? true,
          notifyAdminOnStatusUpdates: data.business.notifyAdminOnStatusUpdates ?? false,
          lastOrderNotified: data.business.lastOrderNotified,
          // Customer notification settings (global)
          customerNotificationEnabled: data.business.customerNotificationEnabled ?? false,
          notifyCustomerOnConfirmed: data.business.notifyCustomerOnConfirmed ?? false,
          notifyCustomerOnPreparing: data.business.notifyCustomerOnPreparing ?? false,
          notifyCustomerOnReady: data.business.notifyCustomerOnReady ?? true,
          notifyCustomerOnOutForDelivery: data.business.notifyCustomerOnOutForDelivery ?? true,
          notifyCustomerOnDelivered: data.business.notifyCustomerOnDelivered ?? true,
          notifyCustomerOnCancelled: data.business.notifyCustomerOnCancelled ?? true,
          // Order-type specific settings
          notifyDeliveryOnConfirmed: data.business.notifyDeliveryOnConfirmed ?? false,
          notifyDeliveryOnPreparing: data.business.notifyDeliveryOnPreparing ?? false,
          notifyDeliveryOnOutForDelivery: data.business.notifyDeliveryOnOutForDelivery ?? true,
          notifyDeliveryOnDelivered: data.business.notifyDeliveryOnDelivered ?? true,
          notifyPickupOnConfirmed: data.business.notifyPickupOnConfirmed ?? false,
          notifyPickupOnPreparing: data.business.notifyPickupOnPreparing ?? false,
          notifyPickupOnReady: data.business.notifyPickupOnReady ?? true,
          notifyPickupOnDelivered: data.business.notifyPickupOnDelivered ?? false,
          notifyDineInOnConfirmed: data.business.notifyDineInOnConfirmed ?? false,
          notifyDineInOnPreparing: data.business.notifyDineInOnPreparing ?? false,
          notifyDineInOnReady: data.business.notifyDineInOnReady ?? true,
          notifyDineInOnDelivered: data.business.notifyDineInOnDelivered ?? false
        })
        setBusiness({ 
          currency: data.business.currency,
          timeFormat: data.business.timeFormat || '24'
        })
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
      // Use the order notifications endpoint specifically for OrderNotifications
      const response = await fetch(`/api/admin/stores/${businessId}/notifications/order-notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching order notifications:', error)
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
      case 'picked_up': return 'text-emerald-600 bg-emerald-100'
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
    const timeFormat = business?.timeFormat || '24'
    const use24Hour = timeFormat === '24'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifyOnAdminCreatedOrders"
                  checked={settings.notifyOnAdminCreatedOrders}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Also notify when I create orders from admin panel
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifyAdminOnPickedUpAndPaid"
                  checked={settings.notifyAdminOnPickedUpAndPaid}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Notify me when customer picks up order and payment is received
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7 mt-1">
                You will receive an email notification when an order is picked up (status is READY or DELIVERED) and payment is marked as PAID.
              </p>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notifyAdminOnStatusUpdates"
                  checked={settings.notifyAdminOnStatusUpdates}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Receive same status update notifications as customers
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-7 mt-1">
                When enabled, you will receive email notifications for all order status updates (Confirmed, Preparing, Ready, etc.) just like your customers do. This helps you stay informed about order progress.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">What you'll be notified about:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• New orders placed by customers</li>
                  {settings.notifyOnAdminCreatedOrders && (
                    <li>• Orders you create from the admin panel</li>
                  )}
                  {settings.notifyAdminOnPickedUpAndPaid && (
                    <li>• Orders picked up and paid (READY/DELIVERED status with PAID payment)</li>
                  )}
                  {settings.notifyAdminOnStatusUpdates && (
                    <li>• All order status updates (same notifications as customers receive)</li>
                  )}
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

      {/* Customer Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <User className="w-5 h-5 text-teal-600 mr-2" />
          Customer Email Notifications
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Choose which order status updates should trigger email notifications to your customers.
          Customers will only receive emails if they have an email address on file.
        </p>

        <div className="space-y-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="customerNotificationEnabled"
              checked={settings.customerNotificationEnabled}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label className="ml-3 text-sm font-medium text-gray-700">
              Enable customer email notifications
            </label>
          </div>

          {settings.customerNotificationEnabled && (
            <div className="pl-7 space-y-6 border-l-2 border-teal-200">
              <p className="text-sm text-gray-600 mb-4">
                Configure notifications per order type. Settings are applied based on whether an order is DELIVERY, PICKUP, or DINE_IN.
              </p>

              {/* Delivery Orders */}
              <div className="space-y-3 border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                  🚚 Delivery Orders
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Confirmed</label>
                    <input type="checkbox" name="notifyDeliveryOnConfirmed" checked={settings.notifyDeliveryOnConfirmed} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Preparing</label>
                    <input type="checkbox" name="notifyDeliveryOnPreparing" checked={settings.notifyDeliveryOnPreparing} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Out for Delivery</label>
                    <input type="checkbox" name="notifyDeliveryOnOutForDelivery" checked={settings.notifyDeliveryOnOutForDelivery} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Delivered</label>
                    <input type="checkbox" name="notifyDeliveryOnDelivered" checked={settings.notifyDeliveryOnDelivered} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                </div>
              </div>

              {/* Pickup Orders */}
              <div className="space-y-3 border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                  🏪 Pickup Orders
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Confirmed</label>
                    <input type="checkbox" name="notifyPickupOnConfirmed" checked={settings.notifyPickupOnConfirmed} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Preparing</label>
                    <input type="checkbox" name="notifyPickupOnPreparing" checked={settings.notifyPickupOnPreparing} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Ready</label>
                    <input type="checkbox" name="notifyPickupOnReady" checked={settings.notifyPickupOnReady} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Picked Up</label>
                    <input type="checkbox" name="notifyPickupOnDelivered" checked={settings.notifyPickupOnDelivered} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                </div>
              </div>

              {/* Dine-in Orders */}
              <div className="space-y-3 border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                  🍽️ Dine-in Orders
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Confirmed</label>
                    <input type="checkbox" name="notifyDineInOnConfirmed" checked={settings.notifyDineInOnConfirmed} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Preparing</label>
                    <input type="checkbox" name="notifyDineInOnPreparing" checked={settings.notifyDineInOnPreparing} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Ready</label>
                    <input type="checkbox" name="notifyDineInOnReady" checked={settings.notifyDineInOnReady} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <label className="text-sm text-gray-700">Picked Up</label>
                    <input type="checkbox" name="notifyDineInOnDelivered" checked={settings.notifyDineInOnDelivered} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  </div>
                </div>
              </div>

              {/* Global Settings */}
              <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">All Order Types</h3>
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <label className="text-sm text-gray-700">Cancelled</label>
                  <input type="checkbox" name="notifyCustomerOnCancelled" checked={settings.notifyCustomerOnCancelled} onChange={handleInputChange} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Customers will only receive email notifications if they have an email address on file. 
                  Notifications are sent automatically when you update order status in the order details page.
                  Settings are applied based on the order type (DELIVERY, PICKUP, or DINE_IN).
                </p>
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
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification.orderStatus || '')}`}>
                            {formatStatus(notification.orderStatus || '')}
                          </span>
                        </div>
                        
                        {/* Details */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center flex-1 min-w-0">
                            <User className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate" title={notification.customerName}>{notification.customerName}</span>
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