'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarClock,
  Loader2,
  Save,
  Copy,
  Check,
  Code,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { HOLAORA_EMBED_IFRAME_BASE, HOLAORA_EMBED_SCRIPT_DEFAULT } from '@/lib/holaora-embed-constants'
import { parseHolaEmbedPaste } from '@/lib/holaora-embed-parse'
import { CatalogCountryMultiselect } from '@/components/admin/products/CatalogCountryMultiselect'

type EmbedKind = 'SCRIPT' | 'IFRAME'

type HolaState = {
  holaoraEntitled: boolean
  holaoraStorefrontEmbedEnabled: boolean
  holaoraEmbedKind: EmbedKind
  holaoraAccountId: string | null
  holaoraChatPrimaryColor: string | null
  holaoraChatPosition: string | null
  holaoraChatTitle: string | null
  holaoraChatGreeting: string | null
  holaoraChatSuggestionsEnabled: boolean
  holaoraChatSuggestions: string[] | null
  holaoraIframeWidth: number | null
  holaoraIframeHeight: number | null
  holaoraSetupUrl: string | null
  holaoraProvisioningStatus: string | null
  holaoraProvisioningError: string | null
  aiAssistantEnabled: boolean
  storefrontAiGeoSplitEnabled: boolean
  aiAssistantVisitorCountryCodes: string[]
}

function formatApiError(json: { error?: unknown }): string {
  const e = json.error
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    const flat = e as Record<string, string[] | string>
    const first = Object.values(flat).find((v) => v != null)
    if (Array.isArray(first) && first[0]) return String(first[0])
    if (typeof first === 'string') return first
  }
  return 'Request failed'
}

export function HolaOraSettings({ businessId }: { businessId: string }) {
  const [data, setData] = useState<HolaState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [embedOn, setEmbedOn] = useState(false)
  const [embedKind, setEmbedKind] = useState<EmbedKind>('SCRIPT')
  const [workspaceId, setWorkspaceId] = useState('')
  const [primaryColor, setPrimaryColor] = useState('')
  const [position, setPosition] = useState('bottom-right')
  const [chatTitle, setChatTitle] = useState('')
  const [greeting, setGreeting] = useState('')
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false)
  const [suggestionsText, setSuggestionsText] = useState('')
  const [iframeW, setIframeW] = useState('400')
  const [iframeH, setIframeH] = useState('600')

  const [showEmbedPaste, setShowEmbedPaste] = useState(false)
  const [embedPaste, setEmbedPaste] = useState('')
  const [embedPasteErr, setEmbedPasteErr] = useState<string | null>(null)

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [geoSplit, setGeoSplit] = useState(false)
  const [aiCountryCodes, setAiCountryCodes] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/holaora-settings`)
      const json = await res.json()
      if (!res.ok) throw new Error(formatApiError(json))
      setData({
        ...json,
        storefrontAiGeoSplitEnabled: json.storefrontAiGeoSplitEnabled ?? false,
        aiAssistantVisitorCountryCodes: Array.isArray(json.aiAssistantVisitorCountryCodes)
          ? json.aiAssistantVisitorCountryCodes
          : [],
      })
      setEmbedOn(!!json.holaoraStorefrontEmbedEnabled)
      setEmbedKind(json.holaoraEmbedKind === 'IFRAME' ? 'IFRAME' : 'SCRIPT')
      setWorkspaceId(json.holaoraAccountId || '')
      setPrimaryColor(json.holaoraChatPrimaryColor || '')
      setPosition(json.holaoraChatPosition || 'bottom-right')
      setChatTitle(json.holaoraChatTitle || '')
      setGreeting(json.holaoraChatGreeting || '')
      setSuggestionsEnabled(!!json.holaoraChatSuggestionsEnabled)
      setSuggestionsText((json.holaoraChatSuggestions || []).join('\n'))
      setIframeW(json.holaoraIframeWidth != null ? String(json.holaoraIframeWidth) : '400')
      setIframeH(json.holaoraIframeHeight != null ? String(json.holaoraIframeHeight) : '600')
      setGeoSplit(!!json.storefrontAiGeoSplitEnabled)
      setAiCountryCodes(
        Array.isArray(json.aiAssistantVisitorCountryCodes) ? json.aiAssistantVisitorCountryCodes : []
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    load()
  }, [load])

  const previewScriptTag = useMemo(() => {
    const ws = workspaceId.trim()
    if (!ws) return ''
    const esc = (s: string) => encodeURIComponent(s)
    const parts = [
      `<script src="${HOLAORA_EMBED_SCRIPT_DEFAULT}"`,
      `  data-workspace="${ws}"`,
    ]
    if (primaryColor.trim()) parts.push(`  data-primary-color="${primaryColor.trim()}"`)
    if (position.trim()) parts.push(`  data-position="${position.trim()}"`)
    if (chatTitle.trim()) parts.push(`  data-title="${esc(chatTitle.trim())}"`)
    if (greeting.trim()) parts.push(`  data-greeting="${esc(greeting.trim())}"`)
    if (suggestionsEnabled) {
      parts.push(`  data-suggestions-enabled="true"`)
      const list = suggestionsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      parts.push(`  data-suggestions="${esc(JSON.stringify(list))}"`)
    }
    parts.push(`></script>`)
    return parts.join('\n')
  }, [workspaceId, primaryColor, position, chatTitle, greeting, suggestionsEnabled, suggestionsText])

  const previewIframeTag = useMemo(() => {
    const ws = workspaceId.trim()
    if (!ws) return ''
    const w = parseInt(iframeW, 10) || 400
    const h = parseInt(iframeH, 10) || 600
    return `<iframe
  src="${HOLAORA_EMBED_IFRAME_BASE}?workspace=${encodeURIComponent(ws)}"
  width="${w}"
  height="${h}"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
