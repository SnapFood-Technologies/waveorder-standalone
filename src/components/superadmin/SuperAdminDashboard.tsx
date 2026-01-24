// components/superadmin/SuperAdminDashboard.tsx
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  DollarSign, 
  CheckCircle,
  TrendingUp,
  Activity,
  AlertTriangle,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Apple,
  Scissors,
  Gem,
  Flower2,
  MoreHorizontal,
  Eye,
  Calendar,
  ArrowUpRight,
  Info,
  X
} from 'lucide-react';
import { AuthMethodIcon } from './AuthMethodIcon';
import { StorefrontViewsChart } from './StorefrontViewsChart';

interface DashboardStats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  monthlyGrowth: number;
  recentSignups: number;
  totalPageViews: number;
}

// In SuperAdminDashboard.tsx, update the interface:
interface RecentBusiness {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  whatsappNumber: string;
  address: string | null;
  createdAt: string;
  subscriptionPlan: string;
  billingType?: 'monthly' | 'yearly' | 'free' | null;
  businessType: string;
  logo?: string;
  createdByAdmin: boolean;
  authMethod: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

const businessTypeIcons = {
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  RETAIL: ShoppingBag,
  GROCERY: Apple,
  HEALTH_BEAUTY: Scissors,
  JEWELRY: Gem,
  FLORIST: Flower2,
  OTHER: MoreHorizontal
};

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBusinesses, setRecentBusinesses] = useState<RecentBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<RecentBusiness | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        });

        const [statsResponse, businessesResponse] = await Promise.all([
          fetch(`/api/superadmin/stats?${params}`),
          fetch('/api/superadmin/recent-businesses')
        ]);

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const statsData = await statsResponse.json();
        setStats(statsData);

        if (businessesResponse.ok) {
          const businessesData = await businessesResponse.json();
          setRecentBusinesses(businessesData.businesses || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days <= 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isBusinessIncomplete = (business: RecentBusiness): boolean => {
    const hasWhatsApp = business.whatsappNumber && 
      business.whatsappNumber !== 'Not provided' && 
      business.whatsappNumber.trim() !== '';
    const hasAddress = business.address && 
      business.address !== 'Not set' && 
      business.address.trim() !== '';
    return !hasWhatsApp || !hasAddress;
  };

  const getIncompleteReasons = (business: RecentBusiness): { missingFields: string[]; suggestions: string[] } => {
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    const hasWhatsApp = business.whatsappNumber && 
      business.whatsappNumber !== 'Not provided' && 
      business.whatsappNumber.trim() !== '';
    const hasAddress = business.address && 
      business.address !== 'Not set' && 
      business.address.trim() !== '';

    if (!hasWhatsApp) {
      missingFields.push('WhatsApp Number');
      suggestions.push('Reach out to the business owner to help them set up their WhatsApp Business number');
      suggestions.push('Explain that WhatsApp is essential for receiving customer orders directly');
      suggestions.push('Offer support to guide them through the setup process if needed');
    }

    if (!hasAddress) {
      missingFields.push('Business Address');
      suggestions.push('Contact the business to collect their physical address or service area');
      suggestions.push('Explain that the address helps customers understand delivery/pickup locations');
      suggestions.push('Mention that it also improves local SEO and helps with order fulfillment');
    }

    return { missingFields, suggestions };
  };

  const openIncompleteModal = (business: RecentBusiness) => {
    setSelectedBusiness(business);
    setShowIncompleteModal(true);
  };

  const closeIncompleteModal = () => {
    setShowIncompleteModal(false);
    setSelectedBusiness(null);
  };

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    };
    
    return `${dateRange.start.toLocaleDateString('en-US', options)} – ${dateRange.end.toLocaleDateString('en-US', options)}`;
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'this_week':
        const weekStart = now.getDate() - now.getDay();
        start = new Date(now.getFullYear(), now.getMonth(), weekStart);
        break;
      case 'last_week':
        const lastWeekStart = now.getDate() - now.getDay() - 7;
        start = new Date(now.getFullYear(), now.getMonth(), lastWeekStart);
        end = new Date(now.getFullYear(), now.getMonth(), lastWeekStart + 6);
        break;
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setDateRange({ start, end });
  };

  const getBusinessIcon = (business: RecentBusiness) => {
    if (business.logo) {
      return (
        <img 
          src={business.logo} 
          alt={`${business.name} logo`}
          className="w-full h-full object-contain rounded-lg"
        />
      );
    }
    
    const IconComponent = businessTypeIcons[business.businessType as keyof typeof businessTypeIcons] || Building2;
    return <IconComponent className="w-5 h-5 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-64 mt-4 lg:mt-0 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <div className="text-center py-12">
          <p className="text-gray-500">No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">{formatDateRange()}</p>
        </div>
        
        {/* Date Filter */}
        <div className="mt-4 lg:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_week">Last Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/superadmin/businesses" className="block">
          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Businesses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBusinesses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-green-600 text-sm font-medium">
                +{stats.monthlyGrowth}% vs last month
              </span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Businesses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBusinesses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-gray-500 text-sm">
              All-time active rate
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-blue-600 text-sm font-medium">
              +{stats.recentSignups} this week
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-600">Page Views</p>
      <p className="text-2xl font-bold text-gray-900">{stats.totalPageViews}</p>
    </div>
    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
      <Eye className="w-6 h-6 text-yellow-600" />
    </div>
  </div>
  <div className="mt-4 flex items-center">
    <span className="text-gray-500 text-sm">
      Across all storefronts
    </span>
  </div>
</div>
      </div>

      {/* Recent Business Registrations */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Business Registrations</h3>
            <div className="flex items-start sm:items-center gap-2 mt-1">
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">Shows 10 most recent registrations, independent of date filter</p>
              <div className="group relative flex-shrink-0">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Shows 10 most recent registrations, independent of date filter
                </div>
              </div>
            </div>
          </div>
          <Link 
            href="/superadmin/businesses"
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors inline-flex items-center justify-center gap-2 flex-shrink-0 w-full sm:w-auto"
          >
            View All
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        {recentBusinesses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Business</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Owner</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Registration</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">WhatsApp</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">Plan</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Registered</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBusinesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {getBusinessIcon(business)}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{business.name}</p>
                          {isBusinessIncomplete(business) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              <span>Incomplete</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openIncompleteModal(business);
                                }}
                                className="hover:bg-yellow-200 rounded-full p-0.5 transition-colors"
                                title="View incomplete details"
                              >
                                <Info className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900">{business.owner}</p>
                          <AuthMethodIcon authMethod={business.authMethod as 'google' | 'email' | 'magic-link' | 'oauth'} />
                        </div>
                        <p className="text-xs text-gray-500">{business.ownerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
  {business.createdByAdmin ? (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
      Self
    </span>
  )}
</td>
                    <td className="py-3 px-3">
                      <p className="text-sm text-gray-600">{business.whatsappNumber || 'Not provided'}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="text-sm text-gray-600 capitalize">
                        {business.businessType.toLowerCase().replace('_', ' ')}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        business.subscriptionPlan === 'PRO' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {business.subscriptionPlan}
                        {business.billingType && (
                          <span className="ml-1 text-gray-600">
                            ({business.billingType === 'free' ? 'Free' : business.billingType === 'monthly' ? 'Monthly' : 'Yearly'})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm text-gray-500">
                        {formatTime(business.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent business registrations</p>
          </div>
        )}
      </div>

      {/* Storefront Analytics Chart */}
      <StorefrontViewsChart className="mt-6" />

      {/* Incomplete Business Info Modal */}
      {showIncompleteModal && selectedBusiness && (
        <IncompleteInfoModal
          business={selectedBusiness}
          onClose={closeIncompleteModal}
          getIncompleteReasons={getIncompleteReasons}
        />
      )}
    </div>
  );
}

// Incomplete Info Modal Component
interface IncompleteInfoModalProps {
  business: RecentBusiness;
  onClose: () => void;
  getIncompleteReasons: (business: RecentBusiness) => { missingFields: string[]; suggestions: string[] };
}

function IncompleteInfoModal({ business, onClose, getIncompleteReasons }: IncompleteInfoModalProps) {
  const { missingFields, suggestions } = getIncompleteReasons(business);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Incomplete Business Setup</h3>
              <p className="text-sm text-gray-600">{business.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Missing Information:</h4>
            <ul className="space-y-2 mb-4">
              {missingFields.map((field, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                  {field}
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>💡 Suggestions:</span>
            </h4>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-teal-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}