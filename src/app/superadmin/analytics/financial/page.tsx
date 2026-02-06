'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard, 
  Users,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PieChart,
  BarChart3,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface FinancialData {
  totalBusinesses: number
  byPlan: {
    STARTER: number
    PRO: number
    BUSINESS: number
  }
  byBillingType: {
    free: number
    trial: number
    monthly: number
    yearly: number
  }
  trialAnalytics: {
    activeTrials: number
    trialsExpiringSoon: {
      within7Days: any[]
      within14Days: any[]
      within30Days: any[]
    }
    trialConversionRate: number
    totalTrialsStarted: number
    totalTrialsEnded: number
    totalTrialsConverted: number
    trialsExpiringList: Array<{
      id: string
      name: string
      plan: string
      daysRemaining: number
      expiresAt: string
      ownerEmail: string
    }>
  }
  revenue: {
    mrr: number
    arr: number
    mrrFromMonthly: number
    mrrFromYearly: number
    revenueByPlan: {
      STARTER: number
      PRO: number
      BUSINESS: number
    }
  }
  customers: {
    totalPaying: number
    monthlySubscribers: number
    yearlySubscribers: number
    arpu: number
  }
  growth: {
    mrrGrowthRate: number
    monthlyData: Array<{
      month: string
      monthLabel: string
      newBusinesses: number
      trials: number
      paid: number
      mrr: number
    }>
  }
}

