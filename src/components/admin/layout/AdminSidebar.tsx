// src/components/admin/layout/AdminSidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  Waves,
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
  SlidersHorizontal
} from 'lucide-react'
import { useBusiness } from '@/contexts/BusinessContext'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
}

type Plan = 'STARTER' | 'PRO'

interface NavigationItem {
  name: string
  href?: string
  icon: any
  requiredPlan: Plan
  badge?: string
  children?: NavigationItem[]
}

export function AdminSidebar({ isOpen, onClose, businessId }: AdminSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const { subscription } = useBusiness()
  
  const [expandedItems, setExpandedItems] = useState<string[]>(['Settings'])
  const [brandsEnabled, setBrandsEnabled] = useState(false)
  const [collectionsEnabled, setCollectionsEnabled] = useState(false)
  const [groupsEnabled, setGroupsEnabled] = useState(false)
  const [customMenuEnabled, setCustomMenuEnabled] = useState(false)
  const [customFilteringEnabled, setCustomFilteringEnabled] = useState(false)
  const [userRole, setUserRole] = useState<'OWNER' | 'MANAGER' | 'STAFF' | null>(null)

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
    
    fetchFeatureFlags()
    fetchUserRole()
  }, [businessId])
  
  // Check if user can access products (STAFF cannot)
  const canAccessProducts = userRole !== 'STAFF'

  const baseUrl = `/admin/stores/${businessId}`

  const navigation: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: `${baseUrl}/dashboard`, 
      icon: LayoutDashboard, 
      requiredPlan: 'STARTER'
    },
    { 
      name: 'Orders', 
      href: `${baseUrl}/orders`, 
      icon: ShoppingBag, 
      requiredPlan: 'STARTER'
    },
    // Products menu - hidden for STAFF role (they can only view/manage orders)
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
    }] : []),
    { 
      name: 'Customers', 
      href: `${baseUrl}/customers`, 
      icon: Users, 
      requiredPlan: 'STARTER'
    },
    { 
      name: 'Appearance', 
      href: `${baseUrl}/appearance`, 
      icon: Palette, 
      requiredPlan: 'STARTER'
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
    
    // @ts-ignore
    ...(subscription.plan === 'PRO' ? [
      { 
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
      },
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
      { 
        name: 'Team Management', 
        href: `${baseUrl}/team`, 
        icon: UserPlus, 
        requiredPlan: 'PRO' as Plan
      },
      // Temporarily commented out - Domain Management not yet implemented
      // { 
      //   name: 'Domain Management', 
      //   href: `${baseUrl}/domains`, 
      //   icon: Globe, 
      //   requiredPlan: 'PRO' as Plan
      // },
    ] : []),
    
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
      ]
    },
  ]

  const isFeatureAvailable = (requiredPlan: Plan): boolean => {
    const planHierarchy: Record<Plan, number> = {
      'STARTER': 0,
      'PRO': 1
    }
    
    return planHierarchy[subscription.plan] >= planHierarchy[requiredPlan]
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
            <Link href="/" className="flex items-center space-x-3" onClick={onClose}>
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">WaveOrder</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map(renderNavigationItem)}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-4 text-white">
              <h3 className="font-semibold text-sm mb-1">
                {subscription.plan === 'STARTER' ? 'Pro Features Available' : 'Pro Plan Active'}
              </h3>
              <p className="text-xs text-teal-100 mb-3">
                {subscription.plan === 'STARTER' 
                  ? 'Unlock inventory, discounts, analytics, team & domain management' 
                  : 'Enjoying advanced features and analytics'}
              </p>
              {subscription.plan === 'PRO' && (
                <div className="text-xs text-teal-100">
                  Thanks for being a Pro user!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}