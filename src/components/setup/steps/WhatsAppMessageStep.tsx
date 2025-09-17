'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, MessageSquare, Smartphone, Copy, ExternalLink } from 'lucide-react'

interface WhatsAppMessageStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

export default function WhatsAppMessageStep({ data, onComplete, onBack }: WhatsAppMessageStepProps) {
  const [settings, setSettings] = useState(data.whatsappSettings || {
    orderNumberFormat: 'WO-{number}',
    greetingMessage: `Hello! Welcome to ${data.businessName || 'Your Business'}.\nYou can browse our menu at waveorder.com/${data.storeSlug || 'your-store'}\nLet us know if you need help!`,
    messageTemplate: ''
  })
  const [loading, setLoading] = useState(false)

  const orderNumberFormats = [
    { value: 'WO-{number}', label: 'WO-123' },
    { value: 'ORD-{number}', label: 'ORD-123' },
    { value: '#{number}', label: '#123' }
  ]

  const updateSetting = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const generateSampleOrder = () => {
    const orderNumber = settings.orderNumberFormat.replace('{number}', '123')
    const businessName = data.businessName || 'Your Business'
    const storeUrl = `waveorder.com/${data.storeSlug || 'your-store'}`
    const deliveryFee = data.deliveryMethods?.deliveryFee || 3.00

    return `Order ${orderNumber}

2x Margherita Pizza (Large) - $18.99 each
1x Coca Cola - $2.99

---
Subtotal: $40.97
${data.deliveryMethods?.delivery ? `Delivery: $${deliveryFee.toFixed(2)}` : ''}
Total: $${(40.97 + (data.deliveryMethods?.delivery ? deliveryFee : 0)).toFixed(2)}

---
Customer: John Doe
Phone: +1234567890
${data.deliveryMethods?.delivery ? 'Delivery Address: 123 Main St' : 'Pickup'}
${data.deliveryMethods?.delivery ? 'Delivery Time: ASAP' : 'Pickup Time: ASAP'}
Payment: Cash ${data.deliveryMethods?.delivery ? 'on Delivery' : 'on Pickup'}
Notes: Extra napkins please

---
${businessName}
${storeUrl}`
  }

  const handleTryOnWhatsApp = () => {
    const sampleMessage = generateSampleOrder()
    const whatsappUrl = `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(sampleMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ whatsappSettings: settings })
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Customize your WhatsApp orders
        </h1>
        <p className="text-lg text-gray-600">
          Personalize how customer orders appear in WhatsApp
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Number Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {orderNumberFormats.map(format => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => updateSetting('orderNumberFormat', format.value)}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    settings.orderNumberFormat === format.value
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{format.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Greeting Message
            </label>
            <textarea
              value={settings.greetingMessage}
              onChange={(e) => updateSetting('greetingMessage', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={4}
              placeholder="Hello! Welcome to your business..."
            />
            <p className="text-sm text-gray-500 mt-1">
              This message will be shown when customers first contact you
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-teal-600" />
              Test Your Setup
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Try sending a sample order to your WhatsApp to see how it looks
            </p>
            <button
              type="button"
              onClick={handleTryOnWhatsApp}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Try on WhatsApp
            </button>
          </div>
        </div>

        {/* WhatsApp Preview */}
        <div className="lg:sticky lg:top-8">
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="bg-white rounded-lg border border-gray-200 max-w-sm mx-auto">
              {/* WhatsApp Header */}
              <div className="bg-teal-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-700 rounded-full flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{data.businessName || 'Your Business'}</div>
                    <div className="text-xs text-teal-100">online</div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Conversation */}
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* Customer Message */}
                <div className="flex justify-end">
                  <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg max-w-xs text-sm">
                    Hi, I'd like to order
                  </div>
                </div>

                {/* Business Greeting */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-xs text-sm whitespace-pre-wrap">
                    {settings.greetingMessage}
                  </div>
                </div>

                {/* Sample Order */}
                <div className="flex justify-end">
                  <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg max-w-xs text-xs font-mono whitespace-pre-wrap">
                    {generateSampleOrder()}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">Live WhatsApp Preview</p>
              <p className="text-xs text-gray-500">Updates as you customize settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Continue...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}