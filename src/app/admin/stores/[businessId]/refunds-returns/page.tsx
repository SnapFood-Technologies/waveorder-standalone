'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  RotateCcw, 
  Loader2, 
  Settings, 
  X, 
  Eye,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface RefundOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  returnFee: number | null
  refundAmount: number | null
  customer: {
    id: string
    name: string
    phone: string
  }
  createdAt: string
  updatedAt: string
}

interface BusinessInfo {
  businessType: string
  currency: string
  returnFeePercentage: number | null
}

export default function RefundsReturnsPage() {
  const params = useParams()
  const businessId = params.businessId as string
  const { addParams } = useImpersonation(businessId)

  const [orders, setOrders] = useState<RefundOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [returnFeePercentage, setReturnFeePercentage] = useState<number | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    fetchData()
  }, [businessId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersRes, businessRes] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}/refunds-returns`),
        fetch(`/api/admin/stores/${businessId}/refunds-returns/settings`)
      ])

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData.orders || [])
      }

      if (businessRes.ok) {
        const businessData = await businessRes.json()
        setBusinessInfo(businessData)
        setReturnFeePercentage(businessData.returnFeePercentage)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load refunds and returns data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/refunds-returns/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnFeePercentage })
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast.success('Return fee settings saved successfully')
      setShowSettingsModal(false)
      await fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSavingSettings(false)
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
    
    const symbol = currencySymbols[businessInfo?.currency || 'USD'] || businessInfo?.currency || 'USD'
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!businessInfo) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Not Found</h3>
        <p className="text-gray-600">
          Unable to load business information.
        </p>
      </div>
    )
  }

  if (businessInfo.businessType !== 'RETAIL') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Feature Not Available</h3>
        <p className="text-gray-600 mb-4">
          Refunds & Returns management is only available for RETAIL businesses.
        </p>
        <Link
          href={addParams(`/admin/stores/${businessId}/orders`)}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refunds & Returns</h1>
          <p className="text-gray-600 mt-1">
            Manage refunded orders and configure return fee settings
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Return Fee
          </button>
          <Link
            href={addParams(`/admin/stores/${businessId}/orders`)}
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>

      {/* Settings Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Return Fee Configuration</h3>
            <p className="text-sm text-blue-700">
              {returnFeePercentage !== null && returnFeePercentage > 0
                ? `Return fee is set to ${returnFeePercentage}% of the order total. This fee will be deducted from refunds.`
                : 'No return fee is currently configured. Click "Configure Return Fee" to set one.'}
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Refunds or Returns</h3>
          <p className="text-gray-600">
            There are no refunded or returned orders yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Fee
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Refund Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer.name}</div>
                      <div className="text-xs text-gray-500">{order.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {order.returnFee !== null ? (
                        <div className="text-sm text-gray-900">
                          {formatCurrency(order.returnFee)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {order.refundAmount !== null ? (
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(order.refundAmount)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'REFUNDED'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status === 'REFUNDED' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Refunded
                          </>
                        ) : (
                          order.status.replace('_', ' ')
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={addParams(`/admin/stores/${businessId}/orders/${order.id}`)}
                        className="text-teal-600 hover:text-teal-900 inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Configure Return Fee</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Fee Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={returnFeePercentage ?? ''}
                    onChange={(e) => setReturnFeePercentage(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Percentage of order total to charge as return fee (e.g., 10 for 10%). Leave empty to disable return fees.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> This fee will be deducted from refund amounts. For example, if an order totals €100 and the return fee is 10%, the customer will receive €90 as a refund.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSettingsModal(false)}
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
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
