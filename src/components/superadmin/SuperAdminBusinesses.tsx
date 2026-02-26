'use client'

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  UserCheck,
  AlertTriangle,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Apple,
  Scissors,
  Briefcase,
  Gem,
  Flower2,
  MoreHorizontal,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MapPin,
  Eye,
  UserX,
  Calendar,
  Mail,
  Phone,
  Globe,
  Package,
  Info,
  CreditCard,
  Loader2,
  Check,
  Store,
  MessageSquare,
} from 'lucide-react';
import { AuthMethodIcon } from './AuthMethodIcon';
import Link from 'next/link'


interface Business {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  industry?: string | null;
  subscriptionPlan: string;
  billingType?: 'monthly' | 'yearly' | 'free' | null;
  subscriptionStatus: string;
  isActive: boolean;
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
  testMode?: boolean;
  currency: string;
  whatsappNumber: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  setupWizardCompleted: boolean;
  createdByAdmin: boolean;
  marketplaceRole?: 'originator' | 'supplier' | null;
  isMultiStore?: boolean;
  storeCount?: number;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    authMethod: 'google' | 'email' | 'magic-link' | 'oauth';
  } | null;
  stats: {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    supplierProductCount?: number; // For originators: total products from suppliers
    totalServiceRequests?: number; // SERVICES only
  };
}

// Helper to check if business is on trial
function isOnTrial(business: Business): boolean {
  if (!business.trialEndsAt) return false;
  return new Date(business.trialEndsAt) > new Date();
}

