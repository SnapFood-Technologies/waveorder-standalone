'use client'

import { useState, useEffect } from 'react'
import { 
  Heart, 
  TrendingUp, 
  TrendingDown,
  Users,
  AlertTriangle,
  Clock,
  RefreshCw,
  BarChart3,
  PieChart,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Target,
  DollarSign,
  MessageSquare,
  XCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'

interface CXData {
  nps: {
    score: number | null
    promoters: number
    passives: number
    detractors: number
    totalResponses: number
    trend: Array<{
      month: string
      monthLabel: string
      nps: number | null
      responses: number
    }>
  }
  csat: {
    score: number | null
    totalResponses: number
    byType: Record<string, { score: number; count: number }>
    trend: Array<{
      month: string
      monthLabel: string
      csat: number | null
      responses: number
    }>
  }
  ces: {
    score: number | null
    avgOnboardingTimeHours: number | null
    avgTimeToFirstOrderDays: number | null // For salons, this represents first appointment
    businessesAnalyzed: number
  }
  churn: {
    rate: number
    churnedThisPeriod: number
    activeBusinesses: number
    revenueChurnMRR?: number
    trend: Array<{
      month: string
      monthLabel: string
      churnRate: number
      churned: number
      totalAtStart: number
    }>
    reasons: Record<string, number>
  }
  clv: {
    average: number | null
    byPlan: Record<string, { avgCLV: number; count: number; billingType?: string }>
    businessesAnalyzed: number
  }
  support: {
    avgFirstResponseTimeHours: number | null
    firstContactResolutionRate: number | null
    totalTickets: number
    resolvedTickets: number
    trend: Array<{
      month: string
      monthLabel: string
      tickets: number
      resolved: number
      fcr: number | null
      avgFRT: number | null
    }>
    byType: Record<string, number>
  }
  atRisk: {
    count: number
    businesses: Array<{
      id: string
      name: string
      riskScore: number
      reasons: string[]
      lastOrderDate: string | null // For salons, this represents last appointment date
      supportTicketsCount: number
      lastFeedbackRating: number | null
    }>
  }
}

const feedbackTypeLabels: Record<string, string> = {
  INITIAL: 'Initial Feedback',
  PERIODIC: 'Periodic Check-in',
  NPS: 'Net Promoter Score',
  FEATURE_REQUEST: 'Feature Request',
  SUPPORT: 'Support Feedback',
  OTHER: 'Other'
}

const ticketTypeLabels: Record<string, string> = {
  GENERAL: 'General',
  TECHNICAL: 'Technical',
  BILLING: 'Billing',
  FEATURE_REQUEST: 'Feature Request',
  BUG_REPORT: 'Bug Report'
}

export default function CXAnalyticsPage() {
  const [data, setData] = useState<CXData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/superadmin/analytics/cx?range=${timeRange}`)
      if (!res.ok) throw new Error('Failed to fetch data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError('Failed to load CX analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getNPSColor = (nps: number | null) => {
    if (nps === null) return 'text-gray-500'
    if (nps >= 50) return 'text-green-600'
    if (nps >= 0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getNPSLabel = (nps: number | null) => {
    if (nps === null) return 'No data'
    if (nps >= 50) return 'Excellent'
    if (nps >= 0) return 'Good'
    return 'Needs Improvement'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-teal-800">Communicating with Stripe...</p>
            <p className="text-xs text-teal-600 mt-0.5">Analysing subscription and churn data. This may take a few seconds.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-2 bg-gray-100 rounded w-28" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-4" />
              <div className="h-24 bg-gray-100 rounded" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-36 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error || 'No data available'}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Heart className="w-7 h-7 text-pink-600" />
            CX Analytics
          </h1>
          <p className="text-gray-600 mt-1">Customer experience, satisfaction, and retention metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full sm:w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NPS */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Net Promoter Score</span>
            <Star className="w-4 h-4 text-gray-400" />
          </div>
          <p className={`text-3xl font-bold ${getNPSColor(data.nps.score)}`}>
            {data.nps.score !== null ? data.nps.score : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{getNPSLabel(data.nps.score)}</p>
          {data.nps.totalResponses > 0 && (
            <p className="text-xs text-gray-400 mt-1">{data.nps.totalResponses} responses</p>
          )}
        </div>

        {/* CSAT */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">CSAT Score</span>
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {data.csat.score !== null ? `${data.csat.score.toFixed(1)}/5` : 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Customer Satisfaction</p>
          {data.csat.totalResponses > 0 && (
            <p className="text-xs text-gray-400 mt-1">{data.csat.totalResponses} responses</p>
          )}
        </div>

        {/* Churn Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Churn Rate</span>
            {data.churn.rate > 5 ? (
              <TrendingUp className="w-4 h-4 text-red-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-600" />
            )}
          </div>
          <p className={`text-3xl font-bold ${data.churn.rate > 5 ? 'text-red-600' : 'text-gray-900'}`}>
            {data.churn.rate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{data.churn.churnedThisPeriod} churned this period</p>
          {data.churn.revenueChurnMRR != null && data.churn.revenueChurnMRR > 0 && (
            <p className="text-xs text-red-500 mt-0.5">
              ${data.churn.revenueChurnMRR.toFixed(0)}/mo revenue lost
            </p>
          )}
        </div>

        {/* CLV */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Avg CLV</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.clv.average)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Customer Lifetime Value</p>
          <p className="text-xs text-gray-400 mt-0.5">When from subscriptions: estimated revenue (monthly equivalent × tenure)</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2 cols wide */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* NPS Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pink-600" />
              NPS Breakdown
            </h3>
            {data.nps.totalResponses > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Promoters (9-10)</p>
                      <p className="text-xs text-gray-500">{data.nps.promoters} businesses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {Math.round((data.nps.promoters / data.nps.totalResponses) * 100)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Info className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Passives (7-8)</p>
                      <p className="text-xs text-gray-500">{data.nps.passives} businesses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-600">
                      {Math.round((data.nps.passives / data.nps.totalResponses) * 100)}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Detractors (0-6)</p>
                      <p className="text-xs text-gray-500">{data.nps.detractors} businesses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {Math.round((data.nps.detractors / data.nps.totalResponses) * 100)}%
                    </p>
                  </div>
                </div>

                {/* NPS Trend Chart */}
                {data.nps.trend.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">NPS Trend (Last 6 Months)</h4>
                    <div className="flex items-end justify-between h-32 gap-2">
                      {data.nps.trend.map((month) => {
                        const maxNPS = Math.max(...data.nps.trend.map(m => m.nps || 0), 1)
                        const minNPS = Math.min(...data.nps.trend.map(m => m.nps || 0), 0)
                        const range = maxNPS - minNPS || 1
                        const height = month.nps !== null 
                          ? ((month.nps - minNPS) / range) * 100
                          : 0
                        return (
                          <div key={month.month} className="flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col items-center justify-end h-24">
                              {month.nps !== null && (
                                <span className={`text-xs font-medium mb-1 ${getNPSColor(month.nps)}`}>
                                  {month.nps}
                                </span>
                              )}
                              <div 
                                className={`w-full rounded-t-lg transition-all duration-300 min-h-[4px] ${
                                  month.nps !== null 
                                    ? month.nps >= 50 ? 'bg-green-500' 
                                    : month.nps >= 0 ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                    : 'bg-gray-200'
                                }`}
                                style={{ height: `${Math.max(height, 4)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 mt-2 text-center">{month.monthLabel}</span>
                            {month.responses > 0 && (
                              <span className="text-xs text-gray-400">{month.responses}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No NPS data available</p>
                <p className="text-sm mt-1">NPS surveys will appear here once businesses respond</p>
              </div>
            )}
          </div>

          {/* CSAT by Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-teal-600" />
              CSAT by Feedback Type
            </h3>
            {Object.keys(data.csat.byType).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.csat.byType)
                  .sort(([, a], [, b]) => b.score - a.score)
                  .map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <Star className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {feedbackTypeLabels[type] || type}
                          </p>
                          <p className="text-xs text-gray-500">{data.count} responses</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{data.score.toFixed(1)}/5</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No CSAT data available</p>
              </div>
            )}
          </div>

          {/* Churn Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Churn Rate Trend
            </h3>
            {data.churn.trend.length > 0 ? (
              <div className="flex items-end justify-between h-32 gap-2">
                {data.churn.trend.map((month) => {
                  const maxChurn = Math.max(...data.churn.trend.map(m => m.churnRate), 1)
                  const height = maxChurn > 0 ? (month.churnRate / maxChurn) * 100 : 0
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center justify-end h-24">
                        <span className={`text-xs font-medium mb-1 ${month.churnRate > 5 ? 'text-red-600' : 'text-gray-600'}`}>
                          {month.churnRate.toFixed(1)}%
                        </span>
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-300 min-h-[4px] ${
                            month.churnRate > 5 ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-2 text-center">{month.monthLabel}</span>
                      <span className="text-xs text-gray-400">{month.churned} churned</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No churn data for this period</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* CES Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Customer Effort Score
            </h3>
            {data.ces.score !== null ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-900">{data.ces.score.toFixed(1)}/5</p>
                  <p className="text-sm text-gray-500 mt-1">Ease of Use Score</p>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Onboarding Time</span>
                    <span className="font-medium text-gray-900">
                      {data.ces.avgOnboardingTimeHours !== null 
                        ? `${data.ces.avgOnboardingTimeHours.toFixed(1)} hrs`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time to First Order</span>
                    <span className="font-medium text-gray-900">
                      {data.ces.avgTimeToFirstOrderDays !== null 
                        ? `${data.ces.avgTimeToFirstOrderDays.toFixed(1)} days`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Businesses Analyzed</span>
                    <span className="font-medium text-gray-900">{data.ces.businessesAnalyzed}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No CES data available</p>
              </div>
            )}
          </div>

          {/* Support Metrics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Support Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">First Response Time</span>
                  <span className="text-sm font-medium text-gray-900">
                    {data.support.avgFirstResponseTimeHours !== null 
                      ? `${data.support.avgFirstResponseTimeHours.toFixed(1)} hrs`
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">First Contact Resolution</span>
                  <span className="text-sm font-medium text-gray-900">
                    {data.support.firstContactResolutionRate !== null 
                      ? `${data.support.firstContactResolutionRate.toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Tickets by Type</p>
                <div className="space-y-2">
                  {Object.entries(data.support.byType)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600">{ticketTypeLabels[type] || type}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* CLV by Plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              CLV by Plan
            </h3>
            {Object.keys(data.clv.byPlan).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.clv.byPlan)
                  .sort(([, a], [, b]) => b.avgCLV - a.avgCLV)
                  .map(([planKey, planData]) => {
                    const planLabel = planData.billingType
                      ? `${planKey.replace(/_(monthly|yearly|free|trial)$/i, '')} (${planData.billingType.charAt(0).toUpperCase() + planData.billingType.slice(1)})`
                      : planKey
                    return (
                      <div key={planKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{planLabel}</p>
                          <p className="text-xs text-gray-500">{planData.count} businesses</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(planData.avgCLV)}</p>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No CLV data available</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* At-Risk Customers */}
      {data.atRisk.count > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              At-Risk Customers ({data.atRisk.count})
            </h3>
            <Link
              href="/superadmin/businesses"
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View All Businesses
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.atRisk.businesses.slice(0, 10).map((business) => (
              <div 
                key={business.id}
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-gray-900">{business.name}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      business.riskScore >= 50 ? 'bg-red-100 text-red-700' :
                      business.riskScore >= 30 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      Risk: {business.riskScore}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {business.reasons.map((reason, idx) => (
                      <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-orange-200 text-gray-700">
                        {reason}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {business.lastOrderDate && (
                      <span>Last order: {new Date(business.lastOrderDate).toLocaleDateString()}</span>
                    )}
                    {business.supportTicketsCount > 0 && (
                      <span>{business.supportTicketsCount} support tickets</span>
                    )}
                    {business.lastFeedbackRating !== null && (
                      <span>Rating: {business.lastFeedbackRating}/5</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/superadmin/businesses/${business.id}`}
                  className="ml-4 px-3 py-2 text-sm text-teal-600 bg-white border border-teal-200 rounded-lg hover:bg-teal-50"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Churn Reasons */}
      {Object.keys(data.churn.reasons).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Churn Reasons</h3>
          <div className="space-y-2">
            {Object.entries(data.churn.reasons)
              .sort(([, a], [, b]) => b - a)
              .map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{reason}</span>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Informative Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">About Test Data</h4>
            <p className="text-sm text-blue-800">
              Please note that some businesses are test accounts and may be deactivated for testing purposes. 
              This data may include test businesses that were intentionally deactivated and should not be considered 
              as actual customer churn. Test businesses are excluded from analytics calculations where applicable, 
              but deactivation reasons may still appear in this list.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
