// src/components/admin/financial/FinancialOverview.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ArrowRight,
  FileText,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchAndDownloadFinancialReportPdf } from '@/lib/generateFinancialReportPdf'
import { InternalExpensesSettings } from '@/components/admin/settings/InternalExpensesSettings'

interface FinancialOverviewProps {
  businessId: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface OverviewData {
  orderRevenue: number
  affiliateEarnings: number
  affiliatePayments: number
  affiliatePayable: number
  deliveryEarnings: number
  deliveryPayments: number
  deliveryPayable: number
  netOrderRevenue: number
  totalExpenses: number
  totalInjections: number
  netCashFlow: number
  supplierOwed: number
  supplierPaid: number
  supplierOutstanding: number
  features: {
    internalExpensesEnabled: boolean
    enableAffiliateSystem: boolean
    enableDeliveryManagement: boolean
    showCostPrice: boolean
  }
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

export function FinancialOverview({ businessId }: FinancialOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OverviewData | null>(null)
  const [currency, setCurrency] = useState('EUR')
  const [error, setError] = useState<string | null>(null)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const fetchOverview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/financial/overview`)
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load financial overview')
      }
      setData(json.data)
      setCurrency(json.currency || 'EUR')
      setLastGeneratedAt(json.lastGeneratedAt ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    setPdfGenerating(true)
    const toastId = toast.loading(
      'Generating PDF... This may take a moment if you have many cash movements. Please be patient.',
      { duration: 5000 }
    )
    try {
      await fetchAndDownloadFinancialReportPdf(businessId)
      await fetch(`/api/admin/stores/${businessId}/financial/last-generated`, {
        method: 'PATCH'
      })
      setLastGeneratedAt(new Date().toISOString())
      toast.success('PDF downloaded', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate PDF', { id: toastId })
    } finally {
      setPdfGenerating(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [businessId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="ml-3 text-gray-600">Loading financial overview...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { features } = data
  const showAffiliateAlert = features.enableAffiliateSystem && data.affiliatePayable > 0
  const showSupplierAlert = features.showCostPrice && data.supplierOutstanding > 0

  // Empty state: no orders, no expenses, no movements
  const hasAnyData =
    data.orderRevenue > 0 ||
    data.netOrderRevenue !== 0 ||
    data.affiliatePayable > 0 ||
    data.deliveryPayable > 0 ||
    data.supplierOutstanding > 0 ||
    data.totalExpenses > 0 ||
    data.totalInjections > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial</h1>
          <p className="text-gray-600 mt-1">
            Order revenue, payables, and cash movements overview
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-gray-500">Last generated</p>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formatDate(lastGeneratedAt)}
            </button>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={fetchOverview}
            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyData && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No financial data yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Order revenue, expenses, and cash movements will appear here once you have activity.
            Complete orders, add cash movements, or enable Cost & Margins to see your financial overview.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/admin/stores/${businessId}/orders`}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              View Orders
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            {features.internalExpensesEnabled && (
              <Link
                href={`/admin/stores/${businessId}/financial`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Add Cash Movement
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Alert banners */}
      {showAffiliateAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              You have {formatCurrency(data.affiliatePayable, currency)} in affiliate earnings but only{' '}
              {formatCurrency(data.affiliatePayments, currency)} paid out.
            </p>
            <Link
              href={`/admin/stores/${businessId}/affiliates/payments`}
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 hover:text-amber-900"
            >
              Pay affiliates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
      {showSupplierAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              You owe {formatCurrency(data.supplierOutstanding, currency)} to suppliers. Paid so far:{' '}
              {formatCurrency(data.supplierPaid, currency)}.
            </p>
            <Link
              href={`/admin/stores/${businessId}/cost-margins`}
              className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 hover:text-amber-900"
            >
              Cost & Margins
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Overview cards - hide when empty */}
      {hasAnyData && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.orderRevenue, currency)}
              </p>
              <p className="text-sm text-gray-500">Order Revenue (gross)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.netOrderRevenue, currency)}
              </p>
              <p className="text-sm text-gray-500">Net Order Revenue</p>
              <p className="text-xs text-gray-400">
                Excl. affiliate & delivery
              </p>
            </div>
          </div>
        </div>

        {features.enableAffiliateSystem && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Receipt className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(data.affiliatePayable, currency)}
                </p>
                <p className="text-sm text-gray-500">Affiliate Payable</p>
                <p className="text-xs text-gray-400">
                  Earned: {formatCurrency(data.affiliateEarnings, currency)} · Paid:{' '}
                  {formatCurrency(data.affiliatePayments, currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {features.enableDeliveryManagement && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Receipt className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(data.deliveryPayable, currency)}
                </p>
                <p className="text-sm text-gray-500">Delivery Payable</p>
                <p className="text-xs text-gray-400">
                  Earned: {formatCurrency(data.deliveryEarnings, currency)} · Paid:{' '}
                  {formatCurrency(data.deliveryPayments, currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {features.showCostPrice && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(data.supplierOutstanding, currency)}
                </p>
                <p className="text-sm text-gray-500">Supplier Outstanding</p>
                <p className="text-xs text-gray-400">
                  Owed: {formatCurrency(data.supplierOwed, currency)} · Paid:{' '}
                  {formatCurrency(data.supplierPaid, currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        {features.internalExpensesEnabled && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(data.totalExpenses, currency)}
                  </p>
                  <p className="text-sm text-gray-500">Internal Expenses</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(data.totalInjections, currency)}
                  </p>
                  <p className="text-sm text-gray-500">Cash Injections</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p
                    className={`text-xl font-bold ${
                      data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(data.netCashFlow, currency)}
                  </p>
                  <p className="text-sm text-gray-500">Net Cash Flow</p>
                  <p className="text-xs text-gray-400">Injections − Expenses</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {/* Cash Movements section */}
      {features.internalExpensesEnabled && (
        <div className="border-t border-gray-200 pt-8">
          <InternalExpensesSettings businessId={businessId} embedded />
        </div>
      )}
    </div>
  )
}
