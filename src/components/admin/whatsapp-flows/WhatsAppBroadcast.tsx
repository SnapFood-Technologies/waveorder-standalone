'use client'

import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Plus,
  Loader2,
  Users,
  FileText,
  Megaphone,
  Upload,
  Send,
  RefreshCw,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'

interface WhatsAppBroadcastProps {
  businessId: string
}

type Tab = 'contacts' | 'templates' | 'campaigns'

interface Contact {
  id: string
  phone: string
  name: string | null
  tags: string[]
  optedOut: boolean
  totalOrders: number
  lastOrderAt: string | null
  source: string
}

interface Template {
  id: string
  name: string
  contentSid: string
  status: string
  bodyPreview: string | null
  variableCount: number
}

interface Campaign {
  id: string
  name: string
  status: string
  totalRecipients: number
  delivered: number
  failed: number
  estimatedCost: number
  template: { name: string }
}

/** Activity label by business type (Orders / Bookings / Requests) */
function getActivityLabel(businessType?: string | null): string {
  const t = businessType?.toUpperCase()
  if (t === 'SALON') return 'Bookings'
  if (t === 'SERVICES') return 'Requests'
  return 'Orders'
}

const CSV_EXAMPLE = 'phone,name\n+1234567890,John Doe\n9876543210,Jane Smith'

