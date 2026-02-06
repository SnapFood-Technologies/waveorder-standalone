'use client'

import { useState, useEffect } from 'react'
import { 
  Brain, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Clock
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface WavemindData {
  success: boolean
  insights: string
  alerts: Array<{
    type: 'warning' | 'info' | 'success'
    message: string
  }>
  metrics: {
    totalBusinesses: number
    activeTrials: number
    freeBusinesses: number
    payingCustomers: number
    mrr: number
    arr: number
  }
  generatedAt: string
  model: string
}

export default function WavemindFinancialPage() {
  const [data, setData] = useState<WavemindData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/superadmin/wavemind/insights')
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to fetch insights')
      }
      
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getAlertIcon = (type: 'warning' | 'info' | 'success') => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
    }
  }

  const getAlertStyles = (type: 'warning' | 'info' | 'success') => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            Wavemind Engine
          </h1>
          <p className="text-gray-600 mt-1">AI-powered financial insights and analysis</p>
        </div>
        
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Failed to generate insights</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Data</h3>
          <p className="text-gray-600">Wavemind is processing your business metrics...</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Powered by GPT-4o-mini
          </div>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Businesses</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.metrics.totalBusinesses}</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-gray-500">Active Trials</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{data.metrics.activeTrials}</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-500">MRR</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.metrics.mrr)}</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-500">ARR</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.metrics.arr)}</p>
            </div>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getAlertStyles(alert.type)}`}
                >
                  {getAlertIcon(alert.type)}
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-purple-200 bg-white/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Analysis</h3>
                  <p className="text-xs text-gray-500">
                    Generated {new Date(data.generatedAt).toLocaleString()} • {data.model}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:text-gray-700">
                <ReactMarkdown>{data.insights}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Brain className="w-3 h-3" />
            <span>Wavemind uses GPT-4o-mini for cost-effective analysis</span>
          </div>
        </>
      )}
    </div>
  )
}