// Helper to get trial days remaining
function getTrialDaysRemaining(business: Business): number {
  if (!business.trialEndsAt) return 0;
  const now = new Date();
  const trialEnd = new Date(business.trialEndsAt);
  if (trialEnd <= now) return 0;
  return Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface CreateBusinessData {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  whatsappNumber: string;
  businessType: string;
  subscriptionPlan: string;
  currency: string;
  language: string;
  password?: string;
  sendEmail: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface SuccessMessage {
  title: string;
  message: string;
}

const businessTypeIcons = {
  RESTAURANT: UtensilsCrossed,
  CAFE: Coffee,
  RETAIL: ShoppingBag,
  GROCERY: Apple,
  SALON: Scissors,
  SERVICES: Briefcase,
  OTHER: MoreHorizontal
};

const businessTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  RETAIL: 'Retail',
  GROCERY: 'Grocery',
  SALON: 'Salon',
  SERVICES: 'Services',
  OTHER: 'Other'
};

const isSalonOrServices = (businessType: string | undefined) =>
  businessType?.toUpperCase() === 'SALON' || businessType?.toUpperCase() === 'SERVICES';

export function SuperAdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [planFilter, setPlanFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [includeTestBusinesses, setIncludeTestBusinesses] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [businessToDeactivate, setBusinessToDeactivate] = useState<Business | null>(null);
  const [businessToChangeSubscription, setBusinessToChangeSubscription] = useState<Business | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [businessToView, setBusinessToView] = useState<Business | null>(null);
  const [businessForIncomplete, setBusinessForIncomplete] = useState<Business | null>(null);
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const [updatingSubscription, setUpdatingSubscription] = useState(false);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 15,
    total: 0,
    pages: 0
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch businesses
  useEffect(() => {
    fetchBusinesses();
  }, [debouncedSearchQuery, statusFilter, planFilter, countryFilter, includeTestBusinesses, currentPage, perPage]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        status: statusFilter,
        plan: planFilter,
        country: countryFilter,
        includeTest: includeTestBusinesses.toString(),
        page: currentPage.toString(),
        limit: perPage.toString()
      });

      const response = await fetch(`/api/superadmin/businesses?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }

      const data = await response.json();
      setBusinesses(data.businesses);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setError(error instanceof Error ? error.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Update handleImpersonate
  const handleImpersonate = (business: Business) => {
    if (!business.setupWizardCompleted || !business.onboardingCompleted) {
      setImpersonateError(`Cannot impersonate "${business.name}" - setup is incomplete`);
      setTimeout(() => setImpersonateError(null), 5000);
      return;
    }
    const url = `/admin/stores/${business.id}/dashboard?impersonate=true&businessId=${business.id}`
    window.open(url, '_blank')
  }

  const isBusinessIncomplete = (business: Business): boolean => {
    const hasWhatsApp = business.whatsappNumber && 
      business.whatsappNumber !== 'Not provided' && 
      business.whatsappNumber.trim() !== '';
    const hasAddress = business.address && 
      business.address !== 'Not set' && 
      business.address.trim() !== '';
    return !hasWhatsApp || !hasAddress;
  }

  const getIncompleteReasons = (business: Business): { missingFields: string[]; suggestions: string[] } => {
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
      suggestions.push(`Explain that WhatsApp is essential for receiving customer ${(business.businessType?.toUpperCase() === 'SALON' || business.businessType?.toUpperCase() === 'SERVICES') ? 'appointments and requests' : 'orders'} directly`);
      suggestions.push('Offer support to guide them through the setup process if needed');
    }

    if (!hasAddress) {
      missingFields.push('Business Address');
      suggestions.push('Contact the business to collect their physical address or service area');
      suggestions.push('Explain that the address helps customers understand delivery/pickup locations');
      suggestions.push((business.businessType?.toUpperCase() === 'SALON' || business.businessType?.toUpperCase() === 'SERVICES')
        ? 'Mention that it also improves local SEO and helps with service request handling or order fulfillment'
        : 'Mention that it also improves local SEO and helps with order fulfillment');
    }

    return { missingFields, suggestions };
  }

  const openIncompleteModal = (business: Business) => {
    setBusinessForIncomplete(business);
    setShowIncompleteModal(true);
  }

  const closeIncompleteModal = () => {
    setShowIncompleteModal(false);
    setBusinessForIncomplete(null);
  }


  const openDeleteModal = (business: Business) => {
    setBusinessToDelete(business);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setBusinessToDelete(null);
    setShowDeleteModal(false);
  };

  const openDeactivateModal = (business: Business) => {
    setBusinessToDeactivate(business);
    setDeactivationReason('');
    setShowDeactivateModal(true);
  };

  const closeDeactivateModal = () => {
    setBusinessToDeactivate(null);
    setDeactivationReason('');
    setShowDeactivateModal(false);
  };

  const openQuickViewModal = (business: Business) => {
    setBusinessToView(business);
    setShowQuickViewModal(true);
  };

  const closeQuickViewModal = () => {
    setBusinessToView(null);
    setShowQuickViewModal(false);
  };

  const openSubscriptionModal = (business: Business) => {
    setBusinessToChangeSubscription(business);
    setShowSubscriptionModal(true);
  };

  const closeSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    setBusinessToChangeSubscription(null);
  };

  const handleDeleteBusiness = async () => {
    if (!businessToDelete) return;

    try {
      const response = await fetch(`/api/superadmin/businesses/${businessToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete business');
      }

      closeDeleteModal();
      fetchBusinesses();
      
      // Show success message
      setSuccessMessage({
        title: 'Business Deleted Successfully',
        message: `"${businessToDelete.name}" has been permanently deleted from the system.`
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error deleting business:', error);
      setError('Failed to delete business');
    }
  };

  const handleDeactivateBusiness = async () => {
    if (!businessToDeactivate) return;

    try {
      const response = await fetch(`/api/superadmin/businesses/${businessToDeactivate.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isActive: false,
          deactivationReason: deactivationReason.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate business');
      }

      closeDeactivateModal();
      fetchBusinesses();
      
      // Show success message
      setSuccessMessage({
        title: 'Business Deactivated Successfully',
        message: `"${businessToDeactivate.name}" has been deactivated successfully.`
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error deactivating business:', error);
      setError('Failed to deactivate business');
    }
  };

  const handleActivateBusiness = async (business: Business) => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${business.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });

      if (!response.ok) {
        throw new Error('Failed to activate business');
      }

      fetchBusinesses();
      
      // Show success message
      setSuccessMessage({
        title: 'Business Activated Successfully',
        message: `"${business.name}" has been activated successfully.`
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error activating business:', error);
      setError('Failed to activate business');
    }
  };

  const handleUpdateSubscription = async (subscriptionPlan: 'STARTER' | 'PRO' | 'BUSINESS', billingType: 'monthly' | 'yearly' | 'free') => {
    if (!businessToChangeSubscription) return;

    try {
      setUpdatingSubscription(true);
      setError(null);

      const response = await fetch(`/api/superadmin/businesses/${businessToChangeSubscription.id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionPlan,
          billingType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update subscription');
      }

      const result = await response.json();
      
      closeSubscriptionModal();
      fetchBusinesses();
      
      // Show success message
      setSuccessMessage({
        title: 'Subscription Updated Successfully',
        message: result.message || `"${businessToChangeSubscription.name}" subscription has been updated to ${subscriptionPlan} (${billingType}).`
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to update subscription');
    } finally {
      setUpdatingSubscription(false);
    }
  };

  // Wrapper for DeleteConfirmationModal compatibility
  const handleToggleBusinessStatus = async (business: Business) => {
    if (business.isActive) {
      openDeactivateModal(business);
    } else {
      await handleActivateBusiness(business);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBusinessIcon = (business: Business) => {
    if (business.logo) {
      return (
        <img 
          src={business.logo} 
          alt={`${business.name} logo`}
          className="w-full h-full object-contain rounded-lg"
        />
      );
    }
    
    const IconComponent = businessTypeIcons[(business.businessType?.toUpperCase() ?? '') as keyof typeof businessTypeIcons] || Building2;
    return <IconComponent className="w-5 h-5 text-gray-600" />;
  };

  if (loading && businesses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading businesses</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchBusinesses}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{successMessage.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{successMessage.message}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Businesses</h1>
          <p className="text-gray-600 mt-1">
            Manage all businesses on the platform
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Link
            href="/superadmin/businesses/new"
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Business
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses, owners, emails..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

        {/* Filters and Count */}
<div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
  >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
    <option value="incomplete">Incomplete</option>
  </select>
  
  <select
    value={planFilter}
    onChange={(e) => setPlanFilter(e.target.value)}
    className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
  >
    <option value="all">All Plans</option>
    <option value="starter">Starter</option>
    <option value="pro">Pro</option>
    <option value="business">Business</option>
  </select>

  <select
    value={countryFilter}
    onChange={(e) => setCountryFilter(e.target.value)}
    className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
  >
    <option value="all">All Countries</option>
    <option value="AL">Albania</option>
    <option value="BB">Barbados</option>
    <option value="BH">Bahrain</option>
    <option value="GR">Greece</option>
    <option value="IT">Italy</option>
    <option value="ES">Spain</option>
    <option value="GB">United Kingdom</option>
    <option value="US">United States</option>
  </select>

  {/* Test Businesses Checkbox */}
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={includeTestBusinesses}
      onChange={(e) => setIncludeTestBusinesses(e.target.checked)}
      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
    />
    <span className="text-sm text-gray-700">Include test businesses</span>
  </label>

  <div className="text-sm text-gray-600 text-center sm:text-left">
    {pagination.total} businesses
  </div>
</div>
        </div>
      </div>

      {impersonateError && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
    <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
    <p className="text-red-700">{impersonateError}</p>
    <button onClick={() => setImpersonateError(null)} className="ml-auto text-red-600">
      <X className="w-4 h-4" />
    </button>
  </div>
)}

      {/* Businesses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {businesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {debouncedSearchQuery ? 'No businesses found' : 'No businesses yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {debouncedSearchQuery 
                ? 'Try adjusting your search terms or filters to find the businesses you\'re looking for.'
                : 'Get started by creating your first business on the platform.'
              }
            </p>
            {!debouncedSearchQuery && (
              <Link
                href="/superadmin/businesses/new"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Business
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {businesses.map((business) => (
                    <tr key={business.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {getBusinessIcon(business)}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-medium text-gray-900">{business.name}</div>
                              {business.isMultiStore && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-800 rounded-full" title={`Owner has ${business.storeCount} stores`}>
                                  <Store className="w-3 h-3" />
                                  Multi-Store
                                </span>
                              )}
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
                            <div className="text-sm text-gray-500">
                              {businessTypeLabels[business.businessType?.toUpperCase()] || (business.businessType ?? '').toLowerCase().replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
  <div className="flex items-center gap-2">
    <div>
      <div className="text-sm font-medium text-gray-900">{business.owner?.name || 'Unknown'}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-gray-500">{business.owner?.email || 'No email'}</span>
        {business.owner && <AuthMethodIcon authMethod={business.owner.authMethod} />}
      </div>
      {business.createdByAdmin && (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded mt-1">
          Admin Created
        </span>
      )}
      {!business.createdByAdmin && (
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded mt-1">
          Self Registered
        </span>
      )}
    </div>
  </div>
</td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{business.whatsappNumber || 'Not provided'}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isOnTrial(business) && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                              Trial ({getTrialDaysRemaining(business)}d)
                            </span>
                          )}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            business.subscriptionPlan === 'BUSINESS'
                              ? 'bg-indigo-100 text-indigo-800'
                              : business.subscriptionPlan === 'PRO'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {business.subscriptionPlan}
                            {business.billingType && (
                              <span className="ml-1 text-xs font-normal opacity-75">
                                ({business.billingType === 'free' ? 'Free' : business.billingType === 'yearly' ? 'Yearly' : 'Monthly'})
                              </span>
                            )}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openSubscriptionModal(business);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Change Subscription Plan"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              business.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {business.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {business.testMode && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                Test
                              </span>
                            )}
                          </div>
                          {!business.isActive && business.deactivatedAt && (
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(business.deactivatedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              {business.deactivationReason && (
                                <div className="text-gray-700 max-w-xs truncate" title={business.deactivationReason}>
                                  {business.deactivationReason}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {business.address ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-32">{business.address}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not set</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(business.createdAt)}
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openQuickViewModal(business)}
                            className="text-gray-600 hover:text-gray-700 p-1"
                            title="Quick View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
  onClick={() => handleImpersonate(business)}
  disabled={!business.setupWizardCompleted || !business.onboardingCompleted}
  className={`p-1 ${
    business.setupWizardCompleted && business.onboardingCompleted
      ? 'text-blue-600 hover:text-blue-700'
      : 'text-gray-300 cursor-not-allowed'
  }`}
  title={
    business.setupWizardCompleted && business.onboardingCompleted
      ? 'Impersonate'
      : 'Setup Incomplete'
  }
>
  <UserCheck className="w-4 h-4" />
</button>
                          <button
                            onClick={() => window.open(`/${business.slug}`, '_blank')}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="View Store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          {business.isActive ? (
                            <button
                              onClick={() => openDeactivateModal(business)}
                              className="text-orange-600 hover:text-orange-700 p-1"
                              title="Deactivate"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateBusiness(business)}
                              className="text-green-600 hover:text-green-700 p-1"
                              title="Activate"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Delete"
                            onClick={() => openDeleteModal(business)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(pagination.pages > 1 || pagination.total > 0) && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * perPage) + 1} to{' '}
                      {Math.min(pagination.page * perPage, pagination.total)} of{' '}
                      {pagination.total} businesses
                    </div>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-500">per page</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                      disabled={pagination.page === pagination.pages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        business={businessToDelete}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteBusiness}
        onToggleStatus={handleToggleBusinessStatus}
      />

      {/* Deactivate Modal */}
      <DeactivateModal
        isOpen={showDeactivateModal}
        business={businessToDeactivate}
        reason={deactivationReason}
        onReasonChange={setDeactivationReason}
        onClose={closeDeactivateModal}
        onConfirm={handleDeactivateBusiness}
      />
      <SubscriptionChangeModal
        isOpen={showSubscriptionModal}
        business={businessToChangeSubscription}
        onClose={closeSubscriptionModal}
        onUpdate={handleUpdateSubscription}
        loading={updatingSubscription}
      />

      {/* Incomplete Info Modal */}
      {showIncompleteModal && businessForIncomplete && (
        <IncompleteInfoModal
          business={businessForIncomplete}
          onClose={closeIncompleteModal}
          getIncompleteReasons={getIncompleteReasons}
        />
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={showQuickViewModal}
        business={businessToView}
        onClose={closeQuickViewModal}
      />
    </div>
  );
}

// Quick View Modal Component
interface QuickViewModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
}

function QuickViewModal({ isOpen, business, onClose }: QuickViewModalProps) {
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  if (!isOpen || !business) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBusinessIcon = (business: Business) => {
    if (business.logo) {
      return (
        <img
          src={business.logo} 
          alt={`${business.name} logo`}
          className="w-full h-full object-contain rounded-lg"
        />
      );
    }
    
    const IconComponent = businessTypeIcons[(business.businessType?.toUpperCase() ?? '') as keyof typeof businessTypeIcons] || Building2;
    return <IconComponent className="w-8 h-8 text-gray-600" />;
  };

  const canImpersonate = business.setupWizardCompleted && business.onboardingCompleted;

  const handleImpersonate = () => {
    if (!canImpersonate) {
      setImpersonateError('Cannot impersonate this business - setup is incomplete');
      setTimeout(() => setImpersonateError(null), 5000);
      return;
    }
    
    window.open(
      `/admin/stores/${business.id}/dashboard?impersonate=true&businessId=${business.id}`, 
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {getBusinessIcon(business)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
              <p className="text-sm text-gray-600">
                {businessTypeLabels[business.businessType?.toUpperCase()] || (business.businessType ?? '').toLowerCase().replace('_', ' ')}
                {business.industry && (
                  <span className="text-gray-400"> • {business.industry}</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Plan */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              business.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {business.isActive ? 'Active' : 'Inactive'}
            </span>
            {business.testMode && (
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
                Test Mode
              </span>
            )}
            {isOnTrial(business) && (
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800">
                Trial ({getTrialDaysRemaining(business)} days left)
              </span>
            )}
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              business.subscriptionPlan === 'BUSINESS'
                ? 'bg-indigo-100 text-indigo-800'
                : business.subscriptionPlan === 'PRO'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {business.subscriptionPlan} Plan
              {business.billingType && (
                <span className="ml-1.5 text-xs font-normal opacity-75">
                  ({business.billingType === 'free' ? 'Free' : business.billingType === 'yearly' ? 'Yearly' : 'Monthly'})
                </span>
              )}
            </span>
            {business.marketplaceRole === 'originator' && (
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-teal-100 text-teal-800">
                Originator
              </span>
            )}
            {business.marketplaceRole === 'supplier' && (
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                Supplier
              </span>
            )}
            {!canImpersonate && (
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Setup Incomplete
              </span>
            )}
          </div>

          {/* Owner Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{business.owner?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">Owner</p>
                </div>
                <div className="flex-shrink-0">
                  {business.owner && <AuthMethodIcon authMethod={business.owner.authMethod} />}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{business.owner?.email || 'No email'}</p>
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {business.createdByAdmin ? 'Created by Admin' : 'Self Registered'}
                  </p>
                  <p className="text-xs text-gray-500">Registration Type</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{business.whatsappNumber || 'Not provided'}</p>
                  <p className="text-xs text-gray-500">WhatsApp</p>
                </div>
              </div>
              {business.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{business.email}</p>
                    <p className="text-xs text-gray-500">Business Email</p>
                  </div>
                </div>
              )}
              {business.address && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{business.address}</p>
                    <p className="text-xs text-gray-500">Business Address</p>
                  </div>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{business.website}</p>
                    <p className="text-xs text-gray-500">Website</p>
                  </div>
                </div>
              )}
            </div>
          </div>

{/* Business Stats */}
            <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Business Statistics</h3>
            <div className={`grid grid-cols-2 gap-3 ${business.businessType === 'SERVICES' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Package className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">{business.stats.totalOrders}</p>
                <p className="text-xs text-gray-500">
                  {business.businessType === 'SERVICES' ? 'Scheduled sessions' : isSalonOrServices(business.businessType) ? 'Appointments' : 'Orders'}
                </p>
              </div>
              {business.businessType === 'SERVICES' && typeof business.stats.totalServiceRequests === 'number' && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <MessageSquare className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{business.stats.totalServiceRequests}</p>
                  <p className="text-xs text-gray-500">Service requests</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <UserCheck className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">{business.stats.totalCustomers || 0}</p>
                <p className="text-xs text-gray-500">Customers</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                {isSalonOrServices(business.businessType) ? (
                  <Scissors className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                )}
                <p className="text-xl font-bold text-gray-900">{business.stats.totalProducts || 0}</p>
                <p className="text-xs text-gray-500">
                  {isSalonOrServices(business.businessType)
                    ? 'Services'
                    : business.marketplaceRole === 'originator' && business.stats.supplierProductCount !== undefined
                      ? `Own Products`
                      : 'Products'}
                </p>
                {!isSalonOrServices(business.businessType) && business.marketplaceRole === 'originator' && business.stats.supplierProductCount !== undefined && business.stats.supplierProductCount > 0 && (
                  <p className="text-xs text-teal-600 mt-0.5">
                    +{business.stats.supplierProductCount} from suppliers
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Building2 className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">{business.currency} {business.stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatDate(business.createdAt)}</p>
                  <p className="text-xs text-gray-500">Created</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{business.slug}</p>
                  <p className="text-xs text-gray-500">Store URL</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{business.currency}</p>
                  <p className="text-xs text-gray-500">Currency</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {business.onboardingCompleted ? 'Completed' : 'Pending'}
                  </p>
                  <p className="text-xs text-gray-500">Onboarding</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
          {/* Error Message */}
          {impersonateError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{impersonateError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href={`/superadmin/businesses/${business.id}`}
                className="inline-flex items-center justify-center px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Details
              </Link>
              <button
                onClick={() => window.open(`/${business.slug}`, '_blank')}
                className="inline-flex items-center justify-center px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Store
              </button>
              <button
                onClick={handleImpersonate}
                disabled={!canImpersonate}
                className={`inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors w-full sm:w-auto ${
                  canImpersonate
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Impersonate
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component (Updated with Deactivate option)
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
  onConfirm: () => void;
  onToggleStatus: (business: Business) => void; // Updated
}

function DeleteConfirmationModal({ isOpen, business, onClose, onConfirm, onToggleStatus }: DeleteConfirmationModalProps) {
    if (!isOpen || !business) return null;
  
    const isActive = business.isActive;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isActive ? 'Delete or Deactivate Business' : 'Delete or Activate Business'}
                </h3>
                <p className="text-sm text-gray-600">Choose an action for this business</p>
              </div>
            </div>
  
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                What would you like to do with <strong>"{business.name}"</strong>?
              </p>
              
              <div className="space-y-3">
                {isActive ? (
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Deactivate Business</h4>
                    <p className="text-sm text-yellow-700">
                      Temporarily disable the business. Data is preserved and can be reactivated later.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Activate Business</h4>
                    <p className="text-sm text-green-700">
                      Reactivate the business and make it accessible again. All data will be restored.
                    </p>
                  </div>
                )}
                
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Permanently Delete</h4>
                  <p className="text-sm text-red-700 mb-2">
                    Completely remove the business and all associated data:
                  </p>
                  <ul className="text-sm text-red-600 space-y-1">
                    <li>• All business data and settings</li>
                    <li>• All products and categories</li>
                    <li>• All orders and customer data</li>
                    <li>• All team members and permissions</li>
                  </ul>
                </div>
              </div>
            </div>
  
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                    onToggleStatus(business); // This will now toggle correctly
                  onClose();
                }}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isActive ? (
                  <>
                    <UserX className="w-4 h-4 inline mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 inline mr-2" />
                    Activate
                  </>
                )}
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 inline mr-2" />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

// Deactivate Modal Component
interface DeactivateModalProps {
  isOpen: boolean;
  business: Business | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function DeactivateModal({ isOpen, business, reason, onReasonChange, onClose, onConfirm }: DeactivateModalProps) {
  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserX className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Deactivate Business</h3>
              <p className="text-sm text-gray-600">Temporarily disable this business</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to deactivate <strong>"{business.name}"</strong>?
            </p>
            <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg mb-4">
              <p className="text-sm text-orange-800 mb-2">
                <strong>What happens when you deactivate:</strong>
              </p>
              <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                <li>The business will be hidden from the storefront</li>
                <li>All data will be preserved</li>
                <li>The business can be reactivated later</li>
              </ul>
            </div>
            
            <div>
              <label htmlFor="deactivation-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                id="deactivation-reason"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Enter reason for deactivation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                This reason will be stored for administrative records.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
            >
              <UserX className="w-4 h-4 mr-2" />
              Deactivate Business
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// Incomplete Business Info Modal Component
interface IncompleteInfoModalProps {
  business: Business;
  onClose: () => void;
  getIncompleteReasons: (business: Business) => { missingFields: string[]; suggestions: string[] };
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

// Subscription Change Modal Component
interface SubscriptionChangeModalProps {
  isOpen: boolean;
  business: Business | null;
  onClose: () => void;
  onUpdate: (plan: 'STARTER' | 'PRO' | 'BUSINESS', billingType: 'monthly' | 'yearly' | 'free') => void;
  loading: boolean;
}

function SubscriptionChangeModal({ isOpen, business, onClose, onUpdate, loading }: SubscriptionChangeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'STARTER' | 'PRO' | 'BUSINESS'>('STARTER');
  const [selectedBillingType, setSelectedBillingType] = useState<'monthly' | 'yearly' | 'free'>('free');

  useEffect(() => {
    if (business) {
      setSelectedPlan(business.subscriptionPlan as 'STARTER' | 'PRO' | 'BUSINESS');
      // Default to free since we don't store billing type in business model
      setSelectedBillingType('free');
    }
  }, [business]);

  if (!isOpen || !business) return null;

  const handleConfirm = () => {
    onUpdate(selectedPlan, selectedBillingType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Change Subscription Plan</h2>
              <p className="text-sm text-gray-600">{business.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Plan
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                business.subscriptionPlan === 'BUSINESS'
                  ? 'bg-indigo-100 text-indigo-800'
                  : business.subscriptionPlan === 'PRO'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {business.subscriptionPlan}
              </span>
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Plan *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan('STARTER')}
                disabled={loading}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPlan === 'STARTER'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">Starter</div>
                  {selectedPlan === 'STARTER' && (
                    <Check className="w-5 h-5 text-teal-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">$19/mo or $16/mo yearly</div>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• 50 products</li>
                  <li>• 1 store</li>
                  <li>• Basic analytics</li>
                </ul>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('PRO')}
                disabled={loading}
                className={`p-4 border-2 rounded-lg text-left transition-all relative ${
                  selectedPlan === 'PRO'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded">Popular</span>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">Pro</div>
                  {selectedPlan === 'PRO' && (
                    <Check className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">$39/mo or $32/mo yearly</div>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• Unlimited products</li>
                  <li>• 5 stores</li>
                  <li>• Full analytics</li>
                </ul>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('BUSINESS')}
                disabled={loading}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPlan === 'BUSINESS'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900">Business</div>
                  {selectedPlan === 'BUSINESS' && (
                    <Check className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div className="text-xs text-gray-600">$79/mo or $66/mo yearly</div>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• Everything in Pro</li>
                  <li>• Unlimited stores</li>
                  <li>• Team access (5)</li>
                  <li>• API access</li>
                </ul>
              </button>
            </div>
          </div>

          {/* Billing Type Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Billing Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedBillingType('monthly')}
                disabled={loading}
                className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBillingType === 'monthly'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingType('yearly')}
                disabled={loading}
                className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBillingType === 'yearly'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Yearly (17% off)
              </button>
              <button
                type="button"
                onClick={() => setSelectedBillingType('free')}
                disabled={loading}
                className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBillingType === 'free'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Free
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Update Subscription
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