export function WhatsAppBroadcast({ businessId }: WhatsAppBroadcastProps) {
  const [tab, setTab] = useState<Tab>('contacts')
  const [business, setBusiness] = useState<{ businessType?: string | null } | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [optedOutCount, setOptedOutCount] = useState(0)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [templateForm, setTemplateForm] = useState({ name: '', contentSid: '', bodyPreview: '', variableCount: 0 })
  const [templateSaving, setTemplateSaving] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    templateId: '',
    segmentFilter: { tags: [] as string[], lastOrderDays: null as number | null },
    variableValues: {} as Record<string, string>
  })
  const [segmentCount, setSegmentCount] = useState<{ count: number; optedOutCount: number; estimatedCost: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [csvImporting, setCsvImporting] = useState(false)
  const [showInfoSection, setShowInfoSection] = useState(false)

  const activityLabel = getActivityLabel(business?.businessType)

  const downloadExampleCsv = () => {
    const blob = new Blob([CSV_EXAMPLE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'broadcast-contacts-example.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const fetchContacts = useCallback(async () => {
    const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/contacts`)
    if (res.ok) {
      const data = await res.json()
      setContacts(data.contacts)
      setOptedOutCount(data.optedOutCount || 0)
    }
  }, [businessId])

  const fetchTemplates = useCallback(async () => {
    const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/templates`)
    if (res.ok) {
      const data = await res.json()
      setTemplates(data.templates)
    }
  }, [businessId])

  const fetchCampaigns = useCallback(async () => {
    const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/campaigns`)
    if (res.ok) {
      const data = await res.json()
      setCampaigns(data.campaigns)
    }
  }, [businessId])

  const fetchSegmentCount = useCallback(async () => {
    const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/campaigns/segment-count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segmentFilter: campaignForm.segmentFilter })
    })
    if (res.ok) {
      const data = await res.json()
      setSegmentCount(data)
    }
  }, [businessId, campaignForm.segmentFilter])

  const fetchBusiness = useCallback(async () => {
    const res = await fetch(`/api/admin/stores/${businessId}`)
    if (res.ok) {
      const d = await res.json()
      setBusiness({ businessType: d.business?.businessType ?? null })
    }
  }, [businessId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchContacts(), fetchTemplates(), fetchCampaigns(), fetchBusiness()])
      setLoading(false)
    }
    load()
  }, [fetchContacts, fetchTemplates, fetchCampaigns, fetchBusiness])

  useEffect(() => {
    if (showNewCampaign) fetchSegmentCount()
  }, [showNewCampaign, campaignForm.segmentFilter, fetchSegmentCount])

  const handleImportConversations = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/contacts/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'conversations' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(`Imported ${data.imported} contacts`)
      fetchContacts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }
    try {
      setCsvImporting(true)
      const text = await file.text()
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
      const rows = (parsed.data || []).map((row) => {
        const phone = row.phone || row.Phone || row.PHONE || row.tel || ''
        const name = row.name || row.Name || row.NAME || null
        return { phone: phone.trim(), name: name?.trim() || undefined }
      }).filter((r) => r.phone.length >= 10)
      if (rows.length === 0) {
        toast.error('No valid rows (need phone column with 10+ digits)')
        return
      }
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/contacts/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'csv', rows })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(`Imported ${data.imported} contacts from CSV`)
      fetchContacts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'CSV import failed')
    } finally {
      setCsvImporting(false)
      e.target.value = ''
    }
  }

  const handleSyncOrders = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/contacts/sync-orders`, {
        method: 'POST'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(`Synced ${data.synced} contacts`)
      fetchContacts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
    }
  }

  const handleCreateCampaign = async (sendNow: boolean) => {
    if (!campaignForm.name.trim()) {
      toast.error('Campaign name required')
      return
    }
    if (!campaignForm.templateId) {
      toast.error('Select a template')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignForm.name.trim(),
          templateId: campaignForm.templateId,
          segmentFilter: campaignForm.segmentFilter,
          variableValues: campaignForm.variableValues,
          sendNow
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(sendNow ? 'Campaign sent!' : 'Campaign created')
      setShowNewCampaign(false)
      setCampaignForm({ name: '', templateId: '', segmentFilter: { tags: [], lastOrderDays: null }, variableValues: {} })
      fetchCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/campaigns/${campaignId}/send`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error((await res.json()).message)
      toast.success('Campaign send started')
      fetchCampaigns()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Broadcast</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage contacts, templates, and send campaigns
          </p>
        </div>
        {tab === 'campaigns' && (
          <button
            onClick={() => setShowNewCampaign(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </button>
        )}
      </div>

      {/* Informative section - How Broadcast works */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowInfoSection((p) => !p)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-teal-100/50 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium text-teal-900">
            <Info className="w-5 h-5 text-teal-600" />
            How Broadcast works
          </span>
          {showInfoSection ? <ChevronUp className="w-5 h-5 text-teal-600" /> : <ChevronDown className="w-5 h-5 text-teal-600" />}
        </button>
        {showInfoSection && (
          <div className="px-4 mt-2 pb-4 pt-0 space-y-3 text-sm text-gray-700 border-t border-teal-100">
            <p>
              <strong>Broadcast</strong> lets you send promotional messages (e.g. Valentine&apos;s Day offers, new menu) to your customers via WhatsApp. 
              You can only message customers who have contacted you first, or who you&apos;ve imported.
            </p>
            <p>
              <strong>Contacts:</strong> Import from existing conversations, or upload a CSV with columns <code className="bg-white px-1 rounded">phone</code> and optionally <code className="bg-white px-1 rounded">name</code>. 
              &quot;Sync {activityLabel} Stats&quot; updates contact counts from your {activityLabel.toLowerCase()}.
            </p>
            <p>
              <strong>Campaigns:</strong> Pick a Meta-approved template, segment by tags or recent {activityLabel.toLowerCase()}, then send. 
              Contact WaveOrder for pricing details. Opted-out contacts are excluded.
            </p>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm ${
                tab === t.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {tab === 'contacts' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex flex-wrap gap-2">
                <button
                  onClick={handleImportConversations}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Conversations
                </button>
                <label className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer ${csvImporting ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}>
                  {csvImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {csvImporting ? 'Importing…' : 'Import from CSV'}
                  <input
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleCsvImport}
                    disabled={csvImporting}
                  />
                </label>
                <button
                  onClick={handleSyncOrders}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync {activityLabel} Stats
                </button>
              </div>
              <div className="p-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-gray-500">
                  {contacts.length} contacts · {optedOutCount} opted out
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  CSV: columns phone (or Phone), name (optional)
                  <button
                    onClick={downloadExampleCsv}
                    className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download example
                  </button>
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{activityLabel}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contacts.slice(0, 50).map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{c.phone}</td>
                      <td className="px-4 py-3 text-sm">{c.name || '—'}</td>
                      <td className="px-4 py-3 text-sm">{c.totalOrders}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.optedOut ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {c.optedOut ? 'Opted out' : 'Subscribed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contacts.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No contacts yet. Import from Conversations or add manually.
                </div>
              )}
            </div>
          )}

          {tab === 'templates' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-2">
                Add Meta-approved WhatsApp templates. Create templates in Twilio Content Editor or Meta Business Manager, then add the Content SID here.
              </p>
              <a
                href={`/admin/stores/${businessId}/support/tickets?create=1&type=WHATSAPP_TEMPLATES`}
                className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium mb-4"
              >
                <Info className="w-4 h-4" />
                Not familiar with Twilio or template creation? Contact WaveOrder support for help
              </a>
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-2">Add template</h3>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    placeholder="Template name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Content SID (HX...)"
                    value={templateForm.contentSid}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, contentSid: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={async () => {
                      if (!templateForm.name.trim() || !templateForm.contentSid.trim()) {
                        toast.error('Name and Content SID required')
                        return
                      }
                      try {
                        setTemplateSaving(true)
                        const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/templates`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: templateForm.name.trim(),
                            contentSid: templateForm.contentSid.trim(),
                            bodyPreview: templateForm.bodyPreview.trim() || null,
                            variableCount: templateForm.variableCount || 0
                          })
                        })
                        if (!res.ok) throw new Error((await res.json()).message)
                        toast.success('Template added')
                        setTemplateForm({ name: '', contentSid: '', bodyPreview: '', variableCount: 0 })
                        fetchTemplates()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Failed')
                      } finally {
                        setTemplateSaving(false)
                      }
                    }}
                    disabled={templateSaving}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                  >
                    {templateSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add'}
                  </button>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Body preview (optional)"
                    value={templateForm.bodyPreview}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, bodyPreview: e.target.value }))}
                    className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Variables ({'{{1}}'}, {'{{2}}'}…):
                    <input
                      type="number"
                      min={0}
                      value={templateForm.variableCount || ''}
                      onChange={(e) => setTemplateForm((p) => ({ ...p, variableCount: parseInt(e.target.value, 10) || 0 }))}
                      placeholder="0"
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{t.contentSid}</p>
                      {t.bodyPreview && <p className="text-sm text-gray-600 mt-1">{t.bodyPreview.slice(0, 80)}…</p>}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
                {templates.length === 0 && (
                  <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    No templates yet. Create a template in Twilio Content Editor or Meta Business Manager, then add it above. Need help? Contact WaveOrder support.
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'campaigns' && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.template?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          c.status === 'sent' ? 'bg-green-100 text-green-800' :
                          c.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                          c.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.delivered} / {c.totalRecipients || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {(c.status === 'draft' || c.status === 'scheduled') && (
                          <button
                            onClick={() => handleSendCampaign(c.id)}
                            className="inline-flex items-center px-3 py-1 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {campaigns.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  No campaigns yet. Add a template first, then create a campaign.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">New Campaign</h2>
              <button onClick={() => setShowNewCampaign(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Valentine's Day Special"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template *</label>
                <select
                  value={campaignForm.templateId}
                  onChange={(e) => setCampaignForm((p) => ({ ...p, templateId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select template</option>
                  {templates.filter((t) => t.status === 'APPROVED').map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {(() => {
                const sel = templates.find((t) => t.id === campaignForm.templateId)
                const vCount = sel?.variableCount ?? 0
                return vCount > 0 ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Template variables</label>
                    <p className="text-xs text-gray-500 mb-2">
                      Map variables {'{{1}}'}, {'{{2}}'}, etc. Use presets or custom text. {'{{contact.name}}'} and {'{{contact.phone}}'} are replaced per contact.
                    </p>
                    {Array.from({ length: vCount }, (_, i) => {
                      const key = String(i + 1)
                      const val = campaignForm.variableValues[key] ?? ''
                      const isPreset = val === '{{contact.name}}' || val === '{{contact.phone}}'
                      const mode = isPreset ? val : val ? 'custom' : '{{contact.name}}'
                      return (
                        <div key={key} className="flex gap-2 items-center flex-wrap">
                          <span className="text-sm font-mono w-10 shrink-0">{`{{${key}}}`}</span>
                          <select
                            value={mode}
                            onChange={(e) => {
                              const v = e.target.value
                              setCampaignForm((p) => ({
                                ...p,
                                variableValues: {
                                  ...p.variableValues,
                                  [key]: v === 'custom' ? (p.variableValues[key] || '') : v
                                }
                              }))
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36 shrink-0"
                          >
                            <option value="{{contact.name}}">Customer name</option>
                            <option value="{{contact.phone}}">Phone</option>
                            <option value="custom">Custom…</option>
                          </select>
                          {mode === 'custom' && (
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => setCampaignForm((p) => ({
                                ...p,
                                variableValues: { ...p.variableValues, [key]: e.target.value }
                              }))}
                              placeholder="Static value"
                              className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : null
              })()}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment: Tags (comma-separated)</label>
                <input
                  type="text"
                  value={campaignForm.segmentFilter.tags?.join(', ') ?? ''}
                  onChange={(e) => setCampaignForm((p) => ({
                    ...p,
                    segmentFilter: {
                      ...p.segmentFilter,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    }
                  }))}
                  placeholder="e.g. vip, newsletter (leave empty for all)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segment: {activityLabel} in last N days</label>
                <input
                  type="number"
                  value={campaignForm.segmentFilter.lastOrderDays ?? ''}
                  onChange={(e) => setCampaignForm((p) => ({
                    ...p,
                    segmentFilter: {
                      ...p.segmentFilter,
                      lastOrderDays: e.target.value ? parseInt(e.target.value, 10) : null
                    }
                  }))}
                  placeholder="All contacts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {segmentCount && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  Estimated reach: {segmentCount.count} contacts · Excluded: {segmentCount.optedOutCount} opted out<br />
                  <span className="text-gray-600">Estimated cost: ~${segmentCount.estimatedCost.toFixed(2)}. Contact WaveOrder for pricing details.</span>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button onClick={() => setShowNewCampaign(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => handleCreateCampaign(false)}
                disabled={saving}
                className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleCreateCampaign(true)}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
