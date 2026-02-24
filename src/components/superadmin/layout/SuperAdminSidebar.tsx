'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  Users,
  Settings,
  TrendingUp,
  X,
  Activity,
  HeadphonesIcon,
  Ticket,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  MapPin,
  Server,
  FileText,
  Bug,
  Globe,
  DollarSign,
  Megaphone,
  LayoutDashboard,
  UserPlus,
  UsersRound,
  Star,
  Brain,
  Key,
  ClipboardList,
  ShoppingCart,
  CalendarCheck,
  Scissors,
  Search,
  Mail,
  Inbox,
  Puzzle,
  Heart,
  Calendar,
  Crown,
    StickyNote,
    Banknote,
    ArrowRightLeft,
    Map
} from 'lucide-react';

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuperAdminSidebar({ isOpen, onClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  // Auto-expand menus based on current path
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const items: string[] = []
    if (pathname?.startsWith('/superadmin/system')) items.push('System')
    if (pathname?.startsWith('/superadmin/financial')) items.push('Financial')
    if (pathname?.startsWith('/superadmin/analytics')) items.push('Analytics')
    if (pathname?.startsWith('/superadmin/operations')) items.push('Operations Analytics')
    if (pathname?.startsWith('/superadmin/support')) items.push('Support')
    if (pathname?.startsWith('/superadmin/locations')) items.push('Locations')
    if (pathname?.startsWith('/superadmin/marketing')) items.push('Marketing')
    if (pathname?.startsWith('/superadmin/wavemind')) items.push('Wavemind Engine')
    if (pathname?.startsWith('/superadmin/contact')) items.push('Contact')
    if (pathname?.startsWith('/superadmin/integrations')) items.push('Integrations')
    if (pathname?.startsWith('/superadmin/settings')) items.push('Settings')
    return items
  });
  
  const navigation = [
    { name: 'Dashboard', href: '/superadmin/dashboard', icon: BarChart3 },
    { name: 'Businesses', href: '/superadmin/businesses', icon: Building2 },
    { name: 'Users', href: '/superadmin/users', icon: Users },
    { name: 'Team', href: '/superadmin/team', icon: UsersRound },
    { name: 'Leads', href: '/superadmin/leads', icon: UserPlus },
    { name: 'Events', href: '/superadmin/events', icon: Calendar },
    { 
      name: 'Marketing', 
      icon: Megaphone,
      children: [
        { 
          name: 'Feedback', 
          href: '/superadmin/marketing/feedback', 
          icon: Star
        }
      ]
    },
    { 
      name: 'Financial', 
      icon: Banknote,
      children: [
        { 
          name: 'Dashboard', 
          href: '/superadmin/financial/dashboard', 
          icon: DollarSign
        },
        { 
          name: 'Transactions', 
          href: '/superadmin/financial/transactions', 
          icon: ArrowRightLeft
        }
      ]
    },
    { 
      name: 'Analytics', 
      icon: TrendingUp,
      children: [
        { 
          name: 'Overview', 
          href: '/superadmin/analytics', 
          icon: LayoutDashboard
        },
        { 
          name: 'Geolocation', 
          href: '/superadmin/analytics/geolocation', 
          icon: Globe
        },
        { 
          name: 'Financial', 
          href: '/superadmin/analytics/financial', 
          icon: DollarSign
        },
        { 
          name: 'Marketing', 
          href: '/superadmin/analytics/marketing', 
          icon: Megaphone
        },
        { 
          name: 'CX Analytics', 
          href: '/superadmin/analytics/cx', 
          icon: Heart
        }
      ]
    },
    { 
      name: 'Operations Analytics', 
      icon: ClipboardList,
      children: [
        { 
          name: 'Orders', 
          href: '/superadmin/operations/orders', 
          icon: ShoppingCart
        },
        { 
          name: 'Bookings', 
          href: '/superadmin/operations/bookings', 
          icon: Scissors
        },
        { 
          name: 'Service Requests', 
          href: '/superadmin/operations/service-requests', 
          icon: Inbox
        },
        { 
          name: 'General', 
          href: '/superadmin/operations/general', 
          icon: Search
        }
      ]
    },
    { 
      name: 'Support', 
      icon: HeadphonesIcon,
      children: [
        { 
          name: 'Tickets', 
          href: '/superadmin/support/tickets', 
          icon: Ticket
        },
        { 
          name: 'Messages', 
          href: '/superadmin/support/messages', 
          icon: MessageSquare
        },
        { 
          name: 'Settings', 
          href: '/superadmin/support/settings', 
          icon: Settings
        }
      ]
    },
    { 
      name: 'Locations', 
      icon: MapPin,
      children: [
        { 
          name: 'Configurations', 
          href: '/superadmin/locations/configurations', 
          icon: Settings
        }
      ]
    },
    { 
      name: 'System', 
      icon: Server,
      children: [
        { 
          name: 'General Logs', 
          href: '/superadmin/system/logs', 
          icon: FileText
        },
        { 
          name: 'Debug Tools', 
          href: '/superadmin/system/debug', 
          icon: Bug
        },
        { 
          name: 'Health Status', 
          href: '/superadmin/system/health', 
          icon: Activity
        },
        { 
          name: 'Custom Domains', 
          href: '/superadmin/system/domains', 
          icon: Globe
        },
        { 
          name: 'API Keys', 
          href: '/superadmin/system/api-keys', 
          icon: Key
        }
      ]
    },
    { 
      name: 'Wavemind Engine', 
      icon: Brain,
      children: [
        { 
          name: 'Financial', 
          href: '/superadmin/wavemind/financial', 
          icon: DollarSign
        }
      ]
    },
    { 
      name: 'Contact', 
      icon: Mail,
      children: [
        { 
          name: 'Web Submissions', 
          href: '/superadmin/contact/submissions', 
          icon: Inbox
        }
      ]
    },
    { 
      name: 'Integrations', 
      icon: Puzzle,
      children: [
        { 
          name: 'All Integrations', 
          href: '/superadmin/integrations', 
          icon: Puzzle
        },
        { 
          name: 'API Logs', 
          href: '/superadmin/integrations/logs', 
          icon: Activity
        }
      ]
    },
    { 
      name: 'Settings', 
      icon: Settings,
      children: [
        { 
          name: 'Subscription', 
          href: '/superadmin/settings/subscription', 
          icon: Crown
        },
        { 
          name: 'Notes', 
          href: '/superadmin/settings/notes', 
          icon: StickyNote
        },
        { 
          name: 'Roadmap', 
          href: '/superadmin/settings/roadmap', 
          icon: Map
        }
      ]
    },
  ];

  // Updated isActive function to match parent routes
  const isActive = (href: string) => {
    // Exact match
    if (pathname === href) return true;
    
    // Check if current path starts with the href (for nested routes)
    // This makes /superadmin/businesses/new match with /superadmin/businesses
    if (pathname.startsWith(href + '/')) return true;
    
    return false;
  };

  // Check if a parent item should be active (has active children)
  const isParentActive = (children: any[]) => {
    return children.some(child => isActive(child.href));
  };

  // Toggle expanded state for items with children
  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-1">
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
              <div>
                <span className="text-xl font-bold text-gray-900">WaveOrder</span>
                <p className="text-xs text-gray-500">SuperAdmin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  // Parent item with children
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isParentActive(item.children)
                          ? 'bg-teal-100 text-teal-700'
                          : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
                          isParentActive(item.children) ? 'text-teal-500' : 'text-gray-400'
                        }`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {expandedItems.includes(item.name) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    
                    {/* Children */}
                    {expandedItems.includes(item.name) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isActive(child.href)
                                ? 'bg-teal-100 text-teal-700'
                                : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                            }`}
                          >
                            <child.icon className={`w-4 h-4 mr-3 flex-shrink-0 ${
                              isActive(child.href) ? 'text-teal-500' : 'text-gray-400'
                            }`} />
                            <span className="truncate">{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular item without children
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-teal-100 text-teal-700'
                        : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      isActive(item.href) ? 'text-teal-500' : 'text-gray-400'
                    }`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* System Status */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-4 text-white">
              <h3 className="font-semibold text-sm mb-1">System Status</h3>
              <p className="text-xs text-teal-100 mb-3">All systems operational</p>
              <div className="text-xs text-teal-100">
                <div className="flex justify-between items-center">
                  <span>Uptime:</span>
                  <div className="flex items-center space-x-1">
                    <Activity className="w-3 h-3" />
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}