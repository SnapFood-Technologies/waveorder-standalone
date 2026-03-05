'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, AlertCircle, Copy, Check, Wifi } from 'lucide-react'
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
    businessDays: [1, 2, 3, 4, 5]
  })

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
            businessDays: Array.isArray(data.settings.businessDays) ? data.settings.businessDays : [1, 2, 3, 4, 5]
          })
        }
      } catch (err) {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [businessId])

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phoneNumber: formData.phoneNumber.trim() || null
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