export default function FinancialPage() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/analytics/financial')
      if (!res.ok) throw new Error('Failed to fetch data')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError('Failed to load financial analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-green-600" />
            Financial Analytics
          </h1>
          <p className="text-gray-600 mt-1">Revenue, subscriptions, and financial performance metrics</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">MRR</span>
            <div className={`flex items-center text-sm ${data.growth.mrrGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.growth.mrrGrowthRate >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              {Math.abs(data.growth.mrrGrowthRate)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.revenue.mrr)}</p>
          <p className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</p>
        </div>

        {/* ARR */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">ARR</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.revenue.arr)}</p>
          <p className="text-xs text-gray-500 mt-1">Annual Recurring Revenue</p>
        </div>

        {/* Paying Customers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Paying Customers</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.customers.totalPaying}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.customers.monthlySubscribers} monthly, {data.customers.yearlySubscribers} yearly
          </p>
        </div>

        {/* ARPU */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">ARPU</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.customers.arpu)}</p>
          <p className="text-xs text-gray-500 mt-1">Average Revenue Per User</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2 cols wide */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MRR Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              MRR Over Time
            </h3>
            <div className="h-64">
              {data.growth.monthlyData.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-2">
                  {data.growth.monthlyData.map((month, index) => {
                    const maxMRR = Math.max(...data.growth.monthlyData.map(m => m.mrr), 1)
                    const height = maxMRR > 0 ? (month.mrr / maxMRR) * 100 : 0
                    return (
                      <div key={month.month} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center justify-end h-48">
                          <span className="text-xs text-gray-600 mb-1">
                            {formatCurrency(month.mrr)}
                          </span>
                          <div 
                            className="w-full bg-teal-500 rounded-t-lg transition-all duration-300 min-h-[4px]"
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-2">{month.monthLabel}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available yet
                </div>
              )}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue by Plan */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Revenue by Plan
              </h3>
              <div className="space-y-4">
                {(['STARTER', 'PRO', 'BUSINESS'] as const).map(plan => {
                  const revenue = data.revenue.revenueByPlan[plan]
                  const totalRevenue = data.revenue.mrr || 1
                  const percentage = totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(0) : 0
                  const colors = {
                    STARTER: 'bg-gray-500',
                    PRO: 'bg-purple-500',
                    BUSINESS: 'bg-indigo-500'
                  }
                  return (
                    <div key={plan}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{plan}</span>
                        <span className="text-gray-600">{formatCurrency(revenue)} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[plan]} rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Revenue by Billing Cycle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Revenue by Billing
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Monthly</p>
                    <p className="text-sm text-gray-500">{data.customers.monthlySubscribers} subscribers</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.revenue.mrrFromMonthly)}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Yearly</p>
                    <p className="text-sm text-gray-500">{data.customers.yearlySubscribers} subscribers</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.revenue.mrrFromYearly)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Subscription Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
            
            {/* By Plan */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">By Plan</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{data.byPlan.STARTER}</p>
                  <p className="text-xs text-gray-500">Starter</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{data.byPlan.PRO}</p>
                  <p className="text-xs text-gray-500">Pro</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <p className="text-2xl font-bold text-indigo-600">{data.byPlan.BUSINESS}</p>
                  <p className="text-xs text-gray-500">Business</p>
                </div>
              </div>
            </div>

            {/* By Billing Type */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-3">By Billing Type</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{data.byBillingType.free}</p>
                  <p className="text-xs text-gray-500">Free</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{data.byBillingType.trial}</p>
                  <p className="text-xs text-gray-500">Trial</p>
                </div>
                <div className="text-center p-3 bg-teal-50 rounded-lg">
                  <p className="text-2xl font-bold text-teal-600">{data.byBillingType.monthly}</p>
                  <p className="text-xs text-gray-500">Monthly</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{data.byBillingType.yearly}</p>
                  <p className="text-xs text-gray-500">Yearly</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trial Analytics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Trial Analytics
            </h3>
            
            <div className="space-y-4">
              {/* Conversion Rate */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="text-2xl font-bold text-green-600">{data.trialAnalytics.trialConversionRate}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data.trialAnalytics.totalTrialsEnded > 0 
                    ? `${data.trialAnalytics.totalTrialsConverted} of ${data.trialAnalytics.totalTrialsEnded} ended trials converted to paid`
                    : 'No trials have ended yet'
                  }
                </p>
                {data.trialAnalytics.activeTrials > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {data.trialAnalytics.activeTrials} active trial{data.trialAnalytics.activeTrials !== 1 ? 's' : ''} not included
                  </p>
                )}
              </div>

              {/* Active Trials */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm text-gray-700">Active Trials</span>
                <span className="text-lg font-bold text-amber-600">{data.trialAnalytics.activeTrials}</span>
              </div>

              {/* Expiring Soon */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg text-sm">
                  <span className="text-red-700">Within 7 days</span>
                  <span className="font-bold text-red-600">{data.trialAnalytics.trialsExpiringSoon.within7Days.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg text-sm">
                  <span className="text-orange-700">Within 14 days</span>
                  <span className="font-bold text-orange-600">{data.trialAnalytics.trialsExpiringSoon.within14Days.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg text-sm">
                  <span className="text-yellow-700">Within 30 days</span>
                  <span className="font-bold text-yellow-600">{data.trialAnalytics.trialsExpiringSoon.within30Days.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trials Expiring Soon Table */}
      {data.trialAnalytics.trialsExpiringList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Trials Expiring Soon
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Business</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Owner</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Days Left</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expires</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.trialAnalytics.trialsExpiringList.map(trial => (
                  <tr key={trial.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{trial.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        trial.plan === 'BUSINESS' ? 'bg-indigo-100 text-indigo-700' :
                        trial.plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {trial.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{trial.ownerEmail}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        trial.daysRemaining <= 3 ? 'bg-red-100 text-red-700' :
                        trial.daysRemaining <= 7 ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {trial.daysRemaining} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(trial.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link 
                        href={`/superadmin/businesses/${trial.id}`}
                        className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Growth Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Monthly Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Month</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">New Businesses</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Trials</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Paid</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.growth.monthlyData.map((month, index) => (
                <tr key={month.month} className={index === data.growth.monthlyData.length - 1 ? 'bg-teal-50' : 'hover:bg-gray-50'}>
                  <td className="py-3 px-4 font-medium text-gray-900">{month.monthLabel}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{month.newBusinesses}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{month.trials}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{month.paid}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(month.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
