'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Loader2, Save } from 'lucide-react'

type HolaState = {
  holaoraEntitled: boolean
  holaoraStorefrontEmbedEnabled: boolean
  holaoraAccountId: string | null
  holaoraSetupUrl: string | null
  holaoraProvisioningStatus: string | null
  holaoraProvisioningError: string | null
  aiAssistantEnabled: boolean
}

export function HolaOraSettings({ businessId }: { businessId: string }) {
  const [data, setData] = useState<HolaState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [embedOn, setEmbedOn] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/holaora-settings`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setData(json)
      setEmbedOn(!!json.holaoraStorefrontEmbedEnabled)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    load()
  }, [load])

  const saveEmbed = async () => {
    if (!data?.holaoraEntitled) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/holaora-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holaoraStorefrontEmbedEnabled: embedOn }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Save failed')
      setData((prev) =>
        prev
          ? {
              ...prev,
              holaoraStorefrontEmbedEnabled: json.holaoraStorefrontEmbedEnabled,
              aiAssistantEnabled: json.aiAssistantEnabled,
            }
          : prev
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center gap-2 text-gray-600 py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading HolaOra…
      </div>
    )
  }

  const canToggleEmbed = data.holaoraEntitled

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <CalendarClock className="w-8 h-8 text-teal-600 shrink-0 mt-1" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HolaOra</h1>
          <p className="text-sm text-gray-600 mt-1">
            Scheduling embed on your storefront. You cannot enable it while the AI Store Assistant is on —
            disable AI first (SuperAdmin → Custom features for this business).
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
        <div className="flex justify-between gap-4">
          <span className="text-sm font-medium text-gray-700">Subscription entitlement</span>
          <span className={data.holaoraEntitled ? 'text-teal-700 font-medium' : 'text-gray-500'}>
            {data.holaoraEntitled ? 'Active' : 'Not included'}
          </span>
        </div>

        <div className="flex justify-between gap-4 text-sm">
          <span className="text-gray-700">HolaOra account</span>
          <span className="text-gray-600 font-mono text-xs break-all text-right">
            {data.holaoraAccountId || '—'}
          </span>
        </div>

        <div className="flex justify-between gap-4 text-sm">
          <span className="text-gray-700">Provisioning</span>
          <span className="text-gray-600 text-right">
            {data.holaoraProvisioningStatus || '—'}
            {data.holaoraProvisioningError ? ` — ${data.holaoraProvisioningError}` : ''}
          </span>
        </div>

        {data.holaoraSetupUrl && (
          <div className="text-sm">
            <span className="text-gray-700 block mb-1">Setup link</span>
            <a
              href={data.holaoraSetupUrl}
              target="_blank"
              rel="noreferrer"
              className="text-teal-600 underline break-all"
            >
              {data.holaoraSetupUrl}
            </a>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-gray-900">Show HolaOra on storefront</div>
              <div className="text-xs text-gray-500 mt-0.5">
                AI assistant: {data.aiAssistantEnabled ? 'on' : 'off'} (mutually exclusive)
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={embedOn}
              disabled={!canToggleEmbed || saving}
              onClick={() => setEmbedOn((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                embedOn ? 'bg-teal-600' : 'bg-gray-200'
              } ${!canToggleEmbed ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow mt-1 transition ${
                  embedOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={saveEmbed}
            disabled={!canToggleEmbed || saving || embedOn === data.holaoraStorefrontEmbedEnabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Entitlement updates when your Stripe subscription includes a HolaOra-eligible price. Contact support
        if entitlement looks wrong after a plan change.
      </p>
    </div>
  )
}
