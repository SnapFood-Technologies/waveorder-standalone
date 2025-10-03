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
} from 'lucide-react';
import { AuthMethodIcon } from './AuthMethodIcon';
import Link from 'next/link'


interface Business {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isActive: boolean;
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
  };
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
  HEALTH_BEAUTY: Scissors,
  JEWELRY: Gem,
  FLORIST: Flower2,
  OTHER: MoreHorizontal
};

export function SuperAdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuickViewModal, setShowQuickViewModal] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);
  const [businessToView, setBusinessToView] = useState<Business | null>(null);
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
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
  }, [debouncedSearchQuery, statusFilter, planFilter, currentPage]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        status: statusFilter,
        plan: planFilter,
        page: currentPage.toString(),
        limit: pagination.limit.toString()
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

  const handleImpersonate = (businessId: string) => {
    window.open(`/admin/stores/${businessId}/dashboard?impersonate=true`, '_blank');
  };


  const openDeleteModal = (business: Business) => {
    setBusinessToDelete(business);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setBusinessToDelete(null);
    setShowDeleteModal(false);
  };

  const openQuickViewModal = (business: Business) => {
    setBusinessToView(business);
    setShowQuickViewModal(true);
  };

  const closeQuickViewModal = () => {
    setBusinessToView(null);
    setShowQuickViewModal(false);
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

  const handleToggleBusinessStatus = async (business: Business) => {
    const newStatus = !business.isActive; // Toggle the status
    
    try {
      const response = await fetch(`/api/superadmin/businesses/${business.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
  
      if (!response.ok) {
        throw new Error('Failed to update business status');
      }
  
      fetchBusinesses();
      
      // Show success message
      setSuccessMessage({
        title: `Business ${newStatus ? 'Activated' : 'Deactivated'} Successfully`,
        message: `"${business.name}" has been ${newStatus ? 'activated' : 'deactivated'} successfully.`
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error updating business status:', error);
      setError('Failed to update business status');
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
          className="w-full h-full object-cover rounded-lg"
        />
      );
    }
    
    const IconComponent = businessTypeIcons[business.businessType as keyof typeof businessTypeIcons] || Building2;
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
  </select>
  
  <select
    value={planFilter}
    onChange={(e) => setPlanFilter(e.target.value)}
    className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
  >
    <option value="all">All Plans</option>
    <option value="free">Free</option>
    <option value="pro">Pro</option>
  </select>

  <div className="text-sm text-gray-600 text-center sm:text-left">
    {pagination.total} businesses
  </div>
</div>
        </div>
      </div>

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
                            <div className="text-sm font-medium text-gray-900">{business.name}</div>
                            <div className="text-sm text-gray-500 capitalize">
                              {business.businessType.toLowerCase().replace('_', ' ')}
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          business.subscriptionPlan === 'PRO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {business.subscriptionPlan}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          business.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {business.isActive ? 'Active' : 'Inactive'}
                        </span>
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
                            onClick={() => handleImpersonate(business.id)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Impersonate"
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
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} businesses
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
          className="w-full h-full object-cover rounded-lg"
        />
      );
    }
    
    const IconComponent = businessTypeIcons[business.businessType as keyof typeof businessTypeIcons] || Building2;
    return <IconComponent className="w-8 h-8 text-gray-600" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {getBusinessIcon(business)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{business.name}</h2>
              <p className="text-sm text-gray-600 capitalize">
                {business.businessType.toLowerCase().replace('_', ' ')}
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
          <div className="flex items-center gap-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              business.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {business.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              business.subscriptionPlan === 'PRO'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {business.subscriptionPlan} Plan
            </span>
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
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <Package className="w-5 h-5 text-gray-400 mx-auto mb-1" />
      <p className="text-xl font-bold text-gray-900">{business.stats.totalOrders}</p>
      <p className="text-xs text-gray-500">Orders</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <UserCheck className="w-5 h-5 text-gray-400 mx-auto mb-1" />
      <p className="text-xl font-bold text-gray-900">{business.stats.totalCustomers || 0}</p>
      <p className="text-xs text-gray-500">Customers</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <ShoppingBag className="w-5 h-5 text-gray-400 mx-auto mb-1" />
      <p className="text-xl font-bold text-gray-900">{business.stats.totalProducts || 0}</p>
      <p className="text-xs text-gray-500">Products</p>
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
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                onClick={() => window.open(`/${business.slug}`, '_blank')}
                className="inline-flex items-center px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Store
              </button>
              <button
                onClick={() => window.open(`/admin/stores/${business.id}/dashboard?impersonate=true`, '_blank')}
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Impersonate
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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