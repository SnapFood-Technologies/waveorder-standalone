'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Menu, Plus, Pencil, Trash2, GripVertical, ExternalLink, X } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface MenuItem {
  id: string
  type: 'group' | 'collection' | 'category' | 'link'
  name: string
  nameAl?: string | null
  targetId?: string
  url?: string
  sortOrder: number
  isActive: boolean
  target?: {
    id: string
    name: string
    nameAl?: string | null
  }
}

interface AvailableEntity {
  id: string
  name: string
  nameAl?: string | null
}

export default function CustomMenuPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [availableGroups, setAvailableGroups] = useState<AvailableEntity[]>([])
  const [availableCollections, setAvailableCollections] = useState<AvailableEntity[]>([])
  const [availableCategories, setAvailableCategories] = useState<AvailableEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    type: 'category' as 'group' | 'collection' | 'category' | 'link',
    targetId: '',
    name: '',
    nameAl: '',
    url: ''
  })
  const [business, setBusiness] = useState<{ language?: string } | null>(null)
  const [featureEnabled, setFeatureEnabled] = useState(true)

  useEffect(() => {
    fetchMenuItems()
    fetchBusiness()
  }, [businessId])

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness(data.business)
        setFeatureEnabled(data.business?.customMenuEnabled || false)
      }
    } catch (error) {
      console.error('Error fetching business:', error)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/custom-menu`)
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data.menuItems || [])
        setAvailableGroups(data.availableGroups || [])
        setAvailableCollections(data.availableCollections || [])
        setAvailableCategories(data.availableCategories || [])
      }
    } catch (error) {
      console.error('Error fetching menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(menuItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setMenuItems(items)

    // Save new order
    try {
      await fetch(`/api/admin/stores/${businessId}/custom-menu/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: items.map(item => item.id) })
      })
    } catch (error) {
      console.error('Error reordering menu items:', error)
      fetchMenuItems() // Revert on error
    }
  }

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        type: item.type,
        targetId: item.targetId || '',
        name: item.name,
        nameAl: item.nameAl || '',
        url: item.url || ''
      })
    } else {
      setEditingItem(null)
      setFormData({
        type: 'category',
        targetId: '',
        name: '',
        nameAl: '',
        url: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingItem) {
        // Update
        const response = await fetch(`/api/admin/stores/${businessId}/custom-menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          fetchMenuItems()
          closeModal()
        }
      } else {
        // Create
        const response = await fetch(`/api/admin/stores/${businessId}/custom-menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (response.ok) {
          fetchMenuItems()
          closeModal()
        }
      }
    } catch (error) {
      console.error('Error saving menu item:', error)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/custom-menu/${itemId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchMenuItems()
      }
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'group': return 'Group'
      case 'collection': return 'Collection'
      case 'category': return 'Category'
      case 'link': return 'Custom Link'
      default: return type
    }
  }

  const getEntityOptions = () => {
    switch (formData.type) {
      case 'group': return availableGroups
      case 'collection': return availableCollections
      case 'category': return availableCategories
      default: return []
    }
  }

  if (!featureEnabled) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Custom Menu Feature Not Enabled</h2>
          <p className="text-yellow-700">
            This feature is not enabled for your business. Contact your administrator to enable it.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Menu</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure custom menu items for your storefront
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </button>
      </div>

      {/* Menu Items List */}
      {menuItems.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Menu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first custom menu item to get started
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="menu-items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {menuItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            {item.nameAl && business?.language === 'sq' && (
                              <span className="text-sm text-gray-500">({item.nameAl})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {getTypeLabel(item.type)}
                            </span>
                            {item.type === 'link' && item.url && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {item.url}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(item)}
                            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, targetId: '', name: '', nameAl: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={!!editingItem}
                >
                  <option value="category">Category</option>
                  <option value="collection">Collection</option>
                  <option value="group">Group</option>
                  <option value="link">Custom Link</option>
                </select>
              </div>

              {/* Entity Selection or Custom Fields */}
              {formData.type !== 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select {getTypeLabel(formData.type)}
                  </label>
                  <select
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={!!editingItem}
                  >
                    <option value="">Choose...</option>
                    {getEntityOptions().map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Names will auto-populate from the selected {formData.type}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name (English)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  {business?.language === 'sq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name (Albanian) <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nameAl}
                        onChange={(e) => setFormData({ ...formData, nameAl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                </>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
