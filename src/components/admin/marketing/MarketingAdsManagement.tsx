// components/admin/marketing/MarketingAdsManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Share2, Copy, Check, ExternalLink, Target, Code, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'

interface MarketingAdsManagementProps {
  businessId: string
}

interface Business {
  id: string
  name: string
  slug: string
  metaPixelId?: string | null
  metaPixelEnabled?: boolean
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveorder.app'

export default function MarketingAdsManagement({ businessId }: MarketingAdsManagementProps) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [metaPixelId, setMetaPixelId] = useState('')
  const [copied, setCopied] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showSnippetExtractor, setShowSnippetExtractor] = useState(false)
  const [snippetPaste, setSnippetPaste] = useState('')
  const [extractError, setExtractError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusiness(data.business)
          setMetaPixelId(data.business?.metaPixelId || '')
        }
      } catch (error) {
        console.error('Error fetching business:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBusiness()
  }, [businessId])

  const storeUrl = business ? `${BASE_URL}/${business.slug}` : ''
  const exampleUrlWithUtm = business
    ? `${storeUrl}?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale&utm_content=product_ad`
    : ''

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  /** Extract Pixel ID from Meta's full snippet (fbq('init', 'ID') or id=ID in noscript img) */
  const extractPixelIdFromSnippet = (text: string): string | null => {
    if (!text || !text.trim()) return null
    const s = text.trim()
    // Match fbq('init', '1234567890123456') or fbq("init", "1234567890123456")
    const fbqMatch = s.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"]?(\d{15,20})['"]?\s*\)/)
    if (fbqMatch) return fbqMatch[1]
    // Match id=1234567890123456 in facebook.com/tr URL
    const idMatch = s.match(/facebook\.com\/tr\?[^"'\s]*id=(\d{15,20})/)
    if (idMatch) return idMatch[1]
    // Fallback: any long digit sequence that looks like a Pixel ID (15-20 digits)
    const fallback = s.match(/\b(\d{15,20})\b/)
    return fallback ? fallback[1] : null
  }

  const handleExtractAndApply = () => {
    setExtractError(null)
    const id = extractPixelIdFromSnippet(snippetPaste)
    if (id) {
      setMetaPixelId(id)
      setSnippetPaste('')
      setShowSnippetExtractor(false)
    } else {
      setExtractError('Could not find a Pixel ID in the pasted code. Make sure you pasted the full Meta Pixel snippet from Events Manager.')
    }
  }

  const handleSavePixel = async () => {
    setSaving(true)
    setSuccessMessage(null)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/marketing/ads`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metaPixelId: metaPixelId.trim() || null })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }
      setSuccessMessage('Meta Pixel ID saved successfully.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    )
  }

  if (business && !business.metaPixelEnabled) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Ads</h1>
        <p className="text-gray-600">
          The Meta Pixel (Ads) feature is not enabled for your store. Contact your administrator to enable it.
        </p>
        <Link
          href={`/admin/stores/${businessId}/marketing`}
          className="inline-block mt-4 text-teal-600 hover:text-teal-700 font-medium"
        >
          ← Back to Marketing
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
        <p className="text-gray-600 mt-1">
          Track campaigns and configure your Meta Pixel for Facebook & Instagram ads
        </p>
      </div>

      {/* Section 1: Share store with UTM params for campaign tracking */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-2">
          <Share2 className="w-5 h-5 text-teal-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Share your store with campaign parameters</h2>
        </div>
        <p className="text-gray-600 mb-4">
          When sharing your store link in Meta ads (or any campaign), add UTM parameters so you can track which campaigns drive traffic and conversions. Meta Pixel will receive these parameters automatically.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Example URL with UTM parameters:</p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm text-gray-800 font-mono break-all flex-1 min-w-0">
              {exampleUrlWithUtm}
            </code>
            <button
              onClick={() => copyToClipboard(exampleUrlWithUtm)}
              className="flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Common UTM parameters:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="bg-gray-100 px-1 rounded">utm_source</code> – e.g. facebook, instagram</li>
            <li><code className="bg-gray-100 px-1 rounded">utm_medium</code> – e.g. cpc, social</li>
            <li><code className="bg-gray-100 px-1 rounded">utm_campaign</code> – e.g. summer_sale</li>
            <li><code className="bg-gray-100 px-1 rounded">utm_content</code> – ad variant or placement</li>
          </ul>
        </div>
        <a
          href="https://developers.facebook.com/docs/meta-pixel/get-started/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center mt-4 text-sm text-teal-600 hover:text-teal-700"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Meta Pixel – Get started
        </a>
      </div>

      {/* Section 2: Configure Meta Pixel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-2">
          <Target className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Configure Meta Pixel</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Enter your Meta Pixel ID to enable tracking on your storefront. WaveOrder injects the base code automatically – you only need the ID (e.g. 2116713132419922), not the full script. The pixel fires PageView on every page load. Get your Pixel ID from Meta Events Manager.
        </p>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Snippet extractor – paste full Meta code, we extract the ID */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setShowSnippetExtractor(!showSnippetExtractor)
                setExtractError(null)
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left text-sm font-medium text-gray-700"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Have the full Meta Pixel code? Paste it here and we&apos;ll extract the ID for you
              </span>
              {showSnippetExtractor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showSnippetExtractor && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <p className="text-sm text-gray-600 mb-2">
                  Paste the full Meta Pixel snippet from Events Manager (the code between &lt;script&gt; and &lt;/script&gt;, or the entire block). We&apos;ll extract your Pixel ID and apply it.
                </p>
                <textarea
                  value={snippetPaste}
                  onChange={(e) => {
                    setSnippetPaste(e.target.value)
                    setExtractError(null)
                  }}
                  placeholder={`Paste your Meta Pixel code here, e.g.:\nfbq('init', '2116713132419922');\nfbq('track', 'PageView');`}
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-teal-500 focus:ring-teal-500"
                />
                {extractError && (
                  <p className="mt-2 text-sm text-red-600">{extractError}</p>
                )}
                <button
                  type="button"
                  onClick={handleExtractAndApply}
                  disabled={!snippetPaste.trim()}
                  className="mt-3 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract Pixel ID & Apply
                </button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="metaPixelId" className="block text-sm font-medium text-gray-700 mb-1">
              Meta Pixel ID
            </label>
            <input
              id="metaPixelId"
              type="text"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder="e.g. 1234567890123456"
              className="block w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to disable the pixel. Or use the helper above to paste the full Meta snippet and extract it.
            </p>
          </div>
          <button
            onClick={handleSavePixel}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Code className="w-4 h-4 mr-2" />
                Save Pixel ID
              </>
            )}
          </button>
        </div>

        <a
          href="https://developers.facebook.com/docs/meta-pixel/get-started/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center mt-4 text-sm text-teal-600 hover:text-teal-700"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Meta Pixel – Get started
        </a>
      </div>
    </div>
  )
}
