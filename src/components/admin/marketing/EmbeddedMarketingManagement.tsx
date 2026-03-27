'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Code2, Copy, Check, ExternalLink, Info } from 'lucide-react'
import { useBusiness } from '@/contexts/BusinessContext'
import { buildWebsiteEmbedOrderUrl, getPublicSiteBaseUrl } from '@/lib/website-embed-url'
import { canViewAnalytics } from '@/lib/permissions'

interface Props {
  businessId: string
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default function EmbeddedMarketingManagement({ businessId }: Props) {
  const router = useRouter()
  const { subscription, userRole } = useBusiness()

  const [loading, setLoading] = useState(true)
  const [embedAllowed, setEmbedAllowed] = useState(false)
  const [slug, setSlug] = useState('')

  const [utmSource, setUtmSource] = useState('')
  const [utmMedium, setUtmMedium] = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')

  const [buttonLabel, setButtonLabel] = useState('Order online')
  const [bgColor, setBgColor] = useState('#0d9488')
  const [textColor, setTextColor] = useState('#ffffff')
  const [rounded, setRounded] = useState(true)
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')

  const [copied, setCopied] = useState<'url' | 'html' | 'script' | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/stores/${businessId}`)
        if (!res.ok) {
          router.replace(`/admin/stores/${businessId}/marketing`)
          return
        }
        const data = await res.json()
        const enabled = data.business?.websiteEmbedEnabled === true
        const s = data.business?.slug as string | undefined
        if (!enabled || !s) {
          router.replace(`/admin/stores/${businessId}/marketing`)
          return
        }
        setEmbedAllowed(true)
        setSlug(s)
      } catch {
        router.replace(`/admin/stores/${businessId}/marketing`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [businessId, router])

  const baseUrl = getPublicSiteBaseUrl()

  const orderUrl = useMemo(
    () =>
      slug
        ? buildWebsiteEmbedOrderUrl(baseUrl, slug, {
            source: utmSource,
            medium: utmMedium,
            campaign: utmCampaign,
          })
        : '',
    [baseUrl, slug, utmSource, utmMedium, utmCampaign]
  )

  const htmlSnippet = useMemo(() => {
    const escUrl = escapeHtmlAttr(orderUrl)
    const escLabel = escapeHtmlText(buttonLabel)
    return `<a href="${escUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 18px;background:${bgColor};color:${textColor};font-family:sans-serif;font-weight:600;text-decoration:none;border-radius:${rounded ? '9999px' : '4px'}">${escLabel}</a>`
  }, [orderUrl, buttonLabel, bgColor, textColor, rounded])

  const scriptSnippet = useMemo(() => {
    const src = `${baseUrl}/embed.js`
    const escOrder = escapeHtmlAttr(orderUrl)
    const escLabel = escapeHtmlAttr(buttonLabel)
    const escBg = escapeHtmlAttr(bgColor)
    const escFg = escapeHtmlAttr(textColor)
    return `<script src="${src}" async data-order-url="${escOrder}" data-label="${escLabel}" data-bg="${escBg}" data-color="${escFg}" data-rounded="${rounded ? '1' : '0'}" data-size="${size}"></script>`
  }, [baseUrl, orderUrl, buttonLabel, bgColor, textColor, rounded, size])

  const copy = async (text: string, kind: 'url' | 'html' | 'script') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* ignore */
    }
  }

  const proOrBusiness = subscription.plan === 'PRO' || subscription.plan === 'BUSINESS'
  const showAnalyticsNote = proOrBusiness && canViewAnalytics(userRole)

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (!embedAllowed) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href={`/admin/stores/${businessId}/marketing`} className="hover:text-teal-700">
            Marketing
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Embedded</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Code2 className="w-7 h-7 text-teal-600" />
          Website embed
        </h1>
        <p className="text-gray-600 mt-1">
          Build a tagged order link and embed a floating button or plain link on your site. Traffic is tagged with{' '}
          <code className="bg-gray-100 px-1 rounded text-sm">embed_waveorder=1</code> (not your UTM source).
        </p>
      </div>

      {showAnalyticsNote ? (
        <div className="rounded-lg border border-teal-100 bg-teal-50/80 p-4 text-sm text-teal-900">
          <p className="font-medium flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            Analytics
          </p>
          <p className="mt-1 text-teal-800/90">
            Visits from these links appear in your analytics with the embed flag. Use <strong>Analytics</strong> in the admin
            panel to review traffic and conversions (PRO or Business plan).
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Analytics</p>
          <p className="mt-1">
            {proOrBusiness
              ? 'Your role does not include analytics access. Ask an owner or manager to review embed performance in Analytics.'
              : 'Upgrade to PRO or Business to unlock Analytics and see embed attribution alongside your other traffic.'}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">UTM parameters (optional)</h2>
        <p className="text-sm text-gray-600 -mt-4">
          These are your own campaign tags (e.g. <code className="bg-gray-100 px-1 rounded">utm_source</code>). They are
          separate from the WaveOrder embed fingerprint.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">utm_source</label>
            <input
              type="text"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. website"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">utm_medium</label>
            <input
              type="text"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. embed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">utm_campaign</label>
            <input
              type="text"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. summer"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Button appearance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as 'sm' | 'md' | 'lg')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
            <input
              type="text"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text color</label>
            <input
              type="text"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={rounded} onChange={(e) => setRounded(e.target.checked)} className="rounded" />
              <span className="text-sm font-medium text-gray-800">Rounded pill (off = square corners)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Order link</h2>
        <p className="text-sm text-gray-600">Share this URL anywhere, or use it in the snippets below.</p>
        <div className="flex flex-wrap items-stretch gap-2">
          <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm break-all">
            {orderUrl}
          </div>
          <button
            type="button"
            onClick={() => copy(orderUrl, 'url')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 shrink-0"
          >
            {copied === 'url' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">HTML link</h2>
        <p className="text-sm text-gray-600">Paste into your site HTML where you want an inline button.</p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">
          {htmlSnippet}
        </pre>
        <button
          type="button"
          onClick={() => copy(htmlSnippet, 'html')}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 inline-flex items-center gap-2"
        >
          {copied === 'html' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy HTML
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Floating button (script)</h2>
        <p className="text-sm text-gray-600">
          Add this script before <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> on your site. It loads{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">{baseUrl}/embed.js</code> and shows a fixed button.
        </p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">
          {scriptSnippet}
        </pre>
        <button
          type="button"
          onClick={() => copy(scriptSnippet, 'script')}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 inline-flex items-center gap-2"
        >
          {copied === 'script' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          Copy script
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="font-medium text-gray-900 mb-4">Quick guide</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Copy the order link or one of the snippets above.</li>
          <li>
            Ensure your storefront is live at{' '}
            <a href={`${baseUrl}/${slug}`} target="_blank" rel="noopener noreferrer" className="text-teal-700 inline-flex items-center gap-1">
              {baseUrl}/{slug}
              <ExternalLink className="w-3 h-3" />
            </a>
            .
          </li>
          <li>
            For the floating button, the script must be able to load from WaveOrder&apos;s domain (your site may need to allow
            third-party scripts).
          </li>
        </ol>
      </div>
    </div>
  )
}
