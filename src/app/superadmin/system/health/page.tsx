'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  Database, 
  CreditCard, 
  Mail, 
  MapPin, 
  Shield, 
  Cloud, 
  BarChart3, 
  Eye, 
  Server, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ExternalLink,
  HardDrive,
  Lock,
  Globe
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured' | 'checking'
  message: string
  latency?: number
  lastChecked?: Date
}

interface ServiceCategory {
  name: string
  description: string
  icon: any
  services: ServiceStatus[]
}

export default function HealthStatusPage() {
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [categories, setCategories] = useState<ServiceCategory[]>([])

  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/system/health')
      const data = await res.json()
      setCategories(data.categories)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to check health:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'unconfigured':
        return <Clock className="w-5 h-5 text-gray-400" />
      case 'checking':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Healthy</span>
      case 'degraded':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Degraded</span>
      case 'down':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Down</span>
      case 'unconfigured':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Setup Required</span>
      case 'checking':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Checking...</span>
    }
  }

  const getCategoryIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Database,
      CreditCard,
      Mail,
      Shield,
      MapPin,
      Cloud,
      BarChart3,
      Eye,
      Server,
      HardDrive,
      Lock,
      Globe
    }
    const Icon = icons[iconName] || Activity
    return <Icon className="w-5 h-5" />
  }

  // Calculate overall health
  const allServices = categories.flatMap(c => c.services)
  const healthyCount = allServices.filter(s => s.status === 'healthy').length
  const degradedCount = allServices.filter(s => s.status === 'degraded').length
  const downCount = allServices.filter(s => s.status === 'down').length
  const unconfiguredCount = allServices.filter(s => s.status === 'unconfigured').length

  const overallStatus = downCount > 0 ? 'critical' : degradedCount > 0 ? 'warning' : 'healthy'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-teal-600" />
            System Health Status
          </h1>
          <p className="text-gray-500 mt-1">Monitor all connected services and integrations</p>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall Status Card */}
      <div className={`rounded-xl p-6 ${
        overallStatus === 'healthy' 
          ? 'bg-green-500 bg-gradient-to-r from-green-500 to-emerald-500' 
          : overallStatus === 'warning'
          ? 'bg-amber-500 bg-gradient-to-r from-amber-500 to-orange-500'
          : 'bg-red-500 bg-gradient-to-r from-red-500 to-rose-500'
      } text-white`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              {overallStatus === 'healthy' ? 'All Systems Operational' : 
               overallStatus === 'warning' ? 'Some Services Degraded' : 
               'System Issues Detected'}
            </h2>
            <p className="text-white/80 text-sm">
              Last checked: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{healthyCount}</div>
              <div className="text-xs text-white/80">Healthy</div>
            </div>
            {degradedCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold">{degradedCount}</div>
                <div className="text-xs text-white/80">Degraded</div>
              </div>
            )}
            {downCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold">{downCount}</div>
                <div className="text-xs text-white/80">Down</div>
              </div>
            )}
            {unconfiguredCount > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold">{unconfiguredCount}</div>
                <div className="text-xs text-white/80">Setup Needed</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && categories.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <span className="ml-3 text-gray-600">Checking services...</span>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div key={category.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Category Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                  {getCategoryIcon(category.icon)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
              </div>
            </div>

            {/* Services List */}
            <div className="divide-y divide-gray-100">
              {category.services.map((service) => (
                <div key={service.name} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <div className="font-medium text-gray-900">{service.name}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{service.message}</div>
                        {service.latency !== undefined && service.status === 'healthy' && (
                          <div className="text-xs text-gray-400 mt-1">
                            Response time: {service.latency}ms
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Healthy - Service is operational</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-600">Degraded - Service has issues</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">Down - Service unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Setup Required - Not configured</span>
          </div>
        </div>
      </div>

      {/* External Status Pages */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-3">External Status Pages</h4>
        <div className="flex flex-wrap gap-3">
          <a 
            href="https://status.stripe.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Stripe Status <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="https://resend.com/status" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Resend Status <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="https://status.cloud.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Google Cloud Status <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="https://status.supabase.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Supabase Status <ExternalLink className="w-3 h-3" />
          </a>
          <a 
            href="https://www.netlifystatus.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            Netlify Status <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
