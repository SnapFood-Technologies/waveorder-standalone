'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Zap,
  Upload,
  Workflow
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getFlowTemplates } from '@/lib/whatsapp-flow-templates'
import { VisualFlowBuilder } from './VisualFlowBuilder'

interface Flow {
  id: string
  name: string
  type: string
  isActive: boolean
  priority: number
  trigger: Record<string, unknown>
  steps: unknown[]
  triggerCount: number
  lastTriggeredAt: string | null
  editorType?: string
  canvasData?: { nodes: unknown[]; edges: unknown[] } | null
}

interface WhatsAppFlowsListProps {
  businessId: string
}

const TYPE_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  away: 'Away',
  keyword: 'Keyword',
  button_reply: 'Button'
}

const STEP_TYPES = [
  { value: 'send_text', label: 'Send Text' },
  { value: 'send_image', label: 'Send Image' },
  { value: 'send_url', label: 'Send URL' },
  { value: 'send_location', label: 'Send Location' },
  { value: 'notify_team', label: 'Notify Team' }
]

export function WhatsAppFlowsList({ businessId }: WhatsAppFlowsListProps) {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null)
  const [flowToDelete, setFlowToDelete] = useState<Flow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [business, setBusiness] = useState<{ name: string; slug: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'keyword' as string,
    trigger: { type: 'keyword' as string, keywords: [] as string[], buttonPayload: '', businessHoursOnly: false, outsideHoursOnly: false },
    steps: [] as Array<{ type: string; body?: string; mediaUrl?: string; url?: string; name?: string; address?: string; latitude?: number; longitude?: number; message?: string }>
  })
  const [saving, setSaving] = useState(false)
  const [uploadingStepIndex, setUploadingStepIndex] = useState<number | null>(null)
  const [useVisualEditor, setUseVisualEditor] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const storeUrl = business ? `${baseUrl}/${business.slug}` : ''

  const fetchFlows = async () => {
    try {
      setLoading(true)
      const [flowsRes, bizRes] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}/whatsapp-flows/flows`),
        fetch(`/api/admin/stores/${businessId}`)
      ])
      if (flowsRes.ok) {
        const data = await flowsRes.json()
        setFlows(data.flows || [])
      }
      if (bizRes.ok) {
        const data = await bizRes.json()
        setBusiness({ name: data.business?.name || 'Store', slug: data.business?.slug || '' })
      }
    } catch {
      toast.error('Failed to load flows')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlows()
  }, [businessId])

  const openCreate = (templateId?: string, visual = false) => {
    setUseVisualEditor(visual)
    if (templateId && business && !visual) {
      const templates = getFlowTemplates(storeUrl, business.name)
      const t = templates.find((x) => x.id === templateId)
      if (t) {
        setFormData({
          name: t.name,
          type: t.type,
          trigger: t.trigger as typeof formData.trigger,
          steps: t.steps as typeof formData.steps
        })
      } else {
        resetForm()
      }
    } else {
      resetForm()
    }
    setEditingFlow(null)
    setShowEditor(true)
  }

  const openEdit = (flow: Flow) => {
    setUseVisualEditor(flow.editorType === 'visual')
    setFormData({
      name: flow.name,
      type: flow.type,
      trigger: (flow.trigger as typeof formData.trigger) || { type: 'keyword', keywords: [], buttonPayload: '', businessHoursOnly: false, outsideHoursOnly: false },
      steps: (flow.steps as typeof formData.steps) || []
    })
    setEditingFlow(flow)
    setShowEditor(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: [], buttonPayload: '', businessHoursOnly: false, outsideHoursOnly: false },
      steps: []
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Flow name is required')
      return
    }
    try {
      setSaving(true)
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        trigger: formData.trigger,
        steps: formData.steps
      }
      if (editingFlow) {
        const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/flows/${editingFlow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error((await res.json()).message)
        toast.success('Flow updated')
      } else {
        const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/flows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error((await res.json()).message)
        toast.success('Flow created')
      }
      setShowEditor(false)
      setUseVisualEditor(false)
      resetForm()
      fetchFlows()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleVisualSave = async (payload: {
    name: string
    type: string
    trigger: object
    steps: object[]
    editorType: 'visual'
    canvasData: object
  }) => {
    try {
      setSaving(true)
      if (editingFlow) {
        const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/flows/${editingFlow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error((await res.json()).message)
        toast.success('Flow updated')
      } else {
        const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/flows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error((await res.json()).message)
        toast.success('Flow created')
      }
      setShowEditor(false)
      setUseVisualEditor(false)
      resetForm()
      fetchFlows()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const closeEditor = () => {
    setShowEditor(false)
    setUseVisualEditor(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (!flowToDelete) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/flows/${flowToDelete.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Flow deleted')
      setFlowToDelete(null)
      fetchFlows()
    } catch {
      toast.error('Failed to delete flow')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggle = async (flow: Flow) => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/flows/${flow.id}/toggle`, {
        method: 'PATCH'
      })
      if (!res.ok) throw new Error('Failed to toggle')
      toast.success(flow.isActive ? 'Flow deactivated' : 'Flow activated')
      fetchFlows()
    } catch {
      toast.error('Failed to toggle flow')
    }
  }

  const handleImageUpload = async (stepIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPEG, etc.)')
      return
    }
    try {
      setUploadingStepIndex(stepIndex)
      const form = new FormData()
      form.append('image', file)
      form.append('folder', 'flows')
      const res = await fetch(`/api/admin/stores/${businessId}/upload`, {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload failed')
      if (data.imageUrl || data.publicUrl) {
        updateStep(stepIndex, { mediaUrl: data.imageUrl || data.publicUrl })
        toast.success('Image uploaded')
      } else {
        throw new Error('No URL returned')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingStepIndex(null)
    }
  }

  const addStep = (type: string) => {
    const defaultUrl = type === 'send_url' ? storeUrl : undefined
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { type, body: type === 'send_text' ? '' : undefined, url: defaultUrl }]
    }))
  }

  const updateStep = (index: number, updates: Partial<(typeof formData.steps)[0]>) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, ...updates } : s))
    }))
  }

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }))
  }

  const templates = business ? getFlowTemplates(storeUrl, business.name) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Flows</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Create automated welcome, away, and keyword-triggered flows
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Flow
          </button>
          <button
            onClick={() => openCreate(undefined, true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors w-full sm:w-auto"
          >
            <Workflow className="w-4 h-4 mr-2" />
            Visual Editor
          </button>
          {templates.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openCreate(t.id)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : flows.length === 0 ? (
          <div className="p-12 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No flows yet</h3>
            <p className="text-gray-600 mb-4">Create your first flow or use a template</p>
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Flow
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Triggered</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{flow.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{TYPE_LABELS[flow.type] || flow.type}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggle(flow)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        flow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {flow.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {flow.triggerCount ?? 0}×
                    {flow.lastTriggeredAt && (
                      <span className="block text-xs text-gray-400">
                        Last: {new Date(flow.lastTriggeredAt).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openEdit(flow)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setFlowToDelete(flow)}
                      className="text-gray-400 hover:text-red-600 p-1 ml-1"
                      title="Delete"
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

      {/* Flow Editor Modal */}
      {showEditor && useVisualEditor ? (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Visual Flow Builder</h2>
            <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600 p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 h-full">
            <VisualFlowBuilder
              initialTrigger={
                editingFlow
                  ? (editingFlow.trigger as { type: string; keywords?: string[]; buttonPayload?: string; businessHoursOnly?: boolean; outsideHoursOnly?: boolean })
                  : { type: 'first_message' }
              }
              initialSteps={editingFlow ? (editingFlow.steps as object[]) : []}
              initialCanvas={editingFlow?.editorType === 'visual' && editingFlow.canvasData ? (editingFlow.canvasData as { nodes: unknown[]; edges: unknown[] }) : null}
              flowName={editingFlow?.name || formData.name}
              storeUrl={storeUrl}
              businessId={businessId}
              onSave={handleVisualSave}
              onCancel={closeEditor}
              saving={saving}
            />
          </div>
        </div>
      ) : showEditor ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">{editingFlow ? 'Edit Flow' : 'Create Flow'}</h2>
              <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flow Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Welcome Flow"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                <select
                  value={formData.trigger.type}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    trigger: { ...prev.trigger, type: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="first_message">First Message</option>
                  <option value="keyword">Keyword</option>
                  <option value="button_click">Button Click</option>
                  <option value="any_message">Any Message</option>
                </select>
              </div>
              {formData.trigger.type === 'keyword' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={(formData.trigger.keywords || []).join(', ')}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      trigger: {
                        ...prev.trigger,
                        keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                      }
                    }))}
                    placeholder="menu, catalog, price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
              {formData.trigger.type === 'button_click' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Payload ID</label>
                  <input
                    type="text"
                    value={formData.trigger.buttonPayload || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      trigger: { ...prev.trigger, buttonPayload: e.target.value }
                    }))}
                    placeholder="order"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.trigger.businessHoursOnly || false}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      trigger: { ...prev.trigger, businessHoursOnly: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600"
                  />
                  <span className="text-sm">During business hours only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.trigger.outsideHoursOnly || false}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      trigger: { ...prev.trigger, outsideHoursOnly: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600"
                  />
                  <span className="text-sm">Outside business hours only</span>
                </label>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Steps</label>
                  <div className="flex gap-1 flex-wrap">
                    {STEP_TYPES.map((st) => (
                      <button
                        key={st.value}
                        onClick={() => addStep(st.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        + {st.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {formData.steps.map((step, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{STEP_TYPES.find((s) => s.value === step.type)?.label || step.type}</span>
                        <button onClick={() => removeStep(idx)} className="text-red-600 hover:text-red-700 text-sm">Remove</button>
                      </div>
                      {(step.type === 'send_text' || step.type === 'send_image') && (
                        <textarea
                          value={step.body || ''}
                          onChange={(e) => updateStep(idx, { body: e.target.value })}
                          placeholder="Message text"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      )}
                      {step.type === 'send_image' && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={step.mediaUrl || ''}
                            onChange={(e) => updateStep(idx, { mediaUrl: e.target.value })}
                            placeholder="Image URL or upload"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 cursor-pointer whitespace-nowrap">
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) handleImageUpload(idx, f)
                                e.target.value = ''
                              }}
                              disabled={uploadingStepIndex === idx}
                            />
                            {uploadingStepIndex === idx ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Upload className="w-4 h-4 mr-1" />
                            )}
                            Upload
                          </label>
                        </div>
                      )}
                      {(step.type === 'send_url' || step.type === 'send_location') && (
                        <input
                          type="text"
                          value={step.url || (step.type === 'send_url' ? storeUrl : '')}
                          onChange={(e) => updateStep(idx, { url: e.target.value })}
                          placeholder="URL or address"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      )}
                      {step.type === 'send_location' && (
                        <>
                          <input
                            type="text"
                            value={step.name || ''}
                            onChange={(e) => updateStep(idx, { name: e.target.value })}
                            placeholder="Place name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={step.address || ''}
                            onChange={(e) => updateStep(idx, { address: e.target.value })}
                            placeholder="Full address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </>
                      )}
                      {step.type === 'notify_team' && (
                        <input
                          type="text"
                          value={step.message || ''}
                          onChange={(e) => updateStep(idx, { message: e.target.value })}
                          placeholder="Notification message"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={closeEditor}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Flow'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {flowToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Flow</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete <strong>{flowToDelete.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setFlowToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
