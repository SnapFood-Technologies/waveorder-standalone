'use client'

import { useState, useEffect } from 'react'
import {
  Map, Search, Plus, RefreshCw, Trash2, Edit, X, Eye, EyeOff,
  Pin, PinOff, ChevronUp, MessageSquare, AlertCircle, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'

interface RoadmapItem {
  id: string
  title: string
  description: string | null
  status: string
  category: string
  isPublic: boolean
  isPinned: boolean
  upvoteCount: number
  createdAt: string
  updatedAt: string
  _count: { votes: number; comments: number }
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  IDEA: { label: 'Idea', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  THINKING: { label: 'Thinking', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PLANNED: { label: 'Planned', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  COMPLETED: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

const categoryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  STOREFRONT: { label: 'Storefront', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ADMIN: { label: 'Admin', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  PAYMENTS: { label: 'Payments', color: 'text-green-700', bgColor: 'bg-green-100' },
  WHATSAPP_FLOWS: { label: 'WhatsApp Flows', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  INTEGRATIONS: { label: 'Integrations', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  ANALYTICS: { label: 'Analytics', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  PERFORMANCE: { label: 'Performance', color: 'text-red-700', bgColor: 'bg-red-100' },
  MOBILE: { label: 'Mobile', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  OTHER: { label: 'Other', color: 'text-gray-700', bgColor: 'bg-gray-100' },
}

export default function RoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'IDEA',
    category: 'OTHER',
    isPublic: false,
    isPinned: false,
  })

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: statusFilter,
        category: categoryFilter,
        visibility: visibilityFilter,
      })
      const res = await fetch(`/api/superadmin/roadmap?${params}`)
      const data = await res.json()
      if (res.ok) {
        setItems(data.items)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
      } else {
        toast.error('Failed to fetch roadmap items')
      }
    } catch {
      toast.error('Error loading roadmap')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [page, search, statusFilter, categoryFilter, visibilityFilter])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ title: '', description: '', status: 'IDEA', category: 'OTHER', isPublic: false, isPinned: false })
    setShowModal(true)
  }

  const openEditModal = (item: RoadmapItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      status: item.status,
      category: item.category,
      isPublic: item.isPublic,
      isPinned: item.isPinned,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const url = editingItem
        ? `/api/superadmin/roadmap/${editingItem.id}`
        : '/api/superadmin/roadmap'
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success(editingItem ? 'Item updated' : 'Item created')
        setShowModal(false)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to save')
      }
    } catch {
      toast.error('Error saving item')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublic = async (item: RoadmapItem) => {
    try {
      const res = await fetch(`/api/superadmin/roadmap/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !item.isPublic }),
      })
      if (res.ok) {
        toast.success(item.isPublic ? 'Moved to internal' : 'Made public')
        fetchItems()
      }
    } catch {
      toast.error('Error updating visibility')
    }
  }

  const handleTogglePin = async (item: RoadmapItem) => {
    try {
      const res = await fetch(`/api/superadmin/roadmap/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !item.isPinned }),
      })
      if (res.ok) {
        fetchItems()
      }
    } catch {
      toast.error('Error updating pin')
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      const res = await fetch(`/api/superadmin/roadmap/${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Item deleted')
        setShowDeleteConfirm(null)
        fetchItems()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Error deleting item')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roadmap</h1>
          <p className="text-gray-500 mt-1">Manage features and publish to public roadmap</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/roadmap"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center text-sm"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            View Public
          </a>
          <button
            onClick={fetchItems}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search roadmap..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key.toLowerCase()}>{label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([key, { label }]) => (
              <option key={key} value={key.toLowerCase()}>{label}</option>
            ))}
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="internal">Internal</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['IN_PROGRESS', 'PLANNED', 'THINKING', 'IDEA'] as const).map(status => {
          const count = items.filter(i => i.status === status).length
          const config = statusConfig[status]
          return (
            <div key={status} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{config.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Items List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading roadmap...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No roadmap items</h3>
            <p className="text-gray-500 mt-1">Add your first feature or idea to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${item.isPinned ? 'bg-amber-50/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      )}
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[item.status]?.bgColor || 'bg-gray-100'} ${statusConfig[item.status]?.color || 'text-gray-700'}`}>
                        {statusConfig[item.status]?.label || item.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryConfig[item.category]?.bgColor || 'bg-gray-100'} ${categoryConfig[item.category]?.color || 'text-gray-700'}`}>
                        {categoryConfig[item.category]?.label || item.category}
                      </span>
                      {item.isPublic ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <Eye className="w-3 h-3 mr-1" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Internal
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <ChevronUp className="w-3.5 h-3.5" />
                        {item.upvoteCount} votes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {item._count.comments} comments
                      </span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePin(item)}
                      className={`p-1.5 rounded-lg transition-colors ${item.isPinned ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title={item.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      {item.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleTogglePublic(item)}
                      className={`p-1.5 rounded-lg transition-colors ${item.isPublic ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title={item.isPublic ? 'Make internal' : 'Make public'}
                    >
                      {item.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} items
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Item' : 'New Roadmap Item'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Feature title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the feature..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  >
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  >
                    {Object.entries(categoryConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Show on public roadmap</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">Pin to top</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Item</h3>
                <p className="text-sm text-gray-500">This will also delete all votes and comments</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this roadmap item?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
