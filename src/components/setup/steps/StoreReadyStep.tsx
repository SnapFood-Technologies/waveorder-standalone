'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  QrCode, 
  Instagram, 
  Facebook, 
  Twitter,
  Share2,
  Smartphone,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface StoreReadyStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

export default function StoreReadyStep({ data, onComplete, onBack }: StoreReadyStepProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const storeUrl = `https://waveorder.com/${data.storeSlug}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareOnSocial = (platform: string) => {
    const text = `Check out my online store: ${data.businessName}`
    const url = storeUrl
    
    const shareUrls = {
      instagram: `https://www.instagram.com/`, // Instagram doesn't have direct sharing URL
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    }
    
    if (platform === 'instagram') {
      // For Instagram, we just copy the URL since they don't have direct sharing
      copyToClipboard()
    } else {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400')
    }
  }

  const handleViewStore = () => {
    window.open(storeUrl, '_blank')
  }

  const handleEnterDashboard = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ setupWizardCompleted: true })
    setLoading(false)
  }

  const setupTips = [
    'Add high-quality photos to your products',
    'Set up delivery zones if you offer delivery',
    'Create categories to organize your menu',
    'Test your ordering flow before going live',
    'Share your store link on social media'
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Your store is ready to share!
        </h1>
        <p className="text-lg text-gray-600">
          Start taking orders right away
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Store Information */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Store URL</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                    {storeUrl}
                  </div>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600 mt-1">✓ Copied to clipboard!</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleViewStore}
                  className="flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View My Store
                </button>
                
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Share2 className="w-5 h-5 mr-2 text-teal-600" />
              Share Your Store
            </h3>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => shareOnSocial('instagram')}
                className="w-full flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Instagram className="w-5 h-5 mr-3 text-pink-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Add to Instagram Bio</div>
                  <div className="text-sm text-gray-500">Copy link for your Instagram bio</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => shareOnSocial('facebook')}
                className="w-full flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Facebook className="w-5 h-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Share on Facebook</div>
                  <div className="text-sm text-gray-500">Post to your Facebook page</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => shareOnSocial('twitter')}
                className="w-full flex items-center px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Twitter className="w-5 h-5 mr-3 text-blue-400" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Share on Twitter</div>
                  <div className="text-sm text-gray-500">Tweet your store link</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
            <ul className="space-y-2">
              {setupTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-teal-600 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-8">
          <div className="bg-gray-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Store Preview
            </h3>
            
            <div className="bg-white rounded-lg border border-gray-200 max-w-sm mx-auto overflow-hidden">
              {/* Mobile Header */}
              <div className="bg-teal-600 text-white p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{data.businessName}</div>
                    <div className="text-sm text-teal-100">
                      {data.businessType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Welcome to our online store! Browse our menu and order directly through WhatsApp.
                  </p>
                </div>

                {/* Sample Categories */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">Categories</div>
                    <div className="text-sm text-gray-500 mt-1">Main Dishes, Beverages, Desserts</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-medium text-gray-900">Order Options</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {[
                        data.deliveryMethods?.delivery && 'Delivery',
                        data.deliveryMethods?.pickup && 'Pickup',
                        data.deliveryMethods?.dineIn && 'Dine-in'
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>

                  <button className="w-full bg-green-600 text-white py-3 rounded-lg font-medium">
                    Order on WhatsApp
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">Mobile Store Preview</p>
              <p className="text-xs text-gray-500">This is how customers will see your store</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        
        <button
          onClick={handleEnterDashboard}
          disabled={loading}
          className="flex items-center px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading...' : 'Enter Dashboard'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  )
}