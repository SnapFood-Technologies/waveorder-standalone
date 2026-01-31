// components/superadmin/SuperAdminUsers.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Search, 
  Mail, 
  Building2, 
  Shield,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  ExternalLink
} from 'lucide-react'
import { AuthMethodIcon } from './AuthMethodIcon'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  role: string
  authMethod: 'google' | 'email' | 'magic-link' | 'oauth'
  createdAt: string
  businesses: {
    businessId: string
    businessName: string
    role: string
  }[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export function SuperAdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [debouncedSearchQuery, roleFilter, currentPage])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        // role: roleFilter, // Commented out - role filter removed
        role: 'all', // Always use 'all' since role filter is disabled
        page: currentPage.toString(),
        limit: pagination.limit.toString()
      })

      const response = await fetch(`/api/superadmin/users?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800'
      case 'BUSINESS_OWNER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600 mt-1">Manage all platform users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Role filter - commented out */}
            {/* <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="BUSINESS_OWNER">Business Owner</option>
            </select> */}

            <div className="text-sm text-gray-600">
              {pagination.total} users
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    {/* Role column - commented out */}
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Businesses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-700 font-medium">
                              {user.name[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500">{user.email}</span>
                              <AuthMethodIcon authMethod={user.authMethod} />
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Role column - commented out */}
                      {/* <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Business Owner'}
                        </span>
                      </td> */}
                      <td className="px-6 py-4">
                        {user.businesses.length > 0 ? (
                          <div className="space-y-1">
                            {user.businesses.length > 1 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mb-1">
                                Multi-store ({user.businesses.length})
                              </span>
                            )}
                            {user.businesses.slice(0, 2).map((business) => (
                              <div key={business.businessId} className="flex items-center text-sm">
                                <Building2 className="w-3 h-3 mr-2 text-gray-400" />
                                <span className="text-gray-900">{business.businessName}</span>
                                <span className="ml-2 text-xs text-gray-500">({business.role})</span>
                              </div>
                            ))}
                            {user.businesses.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{user.businesses.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No businesses</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/superadmin/users/${user.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            View Account
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} users
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
    </div>
  )
}