</iframe>`
  }, [workspaceId, iframeW, iframeH])

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  const applyEmbedPaste = () => {
    setEmbedPasteErr(null)
    const parsed = parseHolaEmbedPaste(embedPaste)
    if (!parsed.workspaceId || !parsed.kind) {
      setEmbedPasteErr(
        'Could not find a Hola workspace. Paste the script tag, iframe tag, or embed/window URL from HolaOra.'
      )
      return
    }
    setWorkspaceId(parsed.workspaceId)
    setEmbedKind(parsed.kind)
    if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor)
    if (parsed.position) setPosition(parsed.position)
    if (parsed.title) setChatTitle(parsed.title)
    if (parsed.greeting) setGreeting(parsed.greeting)
    if (parsed.suggestions?.length) {
      setSuggestionsEnabled(true)
      setSuggestionsText(parsed.suggestions.join('\n'))
    } else if (parsed.suggestionsEnabled === true) {
      setSuggestionsEnabled(true)
    } else if (parsed.suggestionsEnabled === false) {
      setSuggestionsEnabled(false)
      setSuggestionsText('')
    }
    if (parsed.kind === 'IFRAME') {
      if (parsed.iframeWidth != null) setIframeW(String(parsed.iframeWidth))
      if (parsed.iframeHeight != null) setIframeH(String(parsed.iframeHeight))
    }
    setEmbedPaste('')
    setShowEmbedPaste(false)
  }

  const dirty = useMemo(() => {
    if (!data) return false
    const w = workspaceId.trim() || null
    const w0 = data.holaoraAccountId
    const posNorm = (s: string) => (s.trim() || 'bottom-right')
    const posDb = data.holaoraChatPosition || 'bottom-right'
    const iw = parseInt(iframeW, 10)
    const ih = parseInt(iframeH, 10)
    const iwNorm = Number.isFinite(iw) ? iw : 400
    const ihNorm = Number.isFinite(ih) ? ih : 600
    const iwDb = data.holaoraIframeWidth ?? 400
    const ihDb = data.holaoraIframeHeight ?? 600
    return (
      embedOn !== data.holaoraStorefrontEmbedEnabled ||
      embedKind !== (data.holaoraEmbedKind === 'IFRAME' ? 'IFRAME' : 'SCRIPT') ||
      w !== w0 ||
      (primaryColor.trim() || null) !== (data.holaoraChatPrimaryColor || null) ||
      posNorm(position) !== posDb ||
      (chatTitle.trim() || null) !== (data.holaoraChatTitle || null) ||
      (greeting.trim() || null) !== (data.holaoraChatGreeting || null) ||
      suggestionsEnabled !== data.holaoraChatSuggestionsEnabled ||
      suggestionsText.split('\n').map((l) => l.trim()).filter(Boolean).join('\n') !==
        (data.holaoraChatSuggestions || []).join('\n') ||
      iwNorm !== iwDb ||
      ihNorm !== ihDb
    )
  }, [
    data,
    embedOn,
    embedKind,
    workspaceId,
    primaryColor,
    position,
    chatTitle,
    greeting,
    suggestionsEnabled,
    suggestionsText,
    iframeW,
    iframeH,
  ])

  const save = async () => {
    if (!data?.holaoraEntitled) return
    setSaving(true)
    setError(null)
    try {
      const ws = workspaceId.trim()
      const iw = parseInt(iframeW, 10)
      const ih = parseInt(iframeH, 10)
      const body: Record<string, unknown> = {
        holaoraStorefrontEmbedEnabled: embedOn,
        holaoraEmbedKind: embedKind,
        holaoraAccountId: ws || null,
        holaoraChatPrimaryColor: primaryColor.trim() || null,
        holaoraChatPosition: position.trim() || null,
        holaoraChatTitle: chatTitle.trim() || null,
        holaoraChatGreeting: greeting.trim() || null,
        holaoraChatSuggestionsEnabled: suggestionsEnabled,
        holaoraChatSuggestions: suggestionsText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        holaoraIframeWidth: Number.isFinite(iw) ? iw : null,
        holaoraIframeHeight: Number.isFinite(ih) ? ih : null,
        storefrontAiGeoSplitEnabled: geoSplit,
        aiAssistantVisitorCountryCodes: aiCountryCodes,
      }
      const res = await fetch(`/api/admin/stores/${businessId}/holaora-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(formatApiError(json))
      setData((prev) =>
        prev
          ? {
              ...prev,
              holaoraStorefrontEmbedEnabled: json.holaoraStorefrontEmbedEnabled,
              holaoraEmbedKind: json.holaoraEmbedKind,
              holaoraAccountId: json.holaoraAccountId,
              holaoraChatPrimaryColor: json.holaoraChatPrimaryColor,
              holaoraChatPosition: json.holaoraChatPosition,
              holaoraChatTitle: json.holaoraChatTitle,
              holaoraChatGreeting: json.holaoraChatGreeting,
              holaoraChatSuggestionsEnabled: json.holaoraChatSuggestionsEnabled,
              holaoraChatSuggestions: json.holaoraChatSuggestions,
              holaoraIframeWidth: json.holaoraIframeWidth,
              holaoraIframeHeight: json.holaoraIframeHeight,
              aiAssistantEnabled: json.aiAssistantEnabled,
              storefrontAiGeoSplitEnabled: json.storefrontAiGeoSplitEnabled ?? false,
              aiAssistantVisitorCountryCodes: Array.isArray(json.aiAssistantVisitorCountryCodes)
                ? json.aiAssistantVisitorCountryCodes
                : [],
            }
          : prev
      )
      setGeoSplit(!!json.storefrontAiGeoSplitEnabled)
      setAiCountryCodes(
        Array.isArray(json.aiAssistantVisitorCountryCodes) ? json.aiAssistantVisitorCountryCodes : []
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

  const canEdit = data.holaoraEntitled

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <CalendarClock className="w-8 h-8 text-teal-600 shrink-0 mt-1" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HolaOra</h1>
          <p className="text-sm text-gray-600 mt-1">
            Paste the embed code from your HolaOra dashboard (script or iframe). You cannot enable the embed while the AI
            Store Assistant is on — unless <strong>AI vs Hola by country</strong> is enabled below with at least one country
            (configure details under SuperAdmin → Custom features, or here).
          </p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
        <div className="flex justify-between gap-4">
          <span className="text-sm font-medium text-gray-700">Subscription entitlement</span>
          <span className={data.holaoraEntitled ? 'text-teal-700 font-medium' : 'text-gray-500'}>
            {data.holaoraEntitled ? 'Active' : 'Not included'}
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
            <a href={data.holaoraSetupUrl} target="_blank" rel="noreferrer" className="text-teal-600 underline break-all">
              {data.holaoraSetupUrl}
            </a>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 space-y-3">
            <div className="text-sm font-medium text-gray-900">AI vs Hola by visitor country</div>
            <p className="text-xs text-gray-600">
              Visitors in the selected countries see the WaveOrder AI assistant (when enabled). Everyone else sees Hola when
              the embed below is on. Uses the same visitor country as the catalog: URL params and cookie.
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-800">Enable geo split</span>
              <button
                type="button"
                role="switch"
                aria-checked={geoSplit}
                disabled={!canEdit || saving}
                onClick={() => setGeoSplit((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                  geoSplit ? 'bg-teal-600' : 'bg-gray-200'
                } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow mt-1 transition ${
                    geoSplit ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {geoSplit && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                    disabled={!canEdit || saving}
                    onClick={() => setAiCountryCodes(['GR'])}
                  >
                    Preset: Greece only
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                    disabled={!canEdit || saving}
                    onClick={() => setAiCountryCodes([])}
                  >
                    Clear
                  </button>
                </div>
                <CatalogCountryMultiselect
                  id="hola-settings-ai-countries"
                  label="Countries — WaveOrder AI"
                  helperText="Required while geo split is on (at least one). Same country list as product catalog."
                  value={aiCountryCodes}
                  onChange={setAiCountryCodes}
                />
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-gray-900">Show HolaOra on storefront</div>
              <div className="text-xs text-gray-500 mt-0.5">
                AI assistant: {data.aiAssistantEnabled ? 'on' : 'off'}
                {data.storefrontAiGeoSplitEnabled && (data.aiAssistantVisitorCountryCodes?.length ?? 0) > 0
                  ? ' — geo split on (both may be enabled)'
                  : ' — mutually exclusive unless geo split'}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={embedOn}
              disabled={!canEdit || saving}
              onClick={() => setEmbedOn((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                embedOn ? 'bg-teal-600' : 'bg-gray-200'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow mt-1 transition ${
                  embedOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-900 block mb-2">Integration</span>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="hola-embed-kind"
                  checked={embedKind === 'SCRIPT'}
                  disabled={!canEdit || saving}
                  onChange={() => setEmbedKind('SCRIPT')}
                />
                Script (recommended)
              </label>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="hola-embed-kind"
                  checked={embedKind === 'IFRAME'}
                  disabled={!canEdit || saving}
                  onChange={() => setEmbedKind('IFRAME')}
                />
                Iframe (fixed window)
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="hola-workspace" className="block text-sm font-medium text-gray-700 mb-1">
              Workspace ID
            </label>
            <input
              id="hola-workspace"
              type="text"
              placeholder="e.g. 56e25486-18e7-49ae-8db0-10725f151a6f"
              value={workspaceId}
              disabled={!canEdit || saving}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </div>

          {/* Paste full script or iframe from Hola — auto-detects and fills fields */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowEmbedPaste((v) => !v)
                setEmbedPasteErr(null)
              }}
              className="flex items-center gap-2 text-sm font-medium text-teal-700"
            >
              <Code className="w-4 h-4" />
              Paste embed from HolaOra (script or iframe)
              {showEmbedPaste ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showEmbedPaste && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">
                  Copy the <strong>script</strong> or <strong>iframe</strong> block from your Hola dashboard (or a bare
                  embed/window URL). We detect the type and prefill workspace, colors, title, and size.
                </p>
                <textarea
                  value={embedPaste}
                  onChange={(e) => setEmbedPaste(e.target.value)}
                  rows={6}
                  placeholder='<script src="https://holaora.com/embed/chat.js" ...> or <iframe src="https://holaora.com/embed/window?workspace=...">'
                  className="w-full rounded border border-gray-200 p-2 text-xs font-mono"
                />
                {embedPasteErr && <p className="text-xs text-red-600">{embedPasteErr}</p>}
                <button
                  type="button"
                  onClick={applyEmbedPaste}
                  className="text-sm px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                >
                  Apply to fields
                </button>
              </div>
            )}
          </div>

          {embedKind === 'SCRIPT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary color</label>
                <input
                  type="text"
                  placeholder="#FF6B35"
                  value={primaryColor}
                  disabled={!canEdit || saving}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  placeholder="bottom-right"
                  value={position}
                  disabled={!canEdit || saving}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Widget title</label>
                <input
                  type="text"
                  value={chatTitle}
                  disabled={!canEdit || saving}
                  onChange={(e) => setChatTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Greeting</label>
                <input
                  type="text"
                  value={greeting}
                  disabled={!canEdit || saving}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="hola-suggestions-en"
                  type="checkbox"
                  checked={suggestionsEnabled}
                  disabled={!canEdit || saving}
                  onChange={(e) => setSuggestionsEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="hola-suggestions-en" className="text-sm font-medium text-gray-700">
                  Quick suggestions (chips)
                </label>
              </div>
              {suggestionsEnabled && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suggestions (one per line)
                  </label>
                  <textarea
                    value={suggestionsText}
                    disabled={!canEdit || saving}
                    onChange={(e) => setSuggestionsText(e.target.value)}
                    rows={5}
                    placeholder={'Pricing and plans\nDo I need the WhatsApp Business API?'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {embedKind === 'IFRAME' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Iframe width</label>
                <input
                  type="number"
                  min={200}
                  max={1200}
                  value={iframeW}
                  disabled={!canEdit || saving}
                  onChange={(e) => setIframeW(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Iframe height</label>
                <input
                  type="number"
                  min={200}
                  max={1200}
                  value={iframeH}
                  disabled={!canEdit || saving}
                  onChange={(e) => setIframeH(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Preview + copy — mirrors Hola dashboard output */}
          {workspaceId.trim() && (
            <div className="rounded-lg border border-dashed border-gray-200 p-4 space-y-3">
              <p className="text-xs font-medium text-gray-600">Preview (copy to use outside WaveOrder)</p>
              {embedKind === 'SCRIPT' && previewScriptTag && (
                <div>
                  <div className="flex justify-end mb-1">
                    <button
                      type="button"
                      onClick={() => copyText('script', previewScriptTag)}
                      className="inline-flex items-center gap-1 text-xs text-teal-600"
                    >
                      {copiedKey === 'script' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy script tag
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                    {previewScriptTag}
                  </pre>
                </div>
              )}
              {embedKind === 'IFRAME' && previewIframeTag && (
                <div>
                  <div className="flex justify-end mb-1">
                    <button
                      type="button"
                      onClick={() => copyText('iframe', previewIframeTag)}
                      className="inline-flex items-center gap-1 text-xs text-teal-600"
                    >
                      {copiedKey === 'iframe' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy iframe
                    </button>
                  </div>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                    {previewIframeTag}
                  </pre>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={!canEdit || saving || !dirty}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save embed settings
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Entitlement updates when your Stripe subscription includes a HolaOra-eligible price. Contact support if entitlement
        looks wrong after a plan change.
      </p>
    </div>
  )
}
