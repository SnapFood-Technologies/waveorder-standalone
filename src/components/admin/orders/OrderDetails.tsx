// src/components/admin/orders/OrderDetails.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  ShoppingBag, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CreditCard, 
  FileText, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Package,
  Calendar,
  DollarSign,
  Truck,
  Store,
  UtensilsCrossed,
  Trash2,
  Receipt,
  FastForward
} from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'
import toast from 'react-hot-toast'

interface OrderDetailsProps {
  businessId: string
  orderId: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  addressJson: {
    street: string
    additional: string
    zipCode: string
    city: string
    country: string
    latitude?: number
    longitude?: number
  } | null
  tier: string
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  originalPrice?: number | null
  modifiers: Array<{
    id: string
    name: string
    price: number
    required: boolean
  }>
  product: {
    id: string
    name: string
    description: string | null
    images: string[]
  }
  variant: {
    id: string
    name: string
  } | null
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  type: 'DELIVERY' | 'PICKUP' | 'DINE_IN'
  total: number
  subtotal: number
  deliveryFee: number
  tax: number
  discount: number
  createdByAdmin: boolean
  customer: Customer
  items: OrderItem[]
  deliveryAddress: string | null
  deliveryTime: string | null
  notes: string | null
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod: string | null
  customerLatitude: number | null
  customerLongitude: number | null
  whatsappMessageId: string | null
  postalPricingId: string | null
  postalPricing: {
    name: string
    nameAl: string | null
    nameEl: string | null
    deliveryTime: string | null
    deliveryTimeAl: string | null
    deliveryTimeEl: string | null
    price: number
  } | null
  deliveryPersonId: string | null
  deliveryPerson: {
    id: string
    name: string
    email: string
  } | null
  invoiceType?: 'INVOICE' | 'RECEIPT' | null  // Invoice/Receipt selection (for Greek storefronts)
  invoiceAfm?: string | null  // Tax ID (AFM) - 9 digits
  invoiceCompanyName?: string | null  // Company name
  invoiceTaxOffice?: string | null  // Tax office (ΔΟΥ)
  createdAt: string
  updatedAt: string
}

interface Business {
  name: string
  currency: string
  whatsappNumber: string
  businessType: string
  language: string
  storefrontLanguage?: string
  translateContentToBusinessLanguage?: boolean
  timeFormat?: string
  // Notification settings
  customerNotificationEnabled?: boolean
  notifyPickupOnConfirmed?: boolean
  notifyPickupOnPreparing?: boolean
  notifyPickupOnReady?: boolean
  notifyDeliveryOnConfirmed?: boolean
  notifyDeliveryOnPreparing?: boolean
  notifyDeliveryOnOutForDelivery?: boolean
  notifyDineInOnConfirmed?: boolean
  notifyDineInOnPreparing?: boolean
  notifyDineInOnReady?: boolean
}

