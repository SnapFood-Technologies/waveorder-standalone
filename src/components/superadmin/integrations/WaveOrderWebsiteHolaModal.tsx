'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Globe,
  Loader2,
  Save,
  Eye,
  EyeOff,
  X,
  Code,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { HOLAORA_EMBED_IFRAME_BASE, HOLAORA_EMBED_SCRIPT_DEFAULT } from '@/lib/holaora-embed-constants'
import { parseHolaEmbedPaste } from '@/lib/holaora-embed-parse'

type SitePayload = {
  embedEnabled?: boolean
  embedKind?: 'SCRIPT' | 'IFRAME'
  workspaceId?: string | null
  primaryColor?: string | null
  position?: string | null
  title?: string | null
  greeting?: string | null
  suggestionsEnabled?: boolean
  suggestions?: string[]
  iframeWidth?: number | null
  iframeHeight?: number | null
  portalEmail?: string | null
  portalPasswordSaved?: boolean
}

export function WaveOrderWebsiteHolaModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [embedEnabled, setEmbedEnabled] = useState(false)
  const [embedKind, setEmbedKind] = useState<'SCRIPT' | 'IFRAME'>('SCRIPT')
  const [workspaceId, setWorkspaceId] = useState('')
  const [primaryColor, setPrimaryColor] = useState('')
  const [position, setPosition] = useState('bottom-right')
  const [title, setTitle] = useState('')
  const [greeting, setGreeting] = useState('')
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false)
  const [suggestionsText, setSuggestionsText] = useState('')
  const [iframeW, setIframeW] = useState('400')
  const [iframeH, setIframeH] = useState('600')
  const [savePortalLogin, setSavePortalLogin] = useState(false)
  const [portalEmail, setPortalEmail] = useState('')
  const [portalPassword, setPortalPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const [hadPasswordSaved, setHadPasswordSaved] = useState(false)
  const [showEmbedPaste, setShowEmbedPaste] = useState(false)
  const [embedPaste, setEmbedPaste] = useState('')
  const [embedPasteErr, setEmbedPasteErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/integrations/holaora/waveorder-website')
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Load failed')
      const s: SitePayload | undefined = json.waveorderMarketingSite
      if (s) {
        setEmbedEnabled(!!s.embedEnabled)
        setEmbedKind(s.embedKind === 'IFRAME' ? 'IFRAME' : 'SCRIPT')
        setWorkspaceId(s.workspaceId || '')
        setPrimaryColor(s.primaryColor || '')
        setPosition(s.position || 'bottom-right')
        setTitle(s.title || '')
        setGreeting(s.greeting || '')
        setSuggestionsEnabled(!!s.suggestionsEnabled)
        setSuggestionsText((s.suggestions || []).join('\n'))
        setIframeW(s.iframeWidth != null ? String(s.iframeWidth) : '400')
        setIframeH(s.iframeHeight != null ? String(s.iframeHeight) : '600')
        setPortalEmail(s.portalEmail || '')
        setPortalPassword('')
        setSavePortalLogin(Boolean(s.portalEmail || s.portalPasswordSaved))
        setHadPasswordSaved(!!s.portalPasswordSaved)
      } else {
        setEmbedEnabled(false)
        setEmbedKind('SCRIPT')
        setWorkspaceId('')
        setPrimaryColor('')
        setPosition('bottom-right')
        setTitle('')
        setGreeting('')
        setSuggestionsEnabled(false)
        setSuggestionsText('')
        setIframeW('400')
        setIframeH('600')
        setPortalEmail('')
        setPortalPassword('')
        setSavePortalLogin(false)
        setHadPasswordSaved(false)
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const revealPassword = async () => {
    if (showPw) {
      setShowPw(false)
      return
    }
    if (portalPassword) {
      setShowPw(true)
      return
    }
    if (!hadPasswordSaved) {
      setShowPw(true)
      return
    }
    setRevealing(true)
    try {
      const res = await fetch('/api/superadmin/integrations/holaora/waveorder-website/reveal-password')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Reveal failed')
      setPortalPassword(data.password)
      setShowPw(true)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Reveal failed')
    } finally {
      setRevealing(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const iw = parseInt(iframeW, 10)
      const ih = parseInt(iframeH, 10)
      const body = {
        embedEnabled,
        embedKind,
        workspaceId: workspaceId.trim(),
        primaryColor: primaryColor.trim(),
        position: position.trim(),
        title: title.trim(),
        greeting: greeting.trim(),
        suggestionsEnabled,
        suggestions: suggestionsText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        iframeWidth: Number.isFinite(iw) ? iw : null,
        iframeHeight: Number.isFinite(ih) ? ih : null,
        savePortalLogin,
        portalEmail: portalEmail.trim(),
        portalPassword: portalPassword.trim(),
      }
      const res = await fetch('/api/superadmin/integrations/holaora/waveorder-website', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Save failed')
      toast.success('WaveOrder website Hola settings saved')
      setHadPasswordSaved(!!json.waveorderMarketingSite?.portalPasswordSaved)
      onSaved?.()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const applyEmbedPaste = () => {
    setEmbedPasteErr(null)
    const p = parseHolaEmbedPaste(embedPaste)
    if (!p.workspaceId || !p.kind) {
      setEmbedPasteErr(
        'Could not find a Hola workspace. Paste the script tag, iframe tag, or embed/window URL from HolaOra.'
      )
      return
    }
    setEmbedKind(p.kind)
    setWorkspaceId(p.workspaceId)
    if (p.primaryColor) setPrimaryColor(p.primaryColor)
    if (p.position) setPosition(p.position)
    if (p.title) setTitle(p.title)
    if (p.greeting) setGreeting(p.greeting)
    if (p.suggestions?.length) {
      setSuggestionsEnabled(true)
      setSuggestionsText(p.suggestions.join('\n'))
    } else if (p.suggestionsEnabled === true) {
      setSuggestionsEnabled(true)
    } else if (p.suggestionsEnabled === false) {
      setSuggestionsEnabled(false)
      setSuggestionsText('')
    }
    if (p.kind === 'IFRAME') {
      if (p.iframeWidth != null) setIframeW(String(p.iframeWidth))
      if (p.iframeHeight != null) setIframeH(String(p.iframeHeight))
    }
    setEmbedPaste('')
    setShowEmbedPaste(false)
    toast.success('Fields filled from pasted embed')
  }

  if (!open) return null

  /** Matches HolaOraEmbed: title/greeting use encodeURIComponent on data-* (plain text in fields, not pre-encoded). */
  const previewScript = (() => {
    const ws = workspaceId.trim()
    if (!ws) return ''
    const lines = [`<script src="${HOLAORA_EMBED_SCRIPT_DEFAULT}"`, `  data-workspace="${ws}"`]
    if (primaryColor.trim()) lines.push(`  data-primary-color="${primaryColor.trim()}"`)
    if (position.trim()) lines.push(`  data-position="${position.trim()}"`)
    if (title.trim()) lines.push(`  data-title="${encodeURIComponent(title.trim())}"`)
    if (greeting.trim()) lines.push(`  data-greeting="${encodeURIComponent(greeting.trim())}"`)
    if (suggestionsEnabled) {
      lines.push(`  data-suggestions-enabled="true"`)
      const list = suggestionsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      lines.push(`  data-suggestions="${encodeURIComponent(JSON.stringify(list))}"`)
    }
    return `${lines.join('\n')}\n></script>`
  })()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">WaveOrder website — HolaOra</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <p className="text-gray-600">
            Controls the Hola chat on <strong>waveorder.app</strong> (marketing homepage). Separate from each
            merchant&apos;s storefront embed.
          </p>

          {loading ? (
            <div className="flex justify-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 font-medium text-gray-900">
                <input
                  type="checkbox"
                  checked={embedEnabled}
                  onChange={(e) => setEmbedEnabled(e.target.checked)}
                />
                Show Hola chat on WaveOrder homepage
              </label>

              <div>
                <span className="font-medium text-gray-900 block mb-2">Integration</span>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="wo-hola-kind"
                      checked={embedKind === 'SCRIPT'}
                      onChange={() => setEmbedKind('SCRIPT')}
                    />
                    Script (recommended)
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="wo-hola-kind"
                      checked={embedKind === 'IFRAME'}
                      onChange={() => setEmbedKind('IFRAME')}
                    />
                    Iframe
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmbedPaste((v) => !v)
                    setEmbedPasteErr(null)
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-teal-700 w-full text-left"
                >
                  <Code className="w-4 h-4 shrink-0" />
                  Paste embed from HolaOra (script or iframe)
                  {showEmbedPaste ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                </button>
                {showEmbedPaste && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">
                      Paste the full <strong>script</strong> or <strong>iframe</strong> from your Hola dashboard. We read{' '}
                      <code className="bg-gray-100 px-0.5">data-title</code>, <code className="bg-gray-100 px-0.5">data-greeting</code>, and{' '}
                      <code className="bg-gray-100 px-0.5">data-suggestions*</code> (decoded). Click <strong>Apply to fields</strong> so the preview matches.
                    </p>
                    <textarea
                      value={embedPaste}
                      onChange={(e) => setEmbedPaste(e.target.value)}
                      rows={6}
                      placeholder='<script src="https://holaora.com/embed/chat.js" ...> or <iframe ...>'
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

              <div>
                <label className="block font-medium text-gray-700 mb-1">Hola workspace ID</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                  placeholder="56e25486-18e7-49ae-8db0-10725f151a6f"
                />
              </div>

              {embedKind === 'SCRIPT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 mb-1">Primary color</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#FF6B35"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Position</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="bottom-right"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 mb-1">Title</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="WaveOrder Help"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Plain text — the preview adds URL encoding for <code className="bg-gray-100 px-0.5">data-title</code> like Hola&apos;s docs.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-700 mb-1">Greeting</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      placeholder="Hi! Ask us anything about WaveOrder..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Don&apos;t paste <code className="bg-gray-100 px-0.5">%20</code> sequences — type the sentence normally.
                    </p>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      id="wo-hola-suggestions"
                      type="checkbox"
                      checked={suggestionsEnabled}
                      onChange={(e) => setSuggestionsEnabled(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="wo-hola-suggestions" className="text-gray-700 font-medium">
                      Quick suggestions (chips)
                    </label>
                  </div>
                  {suggestionsEnabled && (
                    <div className="sm:col-span-2">
                      <label className="block text-gray-700 mb-1">Suggestions (one per line)</label>
                      <textarea
                        value={suggestionsText}
                        onChange={(e) => setSuggestionsText(e.target.value)}
                        rows={5}
                        placeholder={'Pricing and plans\nWhat is WaveOrder?'}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {embedKind === 'IFRAME' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      min={200}
                      max={1200}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      value={iframeW}
                      onChange={(e) => setIframeW(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      min={200}
                      max={1200}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      value={iframeH}
                      onChange={(e) => setIframeH(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs text-gray-500">
                  Optional: HolaOra <strong>web dashboard</strong> login (encrypted). For WaveOrder support only —
                  not shown on the public site.
                </p>
                <label className="flex items-center gap-2 font-medium text-gray-900">
                  <input
                    type="checkbox"
                    checked={savePortalLogin}
                    onChange={(e) => setSavePortalLogin(e.target.checked)}
                  />
                  Save portal login on file
                </label>
                {savePortalLogin && (
                  <>
                    <div>
                      <label className="block text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        autoComplete="off"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                        value={portalEmail}
                        onChange={(e) => setPortalEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">Password</label>
                      <div className="flex gap-2">
                        <input
                          type={showPw ? 'text' : 'password'}
                          autoComplete="new-password"
                          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2"
                          value={portalPassword}
                          onChange={(e) => setPortalPassword(e.target.value)}
                          placeholder={hadPasswordSaved ? 'Leave blank to keep saved' : ''}
                        />
                        <button
                          type="button"
                          disabled={revealing}
                          onClick={revealPassword}
                          className="shrink-0 p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          {revealing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : showPw ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {previewScript && embedKind === 'SCRIPT' && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-teal-700 font-medium">Preview script tag</summary>
                  <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto whitespace-pre-wrap">
                    {previewScript}
                  </pre>
                </details>
              )}
              {workspaceId.trim() && embedKind === 'IFRAME' && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-teal-700 font-medium">Preview iframe URL</summary>
                  <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto">
                    {`${HOLAORA_EMBED_IFRAME_BASE}?workspace=${encodeURIComponent(workspaceId.trim())}`}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-5 py-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || saving}
            onClick={save}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
