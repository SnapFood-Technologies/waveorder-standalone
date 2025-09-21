// components/admin/marketing/MarketingManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Share2, Copy, Download, QrCode, ExternalLink, Check } from 'lucide-react'
import QRCode from 'qrcode'

interface MarketingComponentProps {
  businessId: string // Changed from params object to direct businessId
}

interface Business {
  id: string
  name: string
  slug: string
  description?: string
}

export default function MarketingComponent({ businessId }: MarketingComponentProps) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  const storeUrl = business ? `https://waveorder.app/${business.slug}` : ''
  const embedCode = `<iframe src="${storeUrl}" width="100%" height="600" frameborder="0"></iframe>`

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`) // Use businessId directly
        if (response.ok) {
          const data = await response.json()
          setBusiness(data.business)
        }
      } catch (error) {
        console.error('Error fetching business:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId]) // Fixed dependency array

  useEffect(() => {
    const generateQRCode = async () => {
      if (storeUrl) {
        try {
          const qrDataUrl = await QRCode.toDataURL(storeUrl, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          setQrCodeUrl(qrDataUrl)
        } catch (error) {
          console.error('Error generating QR code:', error)
        }
      }
    }

    generateQRCode()
  }, [storeUrl])

  const copyToClipboard = async (text: string, type: 'url' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedEmbed(true)
        setTimeout(() => setCopiedEmbed(false), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `${business?.slug || 'store'}-qr-code.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const shareOnSocial = (platform: string) => {
    const text = `Check out ${business?.name || 'our store'}: ${storeUrl}`
    let shareUrl = ''

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`
        break
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we copy the URL
        copyToClipboard(storeUrl, 'url')
        return
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-600 mt-1">
          Share your store link and promote your business across different platforms
        </p>
      </div>

      {/* Store Sharing Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-2">
          <Share2 className="w-5 h-5 text-teal-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Share your store link</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Make your store visible on your social media and website
        </p>

        {/* Store URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your store URL
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg p-3">
              <ExternalLink className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-900 font-mono text-sm">{storeUrl}</span>
            </div>
            <button
              onClick={() => copyToClipboard(storeUrl, 'url')}
              className="flex items-center px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              {copiedUrl ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copiedUrl ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Social Media Sharing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => shareOnSocial('instagram')}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-pink-50 hover:border-pink-200 transition-colors group"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" className="fill-gradient-to-br from-purple-600 via-pink-600 to-orange-500" />
              <circle cx="12" cy="12" r="4" className="stroke-white stroke-2 fill-none" />
              <circle cx="18" cy="6" r="1.5" className="fill-white" />
            </svg>
            <span className="text-gray-700 group-hover:text-pink-700">Add link in bio</span>
            <ExternalLink className="w-4 h-4 ml-2 text-gray-400 group-hover:text-pink-500" />
          </button>

          <button
            onClick={() => shareOnSocial('facebook')}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="4" className="fill-blue-600" />
              <path d="M16.5 8.25h-2.25v-1.5c0-.621.504-1.125 1.125-1.125h1.125V3.75h-2.25c-1.864 0-3.375 1.511-3.375 3.375v1.125H9v2.25h1.875V19.5h2.25v-9h2.25l.375-2.25z" className="fill-white" />
            </svg>
            <span className="text-gray-700 group-hover:text-blue-700">Share on Facebook</span>
            <ExternalLink className="w-4 h-4 ml-2 text-gray-400 group-hover:text-blue-500" />
          </button>

          <button
            onClick={() => shareOnSocial('whatsapp')}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors group"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="4" className="fill-green-500" />
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.59 20.15 9.15 19.75 7.89 19L7.55 18.8L4.42 19.64L5.26 16.61L5.05 16.26C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.49 3.69 12.04 3.69C14.23 3.69 16.3 4.53 17.87 6.09C19.44 7.66 20.28 9.72 20.28 11.91C20.28 16.46 16.6 20.15 12.05 20.15ZM16.57 13.99C16.32 13.87 15.26 13.35 15.05 13.27C14.84 13.19 14.69 13.15 14.54 13.4C14.39 13.65 13.96 14.15 13.83 14.3C13.7 14.45 13.57 14.47 13.32 14.35C13.07 14.23 12.26 13.94 11.33 13.11C10.62 12.46 10.11 11.66 9.98 11.41C9.85 11.16 9.97 11.03 10.08 10.92C10.18 10.82 10.3 10.67 10.42 10.54C10.54 10.41 10.58 10.32 10.66 10.17C10.74 10.02 10.7 9.87 10.64 9.75C10.58 9.63 10.11 8.57 9.92 8.07C9.74 7.58 9.56 7.64 9.42 7.64C9.29 7.64 9.14 7.63 8.99 7.63C8.84 7.63 8.59 7.69 8.38 7.94C8.17 8.19 7.61 8.71 7.61 9.77C7.61 10.83 8.39 11.86 8.51 12.01C8.63 12.16 10.11 14.44 12.4 15.43C12.92 15.64 13.33 15.78 13.65 15.88C14.18 16.04 14.66 16.02 15.05 15.95C15.48 15.87 16.32 15.44 16.51 14.96C16.7 14.48 16.7 14.08 16.64 13.99H16.57Z" className="fill-white" />
            </svg>
            <span className="text-gray-700 group-hover:text-green-700">Share on WhatsApp</span>
            <ExternalLink className="w-4 h-4 ml-2 text-gray-400 group-hover:text-green-500" />
          </button>

          <button
            onClick={() => shareOnSocial('twitter')}
            className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-sky-50 hover:border-sky-200 transition-colors group"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="4" className="fill-black" />
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" className="fill-white" />
            </svg>
            <span className="text-gray-700 group-hover:text-sky-700">Share on X</span>
            <ExternalLink className="w-4 h-4 ml-2 text-gray-400 group-hover:text-sky-500" />
          </button>
        </div>
      </div>

      {/* QR Code and Embed Code */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-2">
            <QrCode className="w-5 h-5 text-teal-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Print or display this QR code for customers to easily access your store
          </p>
          
          <div className="flex flex-col items-center">
            {qrCodeUrl && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                <img src={qrCodeUrl} alt="Store QR Code" className="w-48 h-48" />
              </div>
            )}
            <button
              onClick={downloadQRCode}
              disabled={!qrCodeUrl}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </button>
          </div>
        </div>

        {/* Embed Code Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-2">
            <ExternalLink className="w-5 h-5 text-teal-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Embed Code</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Add this code to your website to embed your store directly
          </p>
          
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <code className="text-sm text-gray-800 font-mono break-all">
                {embedCode}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(embedCode, 'embed')}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {copiedEmbed ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copiedEmbed ? 'Copied!' : 'Copy Embed Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}