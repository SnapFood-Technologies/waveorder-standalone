// components/admin/stores/StoresList.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  Plus,
  Crown,
  ExternalLink,
  Settings,
  BarChart3,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  PieChart,
  ShoppingBag,
  Boxes
} from 'lucide-react'
import { StoreComparison } from './StoreComparison'
import { QuickCreateStoreModal } from './QuickCreateStoreModal'

interface StoreData {
  id: string
  name: string
  slug: string
  logo: string | null
  subscriptionPlan: 'STARTER' | 'PRO' | 'BUSINESS'
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED'
  trialEndsAt: string | null
  graceEndsAt: string | null
  createdAt: string
  role: 'OWNER' | 'MANAGER' | 'STAFF'
}

interface StoreLimits {
  canCreate: boolean
  currentCount: number
  limit: number
  limitReached: boolean
  suggestedUpgrade?: 'PRO' | 'BUSINESS'
  planName: string
  isUnlimited: boolean
}

export function StoresList() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stores, setStores] = useState<StoreData[]>([])
  const [storeLimits, setStoreLimits] = useState<StoreLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [defaultStoreId, setDefaultStoreId] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      // Fetch stores, limits, and default store in parallel
      const [storesRes, limitsRes, defaultRes] = await Promise.all([
        fetch('/api/user/businesses'),
        fetch('/api/user/store-limits'),
        fetch('/api/user/default-store')
      ])

      let userPlan = 'STARTER'
      
      if (limitsRes.ok) {
        const limitsData = await limitsRes.json()
        setStoreLimits(limitsData)
        userPlan = limitsData.planName || 'STARTER'
      }

      if (storesRes.ok) {
        const storesData = await storesRes.json()
        const businesses = storesData.businesses || []
        
        // Only redirect STARTER users with 1 store (they can't create more)
        // PRO/BUSINESS users can stay to create more stores
        if (businesses.length === 1 && userPlan === 'STARTER') {
          router.push(`/admin/stores/${businesses[0].id}/dashboard`)
          return
        }
        
        setStores(businesses)
      }

      if (defaultRes.ok) {
        const defaultData = await defaultRes.json()
        setDefaultStoreId(defaultData.defaultBusinessId)
      }
    } catch (err) {
      setError('An error occurred while loading data')
    } finally {
      setLoading(false)
    }
  }

  const setAsDefaultStore = async (businessId: string) => {
    try {
      setSettingDefault(businessId)
      const response = await fetch('/api/user/default-store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })

      if (response.ok) {
        setDefaultStoreId(businessId)
      }
    } catch (err) {
      console.error('Error setting default store:', err)
    } finally {
      setSettingDefault(null)
    }
  }

  const getTrialStatus = (store: StoreData) => {
    if (!store.trialEndsAt) return null

    const now = new Date()
    const trialEnd = new Date(store.trialEndsAt)
    const graceEnd = store.graceEndsAt ? new Date(store.graceEndsAt) : null

    if (now < trialEnd) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { type: 'trial', daysLeft }
    } else if (graceEnd && now < graceEnd) {
      const daysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { type: 'grace', daysLeft }
    } else if (graceEnd && now >= graceEnd) {
      return { type: 'expired', daysLeft: 0 }
    }

    return null
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'BUSINESS':
        return 'bg-indigo-100 text-indigo-700'
      case 'PRO':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your stores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Stores</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Stores</h1>
          <p className="text-gray-600 mt-2">
            Manage all your stores and catalogs in one place
          </p>
        </div>

        {/* Store Limit Info */}
        {storeLimits && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {storeLimits.isUnlimited
                    ? `${storeLimits.currentCount} stores`
                    : `${storeLimits.currentCount} of ${storeLimits.limit} stores used`
                  }
                </p>
                <p className="text-sm text-gray-500">
                  {storeLimits.planName} plan
                </p>
              </div>
            </div>
            
            {storeLimits.limitReached && storeLimits.suggestedUpgrade && (
              <Link
                href={stores[0] ? `/admin/stores/${stores[0].id}/settings/billing` : '/pricing'}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Upgrade for more stores
              </Link>
            )}
          </div>
        )}

        {/* Cross-Store Quick Actions - Only show for users with 2+ stores */}
        {stores.length >= 2 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cross-Store Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/unified/dashboard"
                className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg border border-teal-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <LayoutDashboard className="w-5 h-5 text-teal-600" />
                  <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900">Unified Dashboard</h4>
                <p className="text-xs text-gray-600 mt-1">Overview of all stores</p>
              </Link>
              
              <Link
                href="/admin/unified/analytics"
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900">Cross-Store Analytics</h4>
                <p className="text-xs text-gray-600 mt-1">Combined insights</p>
              </Link>
              
              <Link
                href="/admin/unified/orders"
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900">All Orders</h4>
                <p className="text-xs text-gray-600 mt-1">Orders from all stores</p>
              </Link>
              
              <Link
                href="/admin/unified/inventory"
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900">Inventory Overview</h4>
                <p className="text-xs text-gray-600 mt-1">Stock across stores</p>
              </Link>
            </div>
          </div>
        )}

        {/* Store Comparison - Only show for users with 2+ stores */}
        {stores.length >= 2 && (
          <StoreComparison className="mb-6" showQuickActions={false} />
        )}

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => {
            const trialStatus = getTrialStatus(store)
            const isDefault = defaultStoreId === store.id || (!defaultStoreId && stores[0]?.id === store.id)
            
            return (
              <div
                key={store.id}
                className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow ${
                  isDefault ? 'border-teal-500 ring-1 ring-teal-500' : 'border-gray-200'
                }`}
              >
                {/* Trial/Grace Warning Banner */}
                {trialStatus && trialStatus.type !== 'expired' && (
                  <div className={`px-4 py-2 text-sm flex items-center gap-2 ${
                    trialStatus.type === 'trial' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'bg-orange-50 text-orange-700'
                  }`}>
                    <Clock className="w-4 h-4" />
                    {trialStatus.type === 'trial'
                      ? `${trialStatus.daysLeft} days left in trial`
                      : `Grace period: ${trialStatus.daysLeft} days remaining`
                    }
                  </div>
                )}

                {trialStatus?.type === 'expired' && (
                  <div className="px-4 py-2 text-sm flex items-center gap-2 bg-red-50 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    Trial expired - Add payment to continue
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {store.logo ? (
                          <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{store.name}</h3>
                        <p className="text-sm text-gray-500">/{store.slug}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isDefault && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-teal-100 text-teal-700">
                          Default
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPlanBadgeColor(store.subscriptionPlan)}`}>
                        {store.subscriptionPlan}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className={`px-2 py-1 rounded-full ${
                      store.subscriptionStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {store.subscriptionStatus}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>Role: {store.role}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/stores/${store.id}/dashboard`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      href={`/${store.slug}`}
                      target="_blank"
                      className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View storefront"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/stores/${store.id}/settings/business`}
                      className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Set as Default button - only show for non-default stores when user has multiple stores */}
                  {stores.length > 1 && !isDefault && (
                    <button
                      onClick={() => setAsDefaultStore(store.id)}
                      disabled={settingDefault === store.id}
                      className="mt-3 w-full text-center text-sm text-gray-500 hover:text-teal-600 transition-colors disabled:opacity-50"
                    >
                      {settingDefault === store.id ? 'Setting...' : 'Set as default store'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Create New Store Card */}
          {storeLimits?.canCreate && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Create New Store</h3>
              <p className="text-sm text-gray-500 mb-4">
                Set up another store or catalog
              </p>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => setShowQuickCreate(true)}
                  className="w-full px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Quick Create
                </button>
                <Link
                  href="/setup"
                  className="w-full px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Full Setup Wizard
                </Link>
              </div>
            </div>
          )}

          {/* Upgrade Card (when limit reached) */}
          {storeLimits?.limitReached && storeLimits.suggestedUpgrade && (
            <Link
              href={stores[0] ? `/admin/stores/${stores[0].id}/settings/billing` : '/pricing'}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 flex flex-col items-center justify-center text-center min-h-[200px]"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Need More Stores?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upgrade to {storeLimits.suggestedUpgrade} for {
                  storeLimits.suggestedUpgrade === 'PRO' ? 'up to 5 stores' : 'unlimited stores'
                }
              </p>
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                View plans <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          )}
        </div>

        {/* Empty State */}
        {stores.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No stores yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first store to start selling with WaveOrder
            </p>
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Store
            </Link>
          </div>
        )}
      </div>

      {/* Quick Create Modal */}
      <QuickCreateStoreModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
      />
    </div>
  )
}
