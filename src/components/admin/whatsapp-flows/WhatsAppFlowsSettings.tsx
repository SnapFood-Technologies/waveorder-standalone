'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2, AlertCircle, Copy, Check, Wifi, Plus, Trash2, Bot, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface WhatsAppSettings {
  id: string
  isEnabled: boolean
  phoneNumber: string | null
  welcomeFlowEnabled: boolean
  awayFlowEnabled: boolean
  businessHoursStart: string | null
  businessHoursEnd: string | null
  businessHoursTimezone: string | null
  businessDays: number[]
  aiEnabled?: boolean
  aiPersonality?: string
  aiPersonalityPrompt?: string | null
  aiConfidenceThreshold?: number
  aiDailyLimit?: number
}

interface Faq {
  id: string
  question: string
  answer: string
  order: number
}

interface WhatsAppFlowsSettingsProps {
  businessId: string
}

const DAY_LABELS: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun'
}

export function WhatsAppFlowsSettings({ businessId }: WhatsAppFlowsSettingsProps) {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null)
  const [formData, setFormData] = useState({
    isEnabled: false,
    phoneNumber: '',
    welcomeFlowEnabled: true,
    awayFlowEnabled: true,
    businessHoursStart: '09:00',
    businessHoursEnd: '22:00',
    businessHoursTimezone: 'UTC',
    businessDays: [1, 2, 3, 4, 5],
    aiEnabled: false,
    aiPersonality: 'friendly' as string,
    aiPersonalityPrompt: '' as string,
    aiConfidenceThreshold: 0.6,
    aiDailyLimit: 50,
    autoAssignEnabled: false,
    slaWarningMinutes: 15
  })
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' })
  const [cannedResponses, setCannedResponses] = useState<Array<{ id: string; title: string; body: string; shortcut?: string }>>([])
  const [cannedForm, setCannedForm] = useState({ title: '', body: '', shortcut: '' })

  const fetchCannedResponses = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/canned-responses`)
      if (res.ok) {
        const data = await res.json()
        setCannedResponses(data.responses || [])
      }
    } catch {
      // ignore
    }
  }, [businessId])

  const fetchFaqs = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/faqs`)
      if (res.ok) {
        const data = await res.json()
        setFaqs(data.faqs || [])
      }
    } catch {
      // ignore
    }
  }, [businessId])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/settings`)
        if (!res.ok) throw new Error('Failed to load settings')
        const data = await res.json()
        const s = data.settings
        setSettings(s)
        setWebhookUrl(s?.webhookUrl || '')
        if (data.settings) {
          setFormData({
            isEnabled: data.settings.isEnabled ?? false,
            phoneNumber: data.settings.phoneNumber || '',
            welcomeFlowEnabled: data.settings.welcomeFlowEnabled ?? true,
            awayFlowEnabled: data.settings.awayFlowEnabled ?? true,
            businessHoursStart: data.settings.businessHoursStart || '09:00',
            businessHoursEnd: data.settings.businessHoursEnd || '22:00',
            businessHoursTimezone: data.settings.businessHoursTimezone || 'UTC',
            businessDays: Array.isArray(data.settings.businessDays) ? data.settings.businessDays : [1, 2, 3, 4, 5],
            aiEnabled: data.settings.aiEnabled ?? false,
            aiPersonality: data.settings.aiPersonality || 'friendly',
            aiPersonalityPrompt: data.settings.aiPersonalityPrompt || '',
            aiConfidenceThreshold: data.settings.aiConfidenceThreshold ?? 0.6,
            aiDailyLimit: data.settings.aiDailyLimit ?? 50,
            autoAssignEnabled: data.settings.autoAssignEnabled ?? false,
            slaWarningMinutes: data.settings.slaWarningMinutes ?? 15
          })
        }
      } catch (err) {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
    fetchFaqs()
    fetchCannedResponses()
  }, [businessId, fetchFaqs, fetchCannedResponses])

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phoneNumber: formData.phoneNumber.trim() || null,
          aiPersonalityPrompt: formData.aiPersonality === 'custom' ? formData.aiPersonalityPrompt : null
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to save')
      }
      toast.success('Settings saved')
      setSettings((await res.json()).settings)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      businessDays: prev.businessDays.includes(day)
        ? prev.businessDays.filter((d) => d !== day)
        : [...prev.businessDays, day].sort()
    }))
  }

  const copyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      toast.success('Webhook URL copied')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">WaveOrder Flows Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Configure your WhatsApp messaging automation
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Enable WaveOrder Flows</h2>
            <p className="text-sm text-gray-600">Turn on to receive and reply to WhatsApp messages</p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isEnabled}
            onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium text-gray-700">Enable WaveOrder Flows</span>
        </label>
        {formData.isEnabled && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.welcomeFlowEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, welcomeFlowEnabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">Welcome message</span>
            </label>
            <p className="text-xs text-gray-500">Auto-send when a customer messages for the first time</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.awayFlowEnabled}
                onChange={(e) => setFormData((prev) => ({ ...prev, awayFlowEnabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">Away message</span>
            </label>
            <p className="text-xs text-gray-500">Auto-send when customer messages outside business hours</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp Number</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business WhatsApp Number</label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="+355 69 123 4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your WhatsApp Business number. Used to match incoming messages to your business.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Twilio Webhook</h2>
        <p className="text-sm text-gray-600">
          Configure this URL in your Twilio Console under Messaging → Settings → Webhook URL for &quot;A MESSAGE COMES IN&quot;.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={webhookUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={copyWebhook}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={async () => {
              setTesting(true)
              setTestResult(null)
              try {
                const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/test`, {
                  method: 'POST'
                })
                const data = await res.json()
                setTestResult({ status: data.status, message: data.message })
                if (data.status === 'healthy') {
                  toast.success('Twilio connection OK')
                } else {
                  toast.error(data.message || 'Connection check failed')
                }
              } catch (err) {
                setTestResult({ status: 'error', message: 'Request failed' })
                toast.error('Connection test failed')
              } finally {
                setTesting(false)
              }
            }}
            disabled={testing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </button>
          {testResult && (
            <span
              className={`text-sm ${
                testResult.status === 'healthy'
                  ? 'text-green-700'
                  : testResult.status === 'unconfigured'
                    ? 'text-amber-700'
                    : 'text-red-700'
              }`}
            >
              {testResult.message}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Business Hours</h2>
        <p className="text-sm text-gray-600">Used for away messages (Phase 2)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
            <input
              type="time"
              value={formData.businessHoursStart}
              onChange={(e) => setFormData((prev) => ({ ...prev, businessHoursStart: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
            <input
              type="time"
              value={formData.businessHoursEnd}
              onChange={(e) => setFormData((prev) => ({ ...prev, businessHoursEnd: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={formData.businessHoursTimezone}
            onChange={(e) => setFormData((prev) => ({ ...prev, businessHoursTimezone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="UTC">UTC</option>
            <option value="Europe/Tirane">Europe/Tirane</option>
            <option value="Europe/Athens">Europe/Athens</option>
            <option value="Asia/Dubai">Asia/Dubai</option>
            <option value="America/New_York">America/New York</option>
            <option value="America/Los_Angeles">America/Los Angeles</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business days</label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  formData.businessDays.includes(day)
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Auto-Replies</h2>
            <p className="text-sm text-gray-600">OpenAI-powered responses when no flow matches</p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.aiEnabled}
            onChange={(e) => setFormData((prev) => ({ ...prev, aiEnabled: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium text-gray-700">Enable AI Auto-Replies</span>
        </label>
        {formData.aiEnabled && (
          <div className="pt-4 space-y-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
              <select
                value={formData.aiPersonality}
                onChange={(e) => setFormData((prev) => ({ ...prev, aiPersonality: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="custom">Custom (use prompt below)</option>
              </select>
            </div>
            {formData.aiPersonality === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom prompt</label>
                <textarea
                  value={formData.aiPersonalityPrompt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, aiPersonalityPrompt: e.target.value }))}
                  placeholder="e.g. Be warm and use emojis sparingly..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confidence threshold ({formData.aiConfidenceThreshold})</label>
              <input
                type="range"
                min={0.5}
                max={0.9}
                step={0.1}
                value={formData.aiConfidenceThreshold}
                onChange={(e) => setFormData((prev) => ({ ...prev, aiConfidenceThreshold: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Below this, messages route to human</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily AI reply limit</label>
              <input
                type="number"
                min={1}
                max={500}
                value={formData.aiDailyLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, aiDailyLimit: Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 50)) }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Multi-Agent Inbox</h2>
        <p className="text-sm text-gray-600">Round-robin auto-assignment and SLA alerts</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.autoAssignEnabled}
            onChange={(e) => setFormData((prev) => ({ ...prev, autoAssignEnabled: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium text-gray-700">Auto-assign new conversations (round-robin)</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SLA warning (minutes)</label>
          <input
            type="number"
            min={1}
            max={120}
            value={formData.slaWarningMinutes}
            onChange={(e) => setFormData((prev) => ({ ...prev, slaWarningMinutes: Math.min(120, Math.max(1, parseInt(e.target.value, 10) || 15)) }))}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-xs text-gray-500 mt-1">Show warning when customer waits longer than this for a reply</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">FAQ (for AI)</h2>
        <p className="text-sm text-gray-600">Add Q&amp;A pairs to help the AI answer common questions</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={faqForm.question}
            onChange={(e) => setFaqForm((prev) => ({ ...prev, question: e.target.value }))}
            placeholder="Question"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            value={faqForm.answer}
            onChange={(e) => setFaqForm((prev) => ({ ...prev, answer: e.target.value }))}
            placeholder="Answer"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={async () => {
              if (!faqForm.question.trim() || !faqForm.answer.trim()) return
              try {
                const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/faqs`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ question: faqForm.question.trim(), answer: faqForm.answer.trim() })
                })
                if (!res.ok) throw new Error('Failed')
                setFaqForm({ question: '', answer: '' })
                fetchFaqs()
                toast.success('FAQ added')
              } catch {
                toast.error('Failed to add FAQ')
              }
            }}
            disabled={!faqForm.question.trim() || !faqForm.answer.trim()}
            className="inline-flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {faqs.map((faq) => (
            <div key={faq.id} className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
              <button
                onClick={async () => {
                  if (!confirm('Delete this FAQ?')) return
                  try {
                    const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/faqs/${faq.id}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error('Failed')
                    fetchFaqs()
                    toast.success('FAQ deleted')
                  } catch {
                    toast.error('Failed to delete')
                  }
                }}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {faqs.length === 0 && <p className="text-sm text-gray-500">No FAQs yet. Add some to improve AI responses.</p>}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Canned Responses</h2>
            <p className="text-sm text-gray-600">Quick reply snippets for the team inbox</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={cannedForm.title}
            onChange={(e) => setCannedForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title (e.g. Greeting)"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
          />
          <input
            type="text"
            value={cannedForm.shortcut}
            onChange={(e) => setCannedForm((p) => ({ ...p, shortcut: e.target.value }))}
            placeholder="Shortcut (e.g. /thanks)"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-28"
          />
          <input
            type="text"
            value={cannedForm.body}
            onChange={(e) => setCannedForm((p) => ({ ...p, body: e.target.value }))}
            placeholder="Message body"
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={async () => {
              if (!cannedForm.title.trim() || !cannedForm.body.trim()) return
              try {
                const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/canned-responses`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: cannedForm.title.trim(),
                    body: cannedForm.body.trim(),
                    shortcut: cannedForm.shortcut.trim() || undefined
                  })
                })
                if (!res.ok) throw new Error('Failed')
                setCannedForm({ title: '', body: '', shortcut: '' })
                fetchCannedResponses()
                toast.success('Canned response added')
              } catch {
                toast.error('Failed to add')
              }
            }}
            disabled={!cannedForm.title.trim() || !cannedForm.body.trim()}
            className="inline-flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {cannedResponses.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{c.title}{c.shortcut ? ` (${c.shortcut})` : ''}</p>
                <p className="text-sm text-gray-600 truncate">{c.body}</p>
              </div>
              <button
                onClick={async () => {
                  if (!confirm('Delete this canned response?')) return
                  try {
                    const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/canned-responses/${c.id}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error('Failed')
                    fetchCannedResponses()
                    toast.success('Deleted')
                  } catch {
                    toast.error('Failed')
                  }
                }}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {cannedResponses.length === 0 && <p className="text-sm text-gray-500">No canned responses. Add snippets for quick replies in the inbox.</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}