export default function OrderDetails({ businessId, orderId }: OrderDetailsProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [order, setOrder] = useState<Order | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form states
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('')
  const [orderNotes, setOrderNotes] = useState<string>('')
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [whatsappMessage, setWhatsappMessage] = useState<string>('')
  const [deliveryTime, setDeliveryTime] = useState<string>('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [enableDeliveryManagement, setEnableDeliveryManagement] = useState(false)
  const [deliveryPersons, setDeliveryPersons] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [assigningDelivery, setAssigningDelivery] = useState(false)
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState<string>('')
  
  // Packaging tracking
  const [packagingTrackingEnabled, setPackagingTrackingEnabled] = useState(false)
  const [packagingTypes, setPackagingTypes] = useState<Array<{ id: string; name: string; unit: string }>>([])
  const [orderPackaging, setOrderPackaging] = useState<Array<{
    id: string
    packagingTypeId: string
    quantity: number
    itemsPerPackage: number | null
    cost: number | null
    notes: string | null
    packagingType: { id: string; name: string; unit: string }
  }>>([])
  const [showAddPackaging, setShowAddPackaging] = useState(false)
  const [newPackagingTypeId, setNewPackagingTypeId] = useState('')
  const [newPackagingQuantity, setNewPackagingQuantity] = useState('1')
  const [newPackagingItemsPerPackage, setNewPackagingItemsPerPackage] = useState('')
  const [newPackagingCost, setNewPackagingCost] = useState('')
  const [newPackagingNotes, setNewPackagingNotes] = useState('')
  const [addingPackaging, setAddingPackaging] = useState(false)

  useEffect(() => {
    fetchOrder()
    fetchBusinessSettings()
    if (order?.type === 'DELIVERY') {
      fetchDeliveryPersons()
    }
  }, [businessId, orderId])

  useEffect(() => {
    if (packagingTrackingEnabled) {
      fetchPackagingTypes()
      fetchOrderPackaging()
    }
  }, [packagingTrackingEnabled, orderId])

  useEffect(() => {
    if (order?.type === 'DELIVERY' && enableDeliveryManagement) {
      fetchDeliveryPersons()
      setSelectedDeliveryPersonId(order.deliveryPersonId || '')
    }
  }, [order?.type, order?.deliveryPersonId, enableDeliveryManagement])

  const fetchBusinessSettings = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setEnableDeliveryManagement(data.business?.enableDeliveryManagement || false)
      }
    } catch (error) {
      console.error('Error fetching business settings:', error)
    }
  }

  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
      if (response.ok) {
        const data = await response.json()
        const deliveryPersonsList = data.members
          .filter((m: any) => m.role === 'DELIVERY')
          .map((m: any) => ({
            id: m.userId,
            name: m.name,
            email: m.email
          }))
        setDeliveryPersons(deliveryPersonsList)
      }
    } catch (error) {
      console.error('Error fetching delivery persons:', error)
    }
  }

  const handleAssignDeliveryPerson = async () => {
    if (!order) return
    
    setAssigningDelivery(true)
    try {
      const response = await fetch(
        `/api/admin/stores/${businessId}/orders/${orderId}/assign-delivery`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryPersonId: selectedDeliveryPersonId || null
          })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to assign delivery person')
      }

      toast.success(selectedDeliveryPersonId ? 'Delivery person assigned' : 'Delivery person unassigned')
      fetchOrder()
    } catch (error) {
      console.error('Error assigning delivery person:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assign delivery person')
    } finally {
      setAssigningDelivery(false)
    }
  }

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        setBusiness(data.business)
        setSelectedStatus(data.order.status)
        setSelectedPaymentStatus(data.order.paymentStatus)
        setOrderNotes(data.order.notes || '')
        setDeliveryTime(data.order.deliveryTime ? new Date(data.order.deliveryTime).toISOString().slice(0, 16) : '')
        setInvoiceAfm(data.order.invoiceAfm || '')
        setInvoiceCompanyName(data.order.invoiceCompanyName || '')
        setInvoiceTaxOffice(data.order.invoiceTaxOffice || '')
      } else if (response.status === 404) {
        setError('Order not found')
      } else {
        setError('Failed to load order data')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Network error loading order data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!order) return
  
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}`, {
        method: 'DELETE'
      })
  
      if (response.ok) {
        setDeleteSuccess(true)
        setIsDeleting(false)
        
        setTimeout(() => {
          window.location.href = addParams(`/admin/stores/${businessId}/orders`)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete order')
        setIsDeleting(false)
      }
    } catch (error) {
      setError('Network error deleting order')
      setIsDeleting(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const getValidStatusOptions = (currentStatus: string, orderType?: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return ['PENDING', 'CONFIRMED', 'CANCELLED']
      case 'CONFIRMED':
        return ['CONFIRMED', 'PREPARING', 'CANCELLED']
      case 'PREPARING':
        return ['PREPARING', 'READY', 'CANCELLED']
      case 'READY':
        // For PICKUP and DINE_IN orders, can proceed to PICKED_UP
        // For DELIVERY orders, can proceed to OUT_FOR_DELIVERY or DELIVERED
        if (orderType === 'PICKUP' || orderType === 'DINE_IN') {
          return ['READY', 'PICKED_UP', 'CANCELLED']
        } else {
          return ['READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
        }
      case 'PICKED_UP':
        return ['PICKED_UP', 'REFUNDED'] // PICKED_UP is final, can only refund
      case 'OUT_FOR_DELIVERY':
        return ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
      case 'DELIVERED':
        return ['DELIVERED', 'REFUNDED']
      case 'CANCELLED':
        return ['CANCELLED', 'REFUNDED']
      case 'REFUNDED':
        return ['REFUNDED']
      default:
        return ['PENDING']
    }
  }

  // Helper to get the final status based on order type
  const getFinalStatus = (orderType?: string) => {
    if (orderType === 'PICKUP' || orderType === 'DINE_IN') {
      return 'PICKED_UP'
    }
    return 'DELIVERED'
  }

  // Check if the order can be marked as complete (skip to final status)
  const canMarkAsComplete = (currentStatus: string, orderType?: string) => {
    const finalStatuses = ['PICKED_UP', 'DELIVERED', 'CANCELLED', 'REFUNDED']
    if (finalStatuses.includes(currentStatus)) {
      return false
    }
    // Can skip if not already at final status
    return true
  }

  const updateOrderStatus = async (newStatus: string, rejectReason?: string) => {
    if (!order) return

    try {
      setUpdating(true)
      
      const updateData: any = { 
        status: newStatus 
      }

      if (newStatus === 'CANCELLED' && rejectReason) {
        const existingNotes = order.notes || ''
        const rejectionNote = `[REJECTED] ${rejectReason}`
        updateData.notes = existingNotes ? `${existingNotes}\n\n${rejectionNote}` : rejectionNote
      }

      const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const data = await response.json()
        
        if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
            await revertOrderStock()
          }
        
        // Refresh order data to get latest status and other updates
        await fetchOrder()
        
        showSuccess(`Order status updated to ${newStatus.toLowerCase().replace(/_/g, ' ')}`)
        setShowRejectModal(false)
        setRejectionReason('')
        
        if (newStatus !== 'CANCELLED') {
          // Only show WhatsApp modal if customer notifications are enabled for this status
          const shouldShowWhatsApp = shouldShowWhatsAppModal(newStatus, order.type, business)
          if (shouldShowWhatsApp) {
            // Generate message with newStatus directly to avoid race condition
            // React state updates are async, so order.status might still be old
            // Passing newStatus ensures the message shows the correct status
            setWhatsappMessage(generateWhatsAppMessage(newStatus))
            setShowWhatsAppModal(true)
          }
        }
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      setError('Network error updating order')
    } finally {
      setUpdating(false)
    }
  }

  const updatePaymentStatus = async (newPaymentStatus: string) => {
    if (!order) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newPaymentStatus })
      })

      if (response.ok) {
        await fetchOrder()
        showSuccess(`Payment status updated to ${newPaymentStatus.toLowerCase()}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update payment status')
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      setError('Network error updating payment status')
    } finally {
      setUpdating(false)
    }
  }

  const updateDeliveryTime = async () => {
    if (!order) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryTime: deliveryTime ? new Date(deliveryTime).toISOString() : null 
        })
      })

      if (response.ok) {
        await fetchOrder()
        showSuccess('Delivery time updated successfully')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update delivery time')
      }
    } catch (error) {
      console.error('Error updating delivery time:', error)
      setError('Network error updating delivery time')
    } finally {
      setUpdating(false)
    }
  }

  const revertOrderStock = async () => {
    if (!order) return

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}/revert-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        console.error('Failed to revert stock for cancelled order')
      }
    } catch (error) {
      console.error('Error reverting stock:', error)
    }
  }

  const updateOrderNotes = async () => {
    if (!order) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: orderNotes })
      })

      if (response.ok) {
        await fetchOrder()
        showSuccess('Order notes updated successfully')
        setEditingNotes(false)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update notes')
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      setError('Network error updating notes')
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      setShowRejectModal(true)
    } else {
      updateOrderStatus(newStatus)
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
    
    const symbol = currencySymbols[business?.currency || 'USD'] || (business?.currency || 'USD')
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const getStatusColor = (status: string) => {
    const styles = {
      PENDING: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      CONFIRMED: 'text-blue-600 bg-blue-100 border-blue-200',
      PREPARING: 'text-orange-600 bg-orange-100 border-orange-200',
      READY: 'text-green-600 bg-green-100 border-green-200',
      PICKED_UP: 'text-emerald-600 bg-emerald-100 border-emerald-200',
      OUT_FOR_DELIVERY: 'text-cyan-600 bg-cyan-100 border-cyan-200',
      DELIVERED: 'text-emerald-600 bg-emerald-100 border-emerald-200',
      CANCELLED: 'text-red-600 bg-red-100 border-red-200',
      REFUNDED: 'text-gray-600 bg-gray-100 border-gray-200'
    }
    return styles[status as keyof typeof styles] || styles.PENDING
  }

  const getPaymentStatusColor = (status: string) => {
    const styles = {
      PAID: 'text-green-600 bg-green-100',
      PENDING: 'text-yellow-600 bg-yellow-100',
      FAILED: 'text-red-600 bg-red-100',
      REFUNDED: 'text-gray-600 bg-gray-100'
    }
    return styles[status as keyof typeof styles] || styles.PENDING
  }

  const getTypeIcon = (type: string) => {
    if (!business) return <Package className="w-5 h-5" />
    
    const businessType = business.businessType
    
    switch (type) {
      case 'DELIVERY':
        switch (businessType) {
          case 'RESTAURANT':
          case 'CAFE':
          case 'GROCERY':
          case 'FLORIST':
            return <Truck className="w-5 h-5" />
          case 'RETAIL':
          case 'JEWELRY':
            return <Package className="w-5 h-5" />
          default:
            return <Truck className="w-5 h-5" />
        }
      case 'PICKUP':
        switch (businessType) {
          case 'RESTAURANT':
          case 'CAFE':
            return <ShoppingBag className="w-5 h-5" />
          case 'RETAIL':
          case 'JEWELRY':
            return <Store className="w-5 h-5" />
          case 'GROCERY':
            return <ShoppingBag className="w-5 h-5" />
          case 'FLORIST':
            return <Store className="w-5 h-5" />
          default:
            return <Store className="w-5 h-5" />
        }
      case 'DINE_IN':
        switch (businessType) {
          case 'RESTAURANT':
          case 'CAFE':
            return <UtensilsCrossed className="w-5 h-5" />
          case 'RETAIL':
          case 'JEWELRY':
            return <User className="w-5 h-5" />
          case 'GROCERY':
            return <ShoppingBag className="w-5 h-5" />
          case 'FLORIST':
            return <User className="w-5 h-5" />
          default:
            return <User className="w-5 h-5" />
        }
      default:
        return <Package className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const timeFormat = business?.timeFormat || '24'
    const use24Hour = timeFormat === '24'
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    })
  }

  // Check if WhatsApp modal should be shown based on notification settings
  const shouldShowWhatsAppModal = (status: string, orderType: string, business: Business | null): boolean => {
    if (!business || !business.customerNotificationEnabled) {
      return false
    }

    // Check order-type-specific settings first, then fall back to global
    switch (status) {
      case 'CONFIRMED':
        if (orderType === 'DELIVERY') {
          return business.notifyDeliveryOnConfirmed ?? false
        }
        if (orderType === 'PICKUP') {
          return business.notifyPickupOnConfirmed ?? false
        }
        if (orderType === 'DINE_IN') {
          return business.notifyDineInOnConfirmed ?? false
        }
        return false

      case 'PREPARING':
        if (orderType === 'DELIVERY') {
          return business.notifyDeliveryOnPreparing ?? false
        }
        if (orderType === 'PICKUP') {
          return business.notifyPickupOnPreparing ?? false
        }
        if (orderType === 'DINE_IN') {
          return business.notifyDineInOnPreparing ?? false
        }
        return false

      case 'READY':
        // READY doesn't apply to DELIVERY (they use OUT_FOR_DELIVERY instead)
        if (orderType === 'DELIVERY') {
          return false
        }
        if (orderType === 'PICKUP') {
          return business.notifyPickupOnReady ?? true
        }
        if (orderType === 'DINE_IN') {
          return business.notifyDineInOnReady ?? true
        }
        return true

      case 'OUT_FOR_DELIVERY':
        // OUT_FOR_DELIVERY only applies to DELIVERY orders
        if (orderType !== 'DELIVERY') {
          return false
        }
        return business.notifyDeliveryOnOutForDelivery ?? true

      default:
        return false
    }
  }

  const generateWhatsAppMessage = (statusOverride?: string) => {
    if (!order || !business) return ''

    const currencySymbol = business.currency === 'USD' ? '$' : 
                          business.currency === 'EUR' ? '€' : 
                          business.currency === 'ALL' ? 'L' : 
                          business.currency === 'GBP' ? '£' : '$'

    // Determine language to use
    const useBusinessLanguage = business.translateContentToBusinessLanguage !== false
    const language = useBusinessLanguage ? (business.language || 'en') : 'en'
    const locale = language === 'es' ? 'es-ES' : language === 'sq' ? 'sq-AL' : 'en-US'

    // Get WhatsApp message translations
    const whatsappLabels = getWhatsAppLabels(language)
    const statusMessages = getWhatsAppStatusMessages(language, business?.businessType)

    // Use statusOverride if provided (for when status was just updated), otherwise use current order status
    const currentStatus = statusOverride || order.status || 'PENDING'
    const statusLabel = getStatusLabel(currentStatus, language, business?.businessType)
    
    let message = `${whatsappLabels.hello} ${order.customer.name}!\n\n`
    message += `${whatsappLabels.orderStatusUpdate} #${order.orderNumber} ${whatsappLabels.hasBeenUpdatedTo}: *${statusLabel}*\n\n`
    
    if (order.type === 'DELIVERY' && order.deliveryAddress) {
      message += `📍 ${whatsappLabels.deliveryAddress}: ${order.deliveryAddress}\n`
    } else if (order.type === 'PICKUP') {
      message += `🏪 ${whatsappLabels.pickupAt}: ${business.name}\n`
    } else if (order.type === 'DINE_IN') {
      message += `🍽️ ${whatsappLabels.dineInAt}: ${business.name}\n`
    }
    
    message += `💰 ${whatsappLabels.total}: ${formatCurrency(order.total)}\n`
    
    // Add invoice/receipt selection if present (for Greek storefronts)
    if (order.invoiceType && language === 'el') {
      const invoiceLabel = order.invoiceType === 'INVOICE' ? 'Τιμολόγιο' : 'Απόδειξη'
      message += `\n${invoiceLabel}: Ναι\n`
    }
    
    if (order.deliveryTime) {
      const deliveryDate = new Date(order.deliveryTime)
      const timeFormat = business?.timeFormat || '24'
      const use24Hour = timeFormat === '24'
      
      let timeLabel: string
      if (order.type === 'DELIVERY') {
        timeLabel = whatsappLabels.deliveryTime
      } else if (order.type === 'PICKUP') {
        timeLabel = whatsappLabels.pickupTime
      } else {
        timeLabel = whatsappLabels.arrivalTime
      }
      
      let timeString: string
      if (use24Hour) {
        // 24-hour format
        timeString = deliveryDate.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) + ' ' + whatsappLabels.at + ' ' + deliveryDate.toTimeString().slice(0, 5)
      } else {
        // 12-hour format
        timeString = deliveryDate.toLocaleString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }
      
      message += `⏰ ${timeLabel}: ${timeString}\n`
    }
    
    // Get status-specific message
    const statusKey = currentStatus.toUpperCase()
    let statusMessage = ''
    
    switch (statusKey) {
      case 'CONFIRMED':
        statusMessage = statusMessages.CONFIRMED
        break
      case 'PREPARING':
        statusMessage = statusMessages.PREPARING
        break
      case 'READY':
        if (order.type === 'PICKUP') {
          statusMessage = statusMessages.READY_PICKUP
        } else if (order.type === 'DINE_IN') {
          statusMessage = statusMessages.READY_DINE_IN
        } else {
          statusMessage = statusMessages.READY_DELIVERY
        }
        break
      case 'PICKED_UP':
        if (order.type === 'PICKUP') {
          statusMessage = statusMessages.PICKED_UP_PICKUP
        } else if (order.type === 'DINE_IN') {
          statusMessage = statusMessages.PICKED_UP_DINE_IN
        } else {
          statusMessage = statusMessages.PICKED_UP_DELIVERY
        }
        break
      case 'OUT_FOR_DELIVERY':
        statusMessage = statusMessages.OUT_FOR_DELIVERY
        break
      case 'DELIVERED':
        statusMessage = statusMessages.DELIVERED
        break
    }
    
    if (statusMessage) {
      message += `\n${statusMessage}\n`
    }
    
    message += `\n${whatsappLabels.thankYou} ${business.name}!`

    return message
  }

  // Helper function to get WhatsApp labels
  const getWhatsAppLabels = (language: string = 'en'): Record<string, string> => {
    const labels: Record<string, Record<string, string>> = {
      en: {
        hello: 'Hello',
        orderStatusUpdate: 'Your order',
        hasBeenUpdatedTo: 'status has been updated to',
        deliveryAddress: 'Delivery Address',
        pickupAt: 'Pickup at',
        dineInAt: 'Dine-in at',
        total: 'Total',
        deliveryTime: 'Delivery time',
        pickupTime: 'Pickup time',
        arrivalTime: 'Arrival time',
        at: 'at',
        thankYou: 'Thank you for choosing'
      },
      es: {
        hello: 'Hola',
        orderStatusUpdate: 'Tu pedido',
        hasBeenUpdatedTo: 'ha sido actualizado a',
        deliveryAddress: 'Dirección de Entrega',
        pickupAt: 'Recogida en',
        dineInAt: 'Comer aquí en',
        total: 'Total',
        deliveryTime: 'Hora de entrega',
        pickupTime: 'Hora de recogida',
        arrivalTime: 'Hora de llegada',
        at: 'a las',
        thankYou: 'Gracias por elegir'
      },
      sq: {
        hello: 'Përshëndetje',
        orderStatusUpdate: 'Porosia juaj',
        hasBeenUpdatedTo: 'është përditësuar në',
        deliveryAddress: 'Adresa e Dorëzimit',
        pickupAt: 'Marrje në',
        dineInAt: 'Në vend në',
        total: 'Total',
        deliveryTime: 'Koha e dorëzimit',
        pickupTime: 'Koha e marrjes',
        arrivalTime: 'Koha e mbërritjes',
        at: 'në',
        thankYou: 'Faleminderit që na zgjodhët'
      }
    }
    return labels[language] || labels.en
  }

  // Helper function to get WhatsApp status messages
  const getWhatsAppStatusMessages = (language: string = 'en', businessType?: string): Record<string, string> => {
    const isRetail = businessType === 'RETAIL'
    const baseMessages: Record<string, Record<string, string>> = {
      en: {
        CONFIRMED: '✅ Your order has been confirmed and we\'re preparing it for you!',
        PREPARING: '👨‍🍳 Your order is being prepared with care!',
        PREPARING_RETAIL: '📦 Your order is being prepared for shipment!',
        READY_PICKUP: '🎉 Your order is ready for pickup!',
        READY_DINE_IN: '🎉 Your table is ready!',
        READY_DELIVERY: '🎉 Your order is ready!',
        PICKED_UP_PICKUP: '✨ Your order has been picked up. Thank you!',
        PICKED_UP_DINE_IN: '✨ Enjoy your meal! Thank you!',
        PICKED_UP_DELIVERY: '✨ Your order is complete. Thank you!',
        OUT_FOR_DELIVERY: '🚗 Your order is on its way to you!',
        DELIVERED: '✨ Your order has been delivered. Enjoy!'
      },
      es: {
        CONFIRMED: '✅ ¡Tu pedido ha sido confirmado y lo estamos preparando para ti!',
        PREPARING: '👨‍🍳 ¡Tu pedido se está preparando con cuidado!',
        PREPARING_RETAIL: '📦 ¡Tu pedido se está preparando para el envío!',
        READY_PICKUP: '🎉 ¡Tu pedido está listo para recoger!',
        READY_DINE_IN: '🎉 ¡Tu mesa está lista!',
        READY_DELIVERY: '🎉 ¡Tu pedido está listo!',
        PICKED_UP_PICKUP: '✨ ¡Tu pedido ha sido recogido. Gracias!',
        PICKED_UP_DINE_IN: '✨ ¡Que disfrutes tu comida! ¡Gracias!',
        PICKED_UP_DELIVERY: '✨ ¡Tu pedido está completo. Gracias!',
        OUT_FOR_DELIVERY: '🚗 ¡Tu pedido está en camino hacia ti!',
        DELIVERED: '✨ ¡Tu pedido ha sido entregado. ¡Que lo disfrutes!'
      },
      sq: {
        CONFIRMED: '✅ Porosia juaj është konfirmuar dhe po e përgatisim për ju!',
        PREPARING: '👨‍🍳 Porosia juaj po përgatitet me kujdes!',
        PREPARING_RETAIL: '📦 Porosia juaj po përgatitet për dërgim!',
        READY_PICKUP: '🎉 Porosia juaj është gati për marrje!',
        READY_DINE_IN: '🎉 Tavolina juaj është gati!',
        READY_DELIVERY: '🎉 Porosia juaj është gati!',
        PICKED_UP_PICKUP: '✨ Porosia juaj është marrë. Faleminderit!',
        PICKED_UP_DINE_IN: '✨ Shijoni ushqimin tuaj! Faleminderit!',
        PICKED_UP_DELIVERY: '✨ Porosia juaj është e plotë. Faleminderit!',
        OUT_FOR_DELIVERY: '🚗 Porosia juaj është në rrugë për tek ju!',
        DELIVERED: '✨ Porosia juaj është dorëzuar. Shijoni!'
      }
    }
    const messages = baseMessages[language] || baseMessages.en
    return {
      ...messages,
      PREPARING: isRetail ? messages.PREPARING_RETAIL : messages.PREPARING
    }
  }

  // Helper function to get status label
  const getStatusLabel = (status: string, language: string = 'en', businessType?: string): string => {
    const statusLabels: Record<string, Record<string, string>> = {
      en: {
        PENDING: 'Pending',
        CONFIRMED: 'Confirmed',
        PREPARING: businessType === 'RETAIL' ? 'Preparing Shipment' : 'Preparing',
        READY: 'Ready',
        PICKED_UP: 'Picked Up',
        OUT_FOR_DELIVERY: 'Out for Delivery',
        DELIVERED: 'Delivered',
        CANCELLED: 'Cancelled',
        REFUNDED: 'Refunded'
      },
      es: {
        PENDING: 'Pendiente',
        CONFIRMED: 'Confirmado',
        PREPARING: businessType === 'RETAIL' ? 'Preparando Envío' : 'Preparando',
        READY: 'Listo',
        PICKED_UP: 'Recogido',
        OUT_FOR_DELIVERY: 'En Camino',
        DELIVERED: 'Entregado',
        CANCELLED: 'Cancelado',
        REFUNDED: 'Reembolsado'
      },
      sq: {
        PENDING: 'Në Pritje',
        CONFIRMED: 'E Konfirmuar',
        PREPARING: businessType === 'RETAIL' ? 'Duke U Përgatitur Dërgimin' : 'Duke U Përgatitur',
        READY: 'Gati',
        PICKED_UP: 'Marrë',
        OUT_FOR_DELIVERY: 'Në Rrugë',
        DELIVERED: 'Dorëzuar',
        CANCELLED: 'Anuluar',
        REFUNDED: 'Rimbursuar'
      }
    }
    const labels = statusLabels[language] || statusLabels.en
    return labels[status.toUpperCase()] || status.replace(/_/g, ' ')
  }

  // Helper function to get admin UI labels
  const getAdminUILabels = (language: string = 'en'): Record<string, string> => {
    const labels: Record<string, Record<string, string>> = {
      en: {
        sendWhatsAppUpdate: 'Send WhatsApp Update',
        notifyCustomer: 'Notify customer about order status',
        sendWhatsAppUpdateTo: 'Send WhatsApp Update to',
        customizeMessage: 'Customize the message before sending to your customer:',
        whatsAppMessage: 'WhatsApp Message',
        cancel: 'Cancel',
        sendWhatsAppMessage: 'Send WhatsApp Message',
        resetToDefault: 'Reset to Default',
        messagePreview: 'Message preview above'
      },
      es: {
        sendWhatsAppUpdate: 'Enviar Actualización de WhatsApp',
        notifyCustomer: 'Notificar al cliente sobre el estado del pedido',
        sendWhatsAppUpdateTo: 'Enviar Actualización de WhatsApp a',
        customizeMessage: 'Personaliza el mensaje antes de enviarlo a tu cliente:',
        whatsAppMessage: 'Mensaje de WhatsApp',
        cancel: 'Cancelar',
        sendWhatsAppMessage: 'Enviar Mensaje de WhatsApp',
        resetToDefault: 'Restablecer a Predeterminado',
        messagePreview: 'Vista previa del mensaje arriba'
      },
      sq: {
        sendWhatsAppUpdate: 'Dërgoni Përditësim WhatsApp',
        notifyCustomer: 'Njoftoni klientin për statusin e porosisë',
        sendWhatsAppUpdateTo: 'Dërgoni Përditësim WhatsApp te',
        customizeMessage: 'Përshtatni mesazhin para se ta dërgoni klientit tuaj:',
        whatsAppMessage: 'Mesazh WhatsApp',
        cancel: 'Anulo',
        sendWhatsAppMessage: 'Dërgoni Mesazh WhatsApp',
        resetToDefault: 'Rivendosni në Parazgjedhje',
        messagePreview: 'Parapamje e mesazhit më sipër'
      }
    }
    return labels[language] || labels.en
  }

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-pulse space-y-6 p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Order</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Link
            href={addParams(`/admin/stores/${businessId}/orders`)}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  if (!order || !business) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist or you don't have access to view it.
          </p>
        </div>
      </div>
    )
  }

  // Get admin UI labels based on business language (after we know business exists)
  const useBusinessLanguage = business.translateContentToBusinessLanguage !== false
  const adminLanguage = useBusinessLanguage ? (business.language || 'en') : 'en'
  const adminUILabels = getAdminUILabels(adminLanguage)

  return (
    <div className="max-w-8xl mx-auto space-y-6">
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

      {/* Header - Mobile Responsive */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/orders`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border w-fit mt-2 sm:mt-0 ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status, adminLanguage, business?.businessType)}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Order details and management</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        {order.createdByAdmin && (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 w-fit">
      <User className="w-3 h-3 mr-1" />
      Admin Created
    </span>
  )}
          <button
            onClick={() => setEditingNotes(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            {order.notes ? 'Edit Notes' : 'Add Notes'}
          </button>
          <button
    onClick={() => setShowDeleteModal(true)}
    className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
  >
    <Trash2 className="w-4 h-4 mr-2" />
    Delete Order
  </button>
          <Link
            href={addParams(`/admin/stores/${businessId}/customers/${order.customer.id}`)}
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            <User className="w-4 h-4 mr-2" />
            View Customer
          </Link>
        </div>
      </div>

      {/* Status Update Section */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
    <Edit className="w-5 h-5 mr-2 text-teal-600" />
    Update Order Statuses & Delivery
  </h2>
  
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    {/* Order Status */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
  <div className="flex flex-col sm:flex-row xl:flex-col items-stretch space-y-3 sm:space-y-0 sm:space-x-3 xl:space-x-0 xl:space-y-3">
    <select 
      value={selectedStatus} 
      onChange={(e) => setSelectedStatus(e.target.value)}
      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      disabled={updating}
    >
      {getValidStatusOptions(order.status, order.type).map(status => (
        <option key={status} value={status}>
          {getStatusLabel(status, business?.language || 'en', business?.businessType)}
        </option>
      ))}
    </select>
    <button
      onClick={() => handleStatusChange(selectedStatus)}
      disabled={updating || selectedStatus === order.status}
      className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {updating ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <Save className="w-4 h-4 mr-2" />
      )}
      Update Status
    </button>
  </div>
  
  {/* Quick Complete - Skip to final status */}
  {canMarkAsComplete(order.status, order.type) && (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => updateOrderStatus(getFinalStatus(order.type))}
        disabled={updating}
        className="flex items-center text-sm text-gray-600 hover:text-teal-600 transition-colors"
      >
        <FastForward className="w-4 h-4 mr-1.5" />
        Mark as {order.type === 'DELIVERY' ? 'Delivered' : 'Picked Up'}
        <span className="ml-1 text-xs text-gray-400">(skip steps)</span>
      </button>
    </div>
  )}
</div>

    {/* Payment Status */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
      <div className="flex flex-col sm:flex-row xl:flex-col items-stretch space-y-3 sm:space-y-0 sm:space-x-3 xl:space-x-0 xl:space-y-3">
        <select
          value={selectedPaymentStatus}
          onChange={(e) => setSelectedPaymentStatus(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          disabled={updating}
        >
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <button
          onClick={() => updatePaymentStatus(selectedPaymentStatus)}
          disabled={updating || selectedPaymentStatus === order.paymentStatus}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Update Payment
        </button>
      </div>
    </div>

    {/* Delivery/Pickup Time */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {order.type === 'DELIVERY' ? 'Delivery Time' : order.type === 'PICKUP' ? 'Pickup Time' : 'Arrival Time'}
      </label>
      <div className="flex flex-col sm:flex-row xl:flex-col items-stretch space-y-3 sm:space-y-0 sm:space-x-3 xl:space-x-0 xl:space-y-3">
        <input
          type="datetime-local"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          disabled={updating}
        />
        <div className="flex items-center space-x-2">
        <button
            onClick={updateDeliveryTime}
            disabled={updating}
            className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Clock className="w-4 h-4 mr-2" />
            )}
            Update Time
          </button>
          {deliveryTime && (
            <button
              onClick={() => {
                setDeliveryTime('')
                updateDeliveryTime()
              }}
              disabled={updating}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Clear time"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${order.type === 'DELIVERY' ? 'bg-blue-100' : order.type === 'PICKUP' ? 'bg-green-100' : 'bg-purple-100'}`}>
              {getTypeIcon(order.type)}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Order Type</p>
              <p className="text-lg font-bold text-gray-900">{order.type.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${order.paymentStatus === 'PAID' ? 'bg-green-100' : order.paymentStatus === 'FAILED' ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <CreditCard className={`w-5 h-5 ${order.paymentStatus === 'PAID' ? 'text-green-600' : order.paymentStatus === 'FAILED' ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Payment Status</p>
              <p className="text-lg font-bold text-gray-900">{order.paymentStatus}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-teal-600" />
              Customer Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Name</span>
                <span className="text-sm text-gray-900 font-medium">{order.customer.name}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <div className="flex items-center text-sm text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="hover:text-teal-600 transition-colors">
                    {order.customer.phone}
                  </a>
                </div>
              </div>
              
              {order.customer.email && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <div className="flex items-center text-sm text-gray-900">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${order.customer.email}`}
                       className="hover:text-teal-600 transition-colors">
                      {order.customer.email}
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Customer Type</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.customer.tier === 'VIP' ? 'bg-purple-100 text-purple-700' :
                  order.customer.tier === 'WHOLESALE' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {order.customer.tier}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-500">Order Date</span>
                <span className="text-sm text-gray-900">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Person Assignment */}
          {order.type === 'DELIVERY' && enableDeliveryManagement && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-teal-600" />
                Delivery Assignment
              </h3>
              
              <div className="space-y-3">
                {order.deliveryPerson ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{order.deliveryPerson.name}</p>
                        <p className="text-sm text-gray-500">{order.deliveryPerson.email}</p>
                      </div>
                      <button
                        onClick={async () => {
                          setSelectedDeliveryPersonId('')
                          setAssigningDelivery(true)
                          try {
                            const response = await fetch(
                              `/api/admin/stores/${businessId}/orders/${orderId}/assign-delivery`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  deliveryPersonId: null
                                })
                              }
                            )

                            if (!response.ok) {
                              const data = await response.json()
                              throw new Error(data.message || 'Failed to unassign delivery person')
                            }

                            toast.success('Delivery person unassigned')
                            fetchOrder()
                          } catch (error) {
                            console.error('Error unassigning delivery person:', error)
                            toast.error(error instanceof Error ? error.message : 'Failed to unassign delivery person')
                          } finally {
                            setAssigningDelivery(false)
                          }
                        }}
                        disabled={assigningDelivery}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Unassign
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedDeliveryPersonId}
                      onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={assigningDelivery}
                    >
                      <option value="">Select delivery person</option>
                      {deliveryPersons.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name} ({person.email})
                        </option>
                      ))}
                    </select>
                    {deliveryPersons.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No delivery persons available. Create a team member with DELIVERY role.
                      </p>
                    )}
                    {selectedDeliveryPersonId && (
                      <button
                        onClick={handleAssignDeliveryPerson}
                        disabled={assigningDelivery}
                        className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {assigningDelivery ? 'Assigning...' : 'Assign Delivery Person'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Packaging Tracking */}
          {packagingTrackingEnabled && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  Packaging
                </h3>
                {!showAddPackaging && (
                  <button
                    onClick={() => setShowAddPackaging(true)}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Packaging
                  </button>
                )}
              </div>

              {showAddPackaging && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packaging Type *</label>
                    <select
                      value={newPackagingTypeId}
                      onChange={(e) => setNewPackagingTypeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select packaging type</option>
                      {packagingTypes.filter(t => t.id).map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={newPackagingQuantity}
                        onChange={(e) => setNewPackagingQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Items per Package</label>
                      <input
                        type="number"
                        min="1"
                        value={newPackagingItemsPerPackage}
                        onChange={(e) => setNewPackagingItemsPerPackage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost ({business?.currency || 'USD'})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPackagingCost}
                      onChange={(e) => setNewPackagingCost(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newPackagingNotes}
                      onChange={(e) => setNewPackagingNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={2}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAddPackaging}
                      disabled={addingPackaging || !newPackagingTypeId || !newPackagingQuantity}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingPackaging ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddPackaging(false)
                        setNewPackagingTypeId('')
                        setNewPackagingQuantity('1')
                        setNewPackagingItemsPerPackage('')
                        setNewPackagingCost('')
                        setNewPackagingNotes('')
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {orderPackaging.length > 0 ? (
                <div className="space-y-2">
                  {orderPackaging.map((pkg) => (
                    <div key={pkg.id} className="bg-gray-50 p-3 rounded-lg flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{pkg.packagingType.name}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {pkg.quantity} {pkg.packagingType.unit}
                          {pkg.itemsPerPackage && ` • ${pkg.itemsPerPackage} items per package`}
                          {pkg.cost && ` • Cost: ${business?.currency || 'USD'} ${pkg.cost.toFixed(2)}`}
                        </p>
                        {pkg.notes && (
                          <p className="text-xs text-gray-500 mt-1">{pkg.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemovePackaging(pkg.id)}
                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No packaging assigned to this order</p>
              )}
            </div>
          )}

          {/* Delivery Information */}
          {order.type === 'DELIVERY' && order.deliveryAddress && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-teal-600" />
                Delivery Information
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-gray-900">
                    {order.deliveryAddress}
                  </div>
                  {order.customerLatitude && order.customerLongitude && business?.businessType !== 'RETAIL' && (
                    <div>
                      <a
                        href={`https://maps.google.com/?q=${order.customerLatitude},${order.customerLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 text-xs"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Delivery Method (for RETAIL businesses) */}
                {business?.businessType === 'RETAIL' && order.postalPricing && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Delivery Method
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {business?.language === 'sq' && order.postalPricing.nameAl 
                            ? order.postalPricing.nameAl 
                            : business?.language === 'el' && order.postalPricing.nameEl
                              ? order.postalPricing.nameEl
                              : order.postalPricing.name}
                        </p>
                        {business?.language === 'sq' && order.postalPricing.deliveryTimeAl ? (
                          <p className="text-xs text-gray-600 mt-1">
                            {order.postalPricing.deliveryTimeAl}
                          </p>
                        ) : order.postalPricing.deliveryTime ? (
                          <p className="text-xs text-gray-600 mt-1">
                            {order.postalPricing.deliveryTime}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Fee
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.postalPricing.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-teal-600" />
              Order Items ({order.items.length})
            </h3>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.product.images.length > 0 ? (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">
                      {item.product.name}
                      {item.variant && ` (${item.variant.name})`}
                    </h4>
                    
                    {item.product.description && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {item.product.description}
                      </p>
                    )}
                    
                    {item.modifiers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Add-ons:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.modifiers.map((modifier) => (
                            <span key={modifier.id} className="inline-block bg-gray-100 text-xs px-2 py-1 rounded">
                              {modifier.name} (+{formatCurrency(modifier.price)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900">
                      {item.quantity} × {formatCurrency(item.price)}
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-gray-500 line-through ml-2">
                          {formatCurrency(item.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.quantity * item.price)}
                      {item.originalPrice && item.originalPrice > item.price && (
                        <>
                          <span className="text-xs text-gray-500 line-through ml-2">
                            {formatCurrency(item.quantity * item.originalPrice)}
                          </span>
                          <span className="text-xs text-green-600 font-medium ml-2">
                            -{formatCurrency(item.quantity * (item.originalPrice - item.price))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
              )}
              
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-teal-600" />
              Payment Information
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm font-medium text-gray-900">
                  {order.paymentMethod || 'Not specified'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          {order.deliveryTime && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-teal-600" />
                {order.type === 'DELIVERY' ? 'Delivery Time' : order.type === 'PICKUP' ? 'Pickup Time' : 'Arrival Time'}
              </h3>
              
              <div className="text-sm text-gray-900">
                {formatDate(order.deliveryTime)}
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-teal-600" />
                Order Notes
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {order.notes}
                </p>
              </div>
            </div>
          )}

          {/* Invoice/Receipt Selection - Only show for Greek storefronts */}
          {order.invoiceType && (business?.language === 'el' || business?.storefrontLanguage === 'el') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Τιμολόγιο / Απόδειξη
                </h3>
                {order.invoiceType === 'INVOICE' && !editingInvoice && (
                  <button
                    onClick={() => setEditingInvoice(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center mb-3">
                  <div className={`px-3 py-1 rounded-lg font-medium text-sm ${
                    order.invoiceType === 'INVOICE' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-green-600 text-white'
                  }`}>
                    {order.invoiceType === 'INVOICE' ? 'Τιμολόγιο' : 'Απόδειξη'}
                  </div>
                  <p className="ml-3 text-sm text-gray-700">
                    Ο πελάτης έχει επιλέξει να λάβει {order.invoiceType === 'INVOICE' ? 'τιμολόγιο' : 'απόδειξη'} για αυτή την παραγγελία.
                  </p>
                </div>

                {/* Invoice Details - Show when INVOICE is selected */}
                {order.invoiceType === 'INVOICE' && (
                  <>
                    {!editingInvoice ? (
                      <div className="mt-4 space-y-2">
                        {order.invoiceAfm && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">ΑΦΜ:</span>
                            <span className="ml-2 text-sm text-gray-900">{order.invoiceAfm}</span>
                          </div>
                        )}
                        {order.invoiceCompanyName && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Επωνυμία:</span>
                            <span className="ml-2 text-sm text-gray-900">{order.invoiceCompanyName}</span>
                          </div>
                        )}
                        {order.invoiceTaxOffice && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">ΔΟΥ:</span>
                            <span className="ml-2 text-sm text-gray-900">{order.invoiceTaxOffice}</span>
                          </div>
                        )}
                        {!order.invoiceAfm && !order.invoiceCompanyName && !order.invoiceTaxOffice && (
                          <p className="text-xs text-gray-500 italic">No invoice details provided yet</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            ΑΦΜ (Φορολογικός Αριθμός) *
                          </label>
                          <input
                            type="text"
                            value={invoiceAfm}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                              setInvoiceAfm(value)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
                            placeholder="123456789"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {invoiceAfm.length === 9 ? '✓ 9 digits' : `${invoiceAfm.length}/9 digits`}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Επωνυμία Εταιρείας (Optional)
                          </label>
                          <input
                            type="text"
                            value={invoiceCompanyName}
                            onChange={(e) => setInvoiceCompanyName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            ΔΟΥ (Optional)
                          </label>
                          <input
                            type="text"
                            value={invoiceTaxOffice}
                            onChange={(e) => setInvoiceTaxOffice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900"
                            placeholder="Tax office"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={async () => {
                              if (!invoiceAfm || invoiceAfm.length !== 9) {
                                toast.error('Please enter a valid AFM (9 digits)')
                                return
                              }
                              setUpdating(true)
                              try {
                                const response = await fetch(`/api/admin/stores/${businessId}/orders/${orderId}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    invoiceAfm: invoiceAfm || null,
                                    invoiceCompanyName: invoiceCompanyName || null,
                                    invoiceTaxOffice: invoiceTaxOffice || null
                                  })
                                })
                                if (response.ok) {
                                  toast.success('Invoice details updated')
                                  setEditingInvoice(false)
                                  fetchOrder()
                                } else {
                                  const data = await response.json()
                                  toast.error(data.message || 'Failed to update invoice details')
                                }
                              } catch (error) {
                                console.error('Error updating invoice details:', error)
                                toast.error('Failed to update invoice details')
                              } finally {
                                setUpdating(false)
                              }
                            }}
                            disabled={updating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingInvoice(false)
                              setInvoiceAfm(order.invoiceAfm || '')
                              setInvoiceCompanyName(order.invoiceCompanyName || '')
                              setInvoiceTaxOffice(order.invoiceTaxOffice || '')
                            }}
                            disabled={updating}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setWhatsappMessage(generateWhatsAppMessage())
                  setShowWhatsAppModal(true)
                }}
                className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{adminUILabels.sendWhatsAppUpdate}</div>
                  <div className="text-xs text-gray-600">{adminUILabels.notifyCustomer}</div>
                </div>
              </button>
              
              <Link
                href={addParams(`/admin/stores/${businessId}/customers/${order.customer.id}`)}
                className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="w-5 h-5 mr-3 text-teal-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">View Customer Profile</div>
                  <div className="text-xs text-gray-600">See full customer details</div>
                </div>
              </Link>
              
              <Link
                href={addParams(`/admin/stores/${businessId}/orders`)}
                className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingBag className="w-5 h-5 mr-3 text-gray-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">View All Orders</div>
                  <div className="text-xs text-gray-600">Back to orders list</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Order Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                Cancel Order
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                disabled={updating}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Please provide a reason for cancelling this order. The stock will be automatically reverted.
              </p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={4}
                disabled={updating}
                required
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={() => updateOrderStatus('CANCELLED', rejectionReason)}
                disabled={updating || !rejectionReason.trim()}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                {updating ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 text-teal-500 mr-2" />
                {order.notes ? 'Edit Order Notes' : 'Add Order Notes'}
              </h3>
              <button
                onClick={() => setEditingNotes(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                disabled={updating}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6">
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add internal notes about this order..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                rows={6}
                disabled={updating}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditingNotes(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={updateOrderNotes}
                disabled={updating}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {updating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 text-green-500 mr-2" />
                {adminUILabels.sendWhatsAppUpdateTo} {order.customer.name}
              </h3>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                {adminUILabels.customizeMessage}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {adminUILabels.whatsAppMessage}
                  </label>
                  <textarea
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    rows={12}
                    placeholder="Customize your message here..."
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{adminUILabels.messagePreview}</span>
                  <button
                    onClick={() => setWhatsappMessage(generateWhatsAppMessage())}
                    className="text-green-600 hover:text-green-700 transition-colors"
                  >
                    {adminUILabels.resetToDefault}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {adminUILabels.cancel}
              </button>
              <a
                href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                onClick={() => setShowWhatsAppModal(false)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {adminUILabels.sendWhatsAppMessage}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Modal */}
{showDeleteModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      {!deleteSuccess ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              Delete Order
            </h3>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={isDeleting}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete order <strong>#{order.orderNumber}</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-red-800 text-sm">
                    <strong>This action cannot be undone.</strong> The order will be permanently removed and stock will be restored.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isDeleting ? 'Deleting...' : 'Delete Order'}
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Deleted Successfully</h3>
          <p className="text-gray-600 mb-6">
            Order <strong>#{order.orderNumber}</strong> has been permanently removed and stock has been restored.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-800 text-sm">
              Redirecting you back to the orders list...
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      )}
    </div>
  </div>
)}
    </div>
  )
}