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
import { signIn } from 'next-auth/react'

interface StoreReadyStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
  setupToken?: string | null
}

// Language-specific content
const storeContent = {
  en: {
    title: "Your store is ready to share!",
    subtitle: "Start taking orders right away",
    storeInfo: "Store Information",
    storeUrl: "Store URL",
    copyUrl: "Copy URL",
    copied: "✓ Copied to clipboard!",
    viewStore: "View My Store",
    shareStore: "Share Your Store",
    addToInstagram: "Add to Instagram Bio",
    instagramDesc: "Copy link for your Instagram bio",
    shareOnFacebook: "Share on Facebook",
    facebookDesc: "Post to your Facebook page",
    shareOnTwitter: "Share on Twitter",
    twitterDesc: "Tweet your store link",
    nextSteps: "Next Steps",
    storePreview: "Store Preview",
    previewDesc: "This is how customers will see your store",
    welcomeMessage: "Welcome to our online store! Browse our menu and order directly through WhatsApp.",
    categories: "Categories",
    sampleCategories: "Main Dishes, Beverages, Desserts",
    orderOptions: "Order Options",
    orderWhatsApp: "Order on WhatsApp",
    back: "Back",
    enterDashboard: "Enter Dashboard",
    loading: "Loading...",
    setupTips: [
      'Add high-quality photos to your products',
      'Set up delivery zones if you offer delivery',
      'Create categories to organize your menu',
      'Test your ordering flow before going live',
      'Share your store link on social media'
    ]
  },
  sq: {
    title: "Dyqani juaj është gati për ndarje!",
    subtitle: "Filloni të merrni porosi menjëherë",
    storeInfo: "Informacioni i Dyqanit",
    storeUrl: "URL e Dyqanit",
    copyUrl: "Kopjo URL",
    copied: "✓ U kopjua në clipboard!",
    viewStore: "Shiko Dyqanin Tim",
    shareStore: "Ndaj Dyqanin Tënd",
    addToInstagram: "Shto në Bio të Instagram",
    instagramDesc: "Kopjo linkun për bio-n e Instagram",
    shareOnFacebook: "Ndaj në Facebook",
    facebookDesc: "Posto në faqen tënde të Facebook",
    shareOnTwitter: "Ndaj në Twitter", 
    twitterDesc: "Tweet linkun e dyqanit tënd",
    nextSteps: "Hapat e Ardhshëm",
    storePreview: "Pamja e Dyqanit",
    previewDesc: "Kështu do ta shohin klientët dyqanin tuaj",
    welcomeMessage: "Mirë se vini në dyqanin tonë online! Shfletoni menunë tonë dhe porosisni direkt nëpërmjet WhatsApp.",
    categories: "Kategoritë",
    sampleCategories: "Pjatat Kryesore, Pijet, Ëmbëlsirat",
    orderOptions: "Opsionet e Porositjes",
    orderWhatsApp: "Porosit në WhatsApp",
    back: "Prapa",
    enterDashboard: "Hyr në Dashboard",
    loading: "Duke u ngarkuar...",
    setupTips: [
      'Shtoni foto me cilësi të lartë në produktet tuaja',
      'Krijoni zona dorëzimi nëse ofroni dorëzim',
      'Krijoni kategori për të organizuar menunë tuaj',
      'Testoni rrjedhën e porosive para se të shkoni live',
      'Ndani linkun e dyqanit tuaj në rrjetet sociale'
    ]
  }
}

// Business type translations
const businessTypeTranslations = {
  en: {
    RESTAURANT: "Restaurant",
    CAFE: "Cafe", 
    RETAIL: "Retail Store",
    GROCERY: "Grocery Store",
    JEWELRY: "Jewelry Store",
    FLORIST: "Florist",
    OTHER: "Business"
  },
  sq: {
    RESTAURANT: "Restorant",
    CAFE: "Kafene",
    RETAIL: "Dyqan",
    GROCERY: "Ushqimore",
    JEWELRY: "Stolitë",
    FLORIST: "Lulishte",
    OTHER: "Biznes"
  }
}

