// src/app/admin/stores/[businessId]/packaging/types/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Package, Plus, Edit, Trash2, X, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PackagingType {
  id: string
  name: string
  description: string | null
  unit: string
  isActive: boolean
  createdAt: string
}

export default function PackagingTypesPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [types, setTypes] = useState<PackagingType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'piece',
    isActive: true
  })

  useEffect(() => {
    fetchTypes()
  }, [businessId])

  const fetchTypes = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/packaging/types`)
      if (res.ok) {
        const data = await res.json()
        setTypes(data.packagingTypes || [])
      }
    } catch (error) {
      console.error('Error fetching types:', error)
      toast.error('Failed to load packaging types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId
        ? `/api/admin/stores/${businessId}/packaging/types/${editingId}`
        : `/api/admin/stores/${businessId}/packaging/types`
      
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success(editingId ? 'Packaging type updated' : 'Packaging type created')
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: '', description: '', unit: 'piece', isActive: true })
        fetchTypes()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to save packaging type')
      }
    } catch (error) {
      console.error('Error saving type:', error)
      toast.error('Failed to save packaging type')
    }
  }

  const handleEdit = (type: PackagingType) => {
    setEditingId(type.id)
    setFormData({
      name: type.name,
      description: type.description || '',
      unit: type.unit,
      isActive: type.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this packaging type? It will be deactivated if used in orders.')) return

    try {
      const res = await fetch(`/api/admin/stores/${businessId}/packaging/types/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Packaging type deleted')
        fetchTypes()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to delete packaging type')
      }
    } catch (error) {
      console.error('Error deleting type:', error)
      toast.error('Failed to delete packaging type')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-semibold text-gray-900">Packaging Types</h1>
          </div>
          <p className="text-gray-600 mt-1">Manage your packaging material types</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({ name: '', description: '', unit: 'piece', isActive: true })
            }}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Packaging Type' : 'New Packaging Type'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Small Gift Box"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="piece">Piece</option>
                <option value="roll">Roll</option>
                <option value="meter">Meter</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({ name: '', description: '', unit: 'piece', isActive: true })
                }}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {types.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No packaging types yet. Create your first one!
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {types.map((type) => (
                <tr key={type.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{type.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{type.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{type.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEdit(type)}
                      className="text-teal-600 hover:text-teal-700 mr-3 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
