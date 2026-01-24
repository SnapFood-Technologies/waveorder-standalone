'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Menu, Plus, Pencil, Trash2, GripVertical, ExternalLink, X, Loader2, AlertTriangle, Search } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'

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
  const businessId = params.businessId as string

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [availableGroups, setAvailableGroups] = useState<AvailableEntity[]>([])
  const [availableCollections, setAvailableCollections] = useState<AvailableEntity[]>([])
  const [availableCategories, setAvailableCategories] = useState<AvailableEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
      toast.error('Failed to load menu items')
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

    try {
      await fetch(`/api/admin/stores/${businessId}/custom-menu/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: items.map(item => item.id) })
      })
      toast.success('Menu order updated')
    } catch (error) {
      console.error('Error reordering menu items:', error)
      toast.error('Failed to reorder menu items')
      fetchMenuItems()
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
    setSearchQuery('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setSearchQuery('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingItem) {
        const response = await fetch(`/api/admin/stores/${businessId}/custom-menu/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!response.ok) throw new Error('Failed to update menu item')
        
        toast.success('Menu item updated successfully')
        await fetchMenuItems()
        closeModal()
      } else {
        const response = await fetch(`/api/admin/stores/${businessId}/custom-menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!response.ok) throw new Error('Failed to create menu item')
        
        toast.success('Menu item created successfully')
        await fetchMenuItems()
        closeModal()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save menu item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/custom-menu/${itemId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete menu item')
      
      toast.success('Menu item deleted successfully')
      fetchMenuItems()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete menu item')
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
    let options: AvailableEntity[] = []
    switch (formData.type) {
      case 'group': options = availableGroups; break
      case 'collection': options = availableCollections; break
      case 'category': options = availableCategories; break
      default: return []
    }
    
    if (!searchQuery) return options
    
    return options.filter(option => 
      option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (option.nameAl && option.nameAl.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!featureEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center max-w-2xl mx-auto mt-8">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Menu Feature Not Enabled</h3>
        <p className="text-gray-600">
          This feature is not enabled for your business. Contact your administrator to enable it.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Menu</h1>
            <p className="text-sm text-gray-600 mt-1">
              Configure custom menu items for your storefront
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Menu Items List */}
      {menuItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Menu className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No menu items yet</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Create your first custom menu item to customize your storefront navigation
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
                className="bg-white rounded-lg border border-gray-200"
              >
                <div className="divide-y divide-gray-200">
                  {menuItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                            snapshot.isDragging ? 'bg-gray-50 shadow-lg' : ''
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">{item.name}</span>
                              {item.nameAl && business?.language === 'sq' && (
                                <span className="text-sm text-gray-500 truncate">({item.nameAl})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                                {getTypeLabel(item.type)}
                              </span>
                              {item.type === 'link' && item.url && (
                                <span className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{item.url}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
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
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={submitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Item Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, targetId: '', name: '', nameAl: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                  disabled={!!editingItem || submitting}
                >
                  <option value="category">Category</option>
                  <option value="collection">Collection</option>
                  <option value="group">Group</option>
                  <option value="link">Custom Link</option>
                </select>
              </div>

              {/* Entity Selection with Search or Custom Fields */}
              {formData.type !== 'link' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select {getTypeLabel(formData.type)}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${getTypeLabel(formData.type).toLowerCase()}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                      disabled={!!editingItem || submitting}
                    />
                  </div>
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {getEntityOptions().length > 0 ? (
                      getEntityOptions().map((entity) => (
                        <button
                          key={entity.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, targetId: entity.id })
                            setSearchQuery('')
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors ${
                            formData.targetId === entity.id ? 'bg-teal-50 font-medium' : ''
                          }`}
                          disabled={!!editingItem || submitting}
                        >
                          {entity.name}
                          {entity.nameAl && business?.language === 'sq' && (
                            <span className="text-sm text-gray-500 ml-2">({entity.nameAl})</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-6 text-center text-sm text-gray-500">
                        {searchQuery ? 'No results found' : `No ${getTypeLabel(formData.type).toLowerCase()}s available`}
                      </div>
                    )}
                  </div>
                  {formData.targetId && (
                    <p className="text-xs text-teal-600 mt-2 flex items-center gap-1">
                      <span>✓</span> Selected: {getEntityOptions().find(e => e.id === formData.targetId)?.name}
                    </p>
                  )}
                  {!formData.targetId && (
                    <p className="text-xs text-gray-500 mt-2">
                      Names will auto-populate from the selected {formData.type}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name (English)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                      required
                      disabled={submitting}
                    />
                  </div>

                  {business?.language === 'sq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name (Albanian) <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nameAl}
                        onChange={(e) => setFormData({ ...formData, nameAl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        disabled={submitting}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
                      placeholder="https://example.com"
                      required
                      disabled={submitting}
                    />
                  </div>
                </>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (formData.type !== 'link' && !formData.targetId)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      {editingItem ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingItem ? 'Update' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
