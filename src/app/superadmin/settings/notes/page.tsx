'use client'

import { useState, useEffect } from 'react'
import {
  StickyNote, Search, Plus, Filter, Calendar, Clock, CheckCircle,
  Circle, AlertCircle, Trash2, Edit, X, RefreshCw, Tag,
  ExternalLink, Lock
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Note {
  id: string
  title: string
  content: string | null
  type: string
  category: string
  dueDate: string | null
  isDone: boolean
  createdBy: { id: string; name: string | null; email: string }
  createdAt: string
  updatedAt: string
}

const typeConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Lock }> = {
  INTERNAL: { label: 'Internal', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Lock },
  EXTERNAL: { label: 'External', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: ExternalLink },
}

const categoryConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  GENERAL: { label: 'General', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  TASK: { label: 'Task', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IDEA: { label: 'Idea', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  BUG: { label: 'Bug', color: 'text-red-700', bgColor: 'bg-red-100' },
  FOLLOWUP: { label: 'Follow-up', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  MEETING: { label: 'Meeting', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  DECISION: { label: 'Decision', color: 'text-green-700', bgColor: 'bg-green-100' },
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INTERNAL',
    category: 'GENERAL',
    dueDate: '',
  })

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        type: typeFilter,
        category: categoryFilter,
        status: statusFilter,
      })
      const res = await fetch(`/api/superadmin/notes?${params}`)
      const data = await res.json()
      if (res.ok) {
        setNotes(data.notes)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
      } else {
        toast.error('Failed to fetch notes')
      }
    } catch {
      toast.error('Error loading notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [page, search, typeFilter, categoryFilter, statusFilter])

  const openCreateModal = () => {
    setEditingNote(null)
    setFormData({ title: '', content: '', type: 'INTERNAL', category: 'GENERAL', dueDate: '' })
    setShowModal(true)
  }

  const openEditModal = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content || '',
      type: note.type,
      category: note.category,
      dueDate: note.dueDate ? note.dueDate.split('T')[0] : '',
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
      const url = editingNote
        ? `/api/superadmin/notes/${editingNote.id}`
        : '/api/superadmin/notes'
      const res = await fetch(url, {
        method: editingNote ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
        }),
      })
      if (res.ok) {
        toast.success(editingNote ? 'Note updated' : 'Note created')
        setShowModal(false)
        fetchNotes()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to save note')
      }
    } catch {
      toast.error('Error saving note')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleDone = async (note: Note) => {
    try {
      const res = await fetch(`/api/superadmin/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !note.isDone }),
      })
      if (res.ok) {
        fetchNotes()
      }
    } catch {
      toast.error('Error updating note')
    }
  }

  const handleDelete = async (noteId: string) => {
    try {
      const res = await fetch(`/api/superadmin/notes/${noteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Note deleted')
        setShowDeleteConfirm(null)
        fetchNotes()
      } else {
        toast.error('Failed to delete note')
      }
    } catch {
      toast.error('Error deleting note')
    }
  }

  const isOverdue = (dueDate: string | null, isDone: boolean) => {
    if (!dueDate || isDone) return false
    return new Date(dueDate) < new Date()
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return formatDate(date)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-500 mt-1">Internal and external notes with due dates</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchNotes}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
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
                placeholder="Search notes..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Types</option>
            <option value="internal">Internal</option>
            <option value="external">External</option>
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
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="p-8 text-center">
            <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notes found</h3>
            <p className="text-gray-500 mt-1">Create your first note to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notes.map((note) => {
              const TypeIcon = typeConfig[note.type]?.icon || Lock
              return (
                <div
                  key={note.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${note.isDone ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Done toggle */}
                    <button
                      onClick={() => handleToggleDone(note)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {note.isDone ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-teal-500" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-medium text-gray-900 ${note.isDone ? 'line-through' : ''}`}>
                          {note.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig[note.type]?.bgColor || 'bg-gray-100'} ${typeConfig[note.type]?.color || 'text-gray-700'}`}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig[note.type]?.label || note.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryConfig[note.category]?.bgColor || 'bg-gray-100'} ${categoryConfig[note.category]?.color || 'text-gray-700'}`}>
                          {categoryConfig[note.category]?.label || note.category}
                        </span>
                      </div>

                      {note.content && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.content}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{note.createdBy.name || note.createdBy.email}</span>
                        <span>{formatRelativeTime(note.createdAt)}</span>
                        {note.dueDate && (
                          <span className={`flex items-center ${isOverdue(note.dueDate, note.isDone) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {isOverdue(note.dueDate, note.isDone) && <AlertCircle className="w-3 h-3 mr-1" />}
                            <Calendar className="w-3 h-3 mr-1" />
                            Due {formatDate(note.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(note)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(note.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} notes
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
                {editingNote ? 'Edit Note' : 'New Note'}
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
                  placeholder="Note title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  placeholder="Write your note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                  >
                    {Object.entries(typeConfig).map(([key, { label }]) => (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
                />
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
                  {saving ? 'Saving...' : editingNote ? 'Save Changes' : 'Create Note'}
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Note</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this note?</p>
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
