// src/components/admin/layout/AdminSidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Palette, 
  Megaphone,
  Settings, 
  X,
  ChevronDown,
  ChevronRight,
  Store,
  Boxes,
  BarChart3,
  Percent,
  User,
  Cog,
  CreditCard,
  List,
  Upload,
  Activity,
  TrendingUp,
  UserPlus,
  Globe,
  Bell,
  HelpCircle,
  BookOpen,
  Ticket,
  MessageSquare,
  Tag,
  Layers,
  FolderTree,
  Menu,
  SlidersHorizontal,
  Clock,
  DollarSign,
  ChefHat,
  Key,
  Scissors,
  Calendar,
  CalendarClock
} from 'lucide-react'
import { useBusiness } from '@/contexts/BusinessContext'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
}

type Plan = 'STARTER' | 'PRO' | 'BUSINESS'

interface NavigationItem {
  name: string
  href?: string
  icon: any
  requiredPlan?: Plan
  badge?: string
  children?: NavigationItem[]
}

export function AdminSidebar({ isOpen, onClose, businessId }: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const { subscription, currentBusiness } = useBusiness()
  
  // Helper to check trial status
  const getTrialInfo = () => {
    if (!currentBusiness?.trialEndsAt) return { isOnTrial: false, daysLeft: 0 }
    const now = new Date()
    const trialEnd = new Date(currentBusiness.trialEndsAt)
    if (trialEnd <= now) return { isOnTrial: false, daysLeft: 0 }
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { isOnTrial: true, daysLeft }
  }
  
  const trialInfo = getTrialInfo()
  
  const [expandedItems, setExpandedItems] = useState<string[]>(['Settings'])
  const [brandsEnabled, setBrandsEnabled] = useState(false)
  const [collectionsEnabled, setCollectionsEnabled] = useState(false)
  const [groupsEnabled, setGroupsEnabled] = useState(false)
  const [customMenuEnabled, setCustomMenuEnabled] = useState(false)
  const [customFilteringEnabled, setCustomFilteringEnabled] = useState(false)
  const [happyHourEnabled, setHappyHourEnabled] = useState(false)
  const [showCostPriceEnabled, setShowCostPriceEnabled] = useState(false)
  const [showProductionPlanningEnabled, setShowProductionPlanningEnabled] = useState(false)
  const [userRole, setUserRole] = useState<'OWNER' | 'MANAGER' | 'STAFF' | null>(null)
  const [storeCount, setStoreCount] = useState(1)
  const [stores, setStores] = useState<Array<{ id: string; name: string; slug: string; logo: string | null }>>([])
  const [showStoreSwitcher, setShowStoreSwitcher] = useState(false)
  const [businessType, setBusinessType] = useState<string | null>(null)

  // Check if SuperAdmin is impersonating
  const isImpersonating = 
    session?.user?.role === 'SUPER_ADMIN' && 
    pathname.startsWith('/admin')

  // Helper function to add impersonation params to URLs
  const addImpersonationParams = (href: string) => {
    if (!isImpersonating) return href
    
    const url = new URL(href, window.location.origin)
    url.searchParams.set('impersonate', 'true')
    url.searchParams.set('businessId', businessId)
    return url.pathname + url.search
  }

  // Fetch feature flags and user role
  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBrandsEnabled(data.business?.brandsFeatureEnabled || false)
          setCollectionsEnabled(data.business?.collectionsFeatureEnabled || false)
          setGroupsEnabled(data.business?.groupsFeatureEnabled || false)
          setCustomMenuEnabled(data.business?.customMenuEnabled || false)
          setCustomFilteringEnabled(data.business?.customFilteringEnabled || false)
          setHappyHourEnabled(data.business?.happyHourEnabled || false)
          setShowCostPriceEnabled(data.business?.showCostPrice || false)
          setShowProductionPlanningEnabled(data.business?.showProductionPlanning || false)
          setBusinessType(data.business?.businessType || null)
          // Set user role from response (if available) or fetch separately
          if (data.userRole) {
            setUserRole(data.userRole)
          }
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error)
      }
    }
    
    // Fetch user's role for this business
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/user-role`)
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.role)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }

    // Fetch user's stores (for showing/hiding Switch Store and store switcher)
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/user/businesses')
        if (response.ok) {
          const data = await response.json()
          const businessList = data.businesses || []
          setStoreCount(businessList.length || 1)
          setStores(businessList.map((b: any) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            logo: b.logo || null
          })))
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
      }
    }
    
    fetchFeatureFlags()
    fetchUserRole()
    fetchStores()
  }, [businessId])
  
  // Check if user can access products (STAFF cannot)
  const canAccessProducts = userRole !== 'STAFF'
  const isSalon = businessType === 'SALON'

  const baseUrl = `/admin/stores/${businessId}`

  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: `${baseUrl}/dashboard`, 
      icon: LayoutDashboard, 
      requiredPlan: 'STARTER'
    },
    // SALON: Appointments (replaces Orders)
    // @ts-ignore
    ...(isSalon ? [
      {
        name: 'Appointments',
        icon: Calendar,
        requiredPlan: 'STARTER' as Plan,
        children: [
          {
            name: 'All Appointments',
            href: `${baseUrl}/appointments`,
            icon: Calendar,
            requiredPlan: 'STARTER' as Plan
          },
          // @ts-ignore
          ...((subscription.plan === 'PRO' || subscription.plan === 'BUSINESS') ? [{
            name: 'Calendar View',
            href: `${baseUrl}/appointments/calendar`,
            icon: CalendarClock,
            requiredPlan: 'PRO' as Plan
          }] : []),
        ]
      }
    ] : [
      // NON-SALON: Orders - with optional Production Queue submenu
      // @ts-ignore
      ...(showProductionPlanningEnabled ? [{
        name: 'Orders',
        icon: ShoppingBag,
        requiredPlan: 'STARTER' as Plan,
        children: [
          {
            name: 'All Orders',
            href: `${baseUrl}/orders`,
            icon: ShoppingBag,
            requiredPlan: 'STARTER' as Plan
          },
          {
            name: 'Production Queue',
            href: `${baseUrl}/orders/production`,
            icon: ChefHat,
            requiredPlan: 'STARTER' as Plan
          }
        ]
      }] : [{
        name: 'Orders', 
        href: `${baseUrl}/orders`, 
        icon: ShoppingBag, 
        requiredPlan: 'STARTER' as Plan
      }])
    ]),
    // SALON: Services (replaces Products)
    // @ts-ignore
    ...(isSalon ? [
      {
        name: 'Services',
        icon: Scissors,
        requiredPlan: 'STARTER' as Plan,
        children: [
          {
            name: 'List',
            href: `${baseUrl}/services`,
            icon: List,
            requiredPlan: 'STARTER' as Plan
          },
          {
            name: 'Categories',
            href: `${baseUrl}/service-categories`,
            icon: Boxes,
            requiredPlan: 'STARTER' as Plan
          },
        ]
      }
    ] : [
      // NON-SALON: Products menu - hidden for STAFF role
      // @ts-ignore
      ...(canAccessProducts ? [{ 
        name: 'Products', 
        icon: Package, 
        requiredPlan: 'STARTER',
        children: [
          { 
            name: 'List', 
            href: `${baseUrl}/products`, 
            icon: List, 
            requiredPlan: 'STARTER'
          },
          { 
            name: 'Categories', 
            href: `${baseUrl}/product-categories`, 
            icon: Boxes, 
            requiredPlan: 'STARTER'
          },
          // @ts-ignore
          ...(brandsEnabled ? [{
            name: 'Brands', 
            href: `${baseUrl}/brands`, 
            icon: Tag, 
            requiredPlan: 'STARTER'
          }] : []),
          // @ts-ignore
          ...(collectionsEnabled ? [{
            name: 'Collections', 
            href: `${baseUrl}/collections`, 
            icon: Layers, 
            requiredPlan: 'STARTER'
          }] : []),
          // @ts-ignore
          ...(groupsEnabled ? [{
            name: 'Groups', 
            href: `${baseUrl}/groups`, 
            icon: FolderTree, 
            requiredPlan: 'STARTER'
          }] : []),
          { 
            name: 'Import', 
            href: `${baseUrl}/products/import`, 
            icon: Upload, 
            // @ts-ignore
            requiredPlan: 'STARTER'
          },
        ]
      }] : [])
    ]),
    { 
      name: 'Customers', 
      href: `${baseUrl}/customers`, 
      icon: Users, 
      // @ts-ignore
      requiredPlan: 'STARTER'
    },
    { 
      name: 'Appearance', 
      href: `${baseUrl}/appearance`, 
      icon: Palette, 
      // @ts-ignore
      requiredPlan: 'STARTER' as Plan
    },
    { 
      name: 'Marketing', 
      href: `${baseUrl}/marketing`, 
      icon: Megaphone, 
      // @ts-ignore
      requiredPlan: 'STARTER' as Plan
    },
    
    // Help & Support (only show when not impersonating)
    // @ts-ignore
    ...(!isImpersonating ? [
      { 
        name: 'Help & Support', 
        icon: HelpCircle,
        requiredPlan: 'STARTER',
        children: [
          { 
            name: 'Help Center', 
            href: `${baseUrl}/help`, 
            icon: BookOpen, 
            requiredPlan: 'STARTER'
          },
          { 
            name: 'Support Tickets', 
            href: `${baseUrl}/support/tickets`, 
            icon: Ticket, 
            requiredPlan: 'STARTER'
          },
          { 
            name: 'Messages', 
            href: `${baseUrl}/support/messages`, 
            icon: MessageSquare, 
            requiredPlan: 'STARTER'
          },
        ]
      }
    ] : []),
    
    // PRO and BUSINESS plan features (BUSINESS includes all PRO features)
    // @ts-ignore
    ...((subscription.plan === 'PRO' || subscription.plan === 'BUSINESS') ? [
      // Inventory - only for non-salon businesses
      // @ts-ignore
      ...(!isSalon ? [{
        name: 'Inventory', 
        icon: Boxes,
        requiredPlan: 'PRO' as Plan,
        children: [
          { 
            name: 'Dashboard', 
            href: `${baseUrl}/inventory`, 
            icon: LayoutDashboard, 
            requiredPlan: 'PRO' as Plan
          },
          { 
            name: 'Activities', 
            href: `${baseUrl}/inventory/activities`, 
            icon: Activity, 
            requiredPlan: 'PRO' as Plan
          },
          { 
            name: 'Stock Adjustment', 
            href: `${baseUrl}/inventory/adjustments`, 
            icon: TrendingUp, 
            requiredPlan: 'PRO' as Plan
          },
        ]
      }] : []),
      { 
        name: 'Discounts', 
        href: `${baseUrl}/discounts`, 
        icon: Percent, 
        requiredPlan: 'PRO' as Plan
      },
      { 
        name: 'Analytics', 
        href: `${baseUrl}/analytics`, 
        icon: BarChart3, 
        requiredPlan: 'PRO' as Plan
      },
    ] : []),
    
    // BUSINESS plan features
    // @ts-ignore
    ...(subscription.plan === 'BUSINESS' ? [
      // Team Management - BUSINESS plan only (all business types)
      {
        name: 'Team Management', 
        href: `${baseUrl}/team`, 
        icon: UserPlus, 
        requiredPlan: 'BUSINESS' as Plan
      },
      // Staff Availability - SALON only
      // @ts-ignore
      ...(isSalon ? [{
        name: 'Staff Availability',
        href: `${baseUrl}/staff/availability`,
        icon: Clock,
        requiredPlan: 'BUSINESS' as Plan
      }] : []),
      { 
        name: 'Custom Domain', 
        href: `${baseUrl}/domains`, 
        icon: Globe, 
        requiredPlan: 'BUSINESS' as Plan
      },
      { 
        name: 'API Access', 
        href: `${baseUrl}/api`, 
        icon: Key, 
        requiredPlan: 'BUSINESS' as Plan
      },
    ] : []),
    
    // Cost & Margins - only shown when enabled by SuperAdmin
    // @ts-ignore
    ...(showCostPriceEnabled ? [{
      name: 'Cost & Margins',
      href: `${baseUrl}/cost-margins`,
      icon: DollarSign,
      requiredPlan: 'STARTER' as Plan
    }] : []),
    
    { 
      name: 'Settings', 
      icon: Settings, 
      // @ts-ignore
      requiredPlan: 'STARTER' as Plan,
      // @ts-ignore
      children: [
        { 
          name: 'Business', 
          href: `${baseUrl}/settings/business`, 
          icon: User, 
          requiredPlan: 'STARTER'
        },
        { 
          name: 'Billing', 
          href: `${baseUrl}/settings/billing`, 
          icon: CreditCard, 
          requiredPlan: 'STARTER'
        },
        { 
          name: 'Order Notifications', 
          href: `${baseUrl}/settings/notifications`, 
          icon: Bell, 
          requiredPlan: 'STARTER'
        },
        { 
          name: 'Configurations', 
          href: `${baseUrl}/settings/configurations`, 
          icon: Cog, 
          requiredPlan: 'STARTER'
        },
        // @ts-ignore
        ...(customMenuEnabled ? [{
          name: 'Custom Menu', 
          href: `${baseUrl}/custom-menu`, 
          icon: Menu, 
          requiredPlan: 'STARTER' as Plan
        }] : []),
        // @ts-ignore
        ...(customFilteringEnabled ? [{
          name: 'Custom Filtering', 
          href: `${baseUrl}/custom-filtering`, 
          icon: SlidersHorizontal, 
          requiredPlan: 'STARTER' as Plan
        }] : []),
        // @ts-ignore
        ...(happyHourEnabled ? [{
          name: 'Happy Hour', 
          href: `${baseUrl}/settings/happy-hour`, 
          icon: Clock, 
          requiredPlan: 'STARTER' as Plan
        }] : []),
      ]
    },
  ]

  const isFeatureAvailable = (requiredPlan?: Plan): boolean => {
    if (!requiredPlan) return true // No plan required = always available
    const planHierarchy: Record<Plan, number> = {
      'STARTER': 0,
      'PRO': 1,
      'BUSINESS': 2
    }
    
    return (planHierarchy[subscription.plan] || 0) >= planHierarchy[requiredPlan]
  }

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => pathname === href
  const isParentActive = (children: NavigationItem[]) => 
    children.some(child => child.href && pathname === child.href)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const renderNavigationItem = (item: NavigationItem) => {
    const available = isFeatureAvailable(item.requiredPlan)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.name)
    // @ts-ignore
    const parentActive = hasChildren && isParentActive(item.children)

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
              parentActive 
                ? 'bg-teal-50 text-teal-700' 
                : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
            }`}
          >
            <div className="flex items-center">
              <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
                parentActive 
                  ? 'text-teal-500' 
                  : 'text-gray-400 group-hover:text-teal-500'
              }`} />
              <span className="truncate">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-8 mt-1 space-y-1">
              {/* @ts-ignore */}
              {item.children.map(child => (
                <Link
                  key={child.name}
                  href={addImpersonationParams(child.href || '#')}
                  onClick={onClose}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive(child.href!)
                      ? 'bg-teal-100 text-teal-700 font-medium'
                      : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  <child.icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span className="truncate">{child.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        href={addImpersonationParams(item.href || '#')}
        onClick={onClose}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
          isActive(item.href!)
            ? 'bg-teal-100 text-teal-700'
            : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
        }`}
      >
        <div className="flex items-center">
          <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
            isActive(item.href!)
              ? 'text-teal-500'
              : 'text-gray-400 group-hover:text-teal-500'
          }`} />
          <span className="truncate">{item.name}</span>
        </div>
      </Link>
    )
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-1" onClick={onClose}>
              <Image
                src="/images/waveorderlogo.png"
                alt="WaveOrder Logo"
                width={50}
                height={50}
                quality={100}
                unoptimized
                placeholder="empty"
                className="w-[50px] h-[50px]"
              />
              <span className="text-xl font-bold text-gray-900">WaveOrder</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Manage Stores Link - Only show for PRO/BUSINESS users */}
          {(subscription.plan === 'PRO' || subscription.plan === 'BUSINESS') && (
            <div className="px-4 pt-4 pb-2">
              <Link
                href={addImpersonationParams(`/admin/stores/${businessId}/all-stores`)}
                onClick={onClose}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-gray-200"
              >
                <Store className="w-4 h-4 mr-2" />
                <span>Manage Stores</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            </div>
          )}

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map(renderNavigationItem)}
          </nav>

          {/* Store Switcher - Only show for users with 2+ stores */}
          {storeCount > 1 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="relative">
                <button
                  onClick={() => setShowStoreSwitcher(!showStoreSwitcher)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {stores.find(s => s.id === businessId)?.logo ? (
                    <img 
                      src={stores.find(s => s.id === businessId)?.logo || ''} 
                      alt="" 
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Store className="w-4 h-4 text-teal-600" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {stores.find(s => s.id === businessId)?.name || 'Current Store'}
                    </p>
                    <p className="text-xs text-gray-500">Switch store</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showStoreSwitcher ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown */}
                {showStoreSwitcher && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="py-1 max-h-48 overflow-y-auto">
                      {stores.filter(s => s.id !== businessId).map((store) => (
                        <Link
                          key={store.id}
                          href={isImpersonating ? `/admin/stores/${store.id}/dashboard?impersonate=true&businessId=${store.id}` : `/admin/stores/${store.id}/dashboard`}
                          onClick={() => {
                            setShowStoreSwitcher(false)
                            onClose()
                          }}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          {store.logo ? (
                            <img src={store.logo} alt="" className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                              <Store className="w-3 h-3 text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm text-gray-700 truncate">{store.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-200">
            <div className={`rounded-lg p-4 text-white ${
              trialInfo.isOnTrial
                ? 'bg-amber-500 bg-gradient-to-r from-amber-500 to-orange-500'
                : subscription.plan === 'BUSINESS' 
                ? 'bg-purple-600 bg-gradient-to-r from-purple-600 to-indigo-600'
                : subscription.plan === 'PRO'
                ? 'bg-teal-500 bg-gradient-to-r from-teal-500 to-emerald-500'
                : 'bg-gray-500 bg-gradient-to-r from-gray-500 to-gray-600'
            }`}>
              <h3 className="font-semibold text-sm mb-1">
                {trialInfo.isOnTrial
                  ? `Trial - ${trialInfo.daysLeft} days left`
                  : subscription.plan === 'STARTER' 
                  ? 'Upgrade Available' 
                  : subscription.plan === 'PRO'
                  ? 'Pro Plan Active'
                  : 'Business Plan Active'}
              </h3>
              <p className="text-xs opacity-90 mb-2">
                {trialInfo.isOnTrial
                  ? `Enjoying ${subscription.plan} features`
                  : subscription.plan === 'STARTER' 
                  ? 'Unlock scheduling, analytics & more' 
                  : subscription.plan === 'PRO'
                  ? 'Advanced features and analytics'
                  : 'Full access with team & API'}
              </p>
              <div className="text-xs opacity-75 mb-2">
                {trialInfo.isOnTrial
                  ? 'Upgrade before trial ends to keep features'
                  : subscription.plan === 'STARTER' 
                  ? 'Thanks for being a Starter user!'
                  : subscription.plan === 'PRO'
                  ? 'Thanks for being a Pro user!'
                  : 'Thanks for being a Business user!'}
              </div>
              {(trialInfo.isOnTrial || subscription.plan === 'STARTER' || subscription.plan === 'PRO') && (
                <Link 
                  href={addImpersonationParams(`/admin/stores/${businessId}/settings/billing`)}
                  className="text-xs underline hover:no-underline"
                  onClick={onClose}
                >
                  {trialInfo.isOnTrial ? 'Upgrade Now →' : subscription.plan === 'STARTER' ? 'View Plans →' : 'Upgrade to Business →'}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}