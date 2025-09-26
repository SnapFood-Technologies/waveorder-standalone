'use client'

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Building2, 
  Users, 
  Settings, 
  TrendingUp,
  X,
  Waves,
  Activity
} from 'lucide-react';

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuperAdminSidebar({ isOpen, onClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  
  const navigation = [
    { name: 'Dashboard', href: '/superadmin/dashboard', icon: BarChart3 },
    { name: 'Businesses', href: '/superadmin/businesses', icon: Building2 },
    { name: 'Users', href: '/superadmin/users', icon: Users },
    { name: 'Analytics', href: '/superadmin/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/superadmin/settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
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
              <Link
                key={item.href}
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