export default function StoreReadyStep({ data, onComplete, onBack, setupToken }: StoreReadyStepProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const selectedLanguage = data.language || 'en'
  const content = storeContent[selectedLanguage as keyof typeof storeContent]
  const businessTypes = businessTypeTranslations[selectedLanguage as keyof typeof businessTypeTranslations]

  const storeUrl = `https://waveorder.app/${data.storeSlug}`

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
    const text = selectedLanguage === 'sq' 
      ? `Shikoni dyqanin tim online: ${data.businessName}`
      : `Check out my online store: ${data.businessName}`
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
    
    try {
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken })
      })
  
      if (response.ok) {
        const data = await response.json()
        
        // Auto-login for token users
        if (data.autoLogin) {
          await signIn('credentials', { 
            email: data.email,
            redirect: false 
          })
        }
        
        // Redirect to dashboard
        window.location.href = data.redirectUrl || `/admin/stores/${data.business.slug}/dashboard`
      } else {
        console.error('Failed to complete setup')
      }
    } catch (error) {
      console.error('Error completing setup:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get business type display name
  const getBusinessTypeDisplay = () => {
    const businessType = data.businessType || 'OTHER'
    return businessTypes[businessType as keyof typeof businessTypes] || businessTypes.OTHER
  }

  // Get delivery methods display
  const getDeliveryMethodsDisplay = () => {
    const methods = []
    if (data.deliveryMethods?.delivery) {
      methods.push(selectedLanguage === 'sq' ? 'Dorëzim' : 'Delivery')
    }
    if (data.deliveryMethods?.pickup) {
      methods.push(selectedLanguage === 'sq' ? 'Marrje' : 'Pickup')
    }
    if (data.deliveryMethods?.dineIn) {
      methods.push(selectedLanguage === 'sq' ? 'Në vend' : 'Dine-in')
    }
    return methods.join(', ') || (selectedLanguage === 'sq' ? 'Marrje' : 'Pickup')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          {content.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-2">
          {content.subtitle}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8">
        {/* Store Information */}
        <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.storeInfo}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">{content.storeUrl}</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1 px-3 py-3 sm:py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs sm:text-sm break-all">
                    {storeUrl}
                  </div>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center sm:justify-start min-w-0"
                  >
                    <Copy className="w-4 h-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">{content.copyUrl}</span>
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600 mt-2">{content.copied}</p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleViewStore}
                  className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {content.viewStore}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Share2 className="w-5 h-5 mr-2 text-teal-600" />
              {content.shareStore}
            </h3>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => shareOnSocial('instagram')}
                className="w-full flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Instagram className="w-5 h-5 mr-3 text-pink-600 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{content.addToInstagram}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{content.instagramDesc}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => shareOnSocial('facebook')}
                className="w-full flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Facebook className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{content.shareOnFacebook}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{content.facebookDesc}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => shareOnSocial('twitter')}
                className="w-full flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Twitter className="w-5 h-5 mr-3 text-blue-400 flex-shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{content.shareOnTwitter}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{content.twitterDesc}</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.nextSteps}</h3>
            <ul className="space-y-2 sm:space-y-3">
              {content.setupTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-600">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Live Preview */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-8">
          <div className="bg-gray-100 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {content.storePreview}
            </h3>
            
            <div className="bg-white rounded-lg border border-gray-200 max-w-sm mx-auto overflow-hidden">
              {/* Mobile Header */}
              <div className="bg-teal-600 text-white p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm sm:text-lg truncate">{data.businessName}</div>
                    <div className="text-xs sm:text-sm text-teal-100 truncate">
                      {getBusinessTypeDisplay()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    {content.welcomeMessage}
                  </p>
                </div>

                {/* Sample Categories */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="font-medium text-gray-900 text-sm">{content.categories}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">{content.sampleCategories}</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                    <div className="font-medium text-gray-900 text-sm">{content.orderOptions}</div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {getDeliveryMethodsDisplay()}
                    </div>
                  </div>

                  <button className="w-full bg-green-600 text-white py-2 sm:py-3 rounded-lg font-medium text-sm">
                    {content.orderWhatsApp}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">{content.storePreview}</p>
              <p className="text-xs text-gray-500">{content.previewDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {content.back}
        </button>
        
        <button
          onClick={handleEnterDashboard}
          disabled={loading}
          className="flex items-center justify-center px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
        >
          {loading ? content.loading : content.enterDashboard}
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  )
}