'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, MessageSquare, Smartphone, ExternalLink } from 'lucide-react'

interface WhatsAppMessageStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

const messageTemplates = {
  en: {
    RESTAURANT: {
      greeting: (businessName: string, storeSlug: string) => 
        `Hello! Welcome to ${businessName}.\nBrowse our delicious menu at waveorder.app/${storeSlug}\nReady to order? Let us know!`,
      sampleItems: '2x Margherita Pizza (Large) - $18.99 each\n1x Coca Cola - $2.99',
      itemLabel: 'Food Items'
    },
    CAFE: {
      greeting: (businessName: string, storeSlug: string) => 
        `Hi there! Welcome to ${businessName}.\nCheck out our coffee & food menu at waveorder.app/${storeSlug}\nWhat can we brew for you today?`,
      sampleItems: '1x Cappuccino (Large) - $4.50\n1x Croissant - $3.99\n1x Americano - $3.50',
      itemLabel: 'Coffee & Food'
    },
    RETAIL: {
      greeting: (businessName: string, storeSlug: string) => 
        `Hello! Welcome to ${businessName}.\nShop our products at waveorder.app/${storeSlug}\nNeed help finding something?`,
      sampleItems: '1x T-Shirt (Medium, Blue) - $25.99\n1x Jeans (Size 32) - $49.99',
      itemLabel: 'Products'
    },
    GROCERY: {
      greeting: (businessName: string, storeSlug: string) => 
        `Hello! Welcome to ${businessName}.\nOrder fresh groceries at waveorder.app/${storeSlug}\nWe deliver fresh to your door!`,
      sampleItems: '2x Bananas (1kg) - $2.99 each\n1x Milk (1L) - $3.49\n1x Bread - $2.99',
      itemLabel: 'Groceries'
    },
    JEWELRY: {
      greeting: (businessName: string, storeSlug: string) => 
        `Hello! Welcome to ${businessName}.\nView our jewelry collection at waveorder.app/${storeSlug}\nLooking for something special?`,
      sampleItems: '1x Silver Ring (Size 7) - $149.99\n1x Gold Necklace - $299.99',
      itemLabel: 'Jewelry'
    },
    FLORIST: {
      greeting: (businessName: string, storeSlug: string) => 
        `Hello! Welcome to ${businessName}.\nOrder beautiful flowers at waveorder.app/${storeSlug}\nPerfect for any occasion!`,
      sampleItems: '1x Rose Bouquet (12 roses) - $45.99\n1x Greeting Card - $4.99',
      itemLabel: 'Flowers'
    },
    orderTerms: {
      subtotal: 'Subtotal',
      delivery: 'Delivery',
      shipping: 'Shipping',
      total: 'Total',
      customer: 'Customer',
      phone: 'Phone',
      deliveryAddress: 'Delivery Address',
      shippingAddress: 'Shipping Address',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      appointmentTime: 'Appointment Time',
      payment: 'Payment',
      notes: 'Notes',
      asap: 'ASAP',
      onDelivery: 'on Delivery',
      onPickup: 'on Pickup'
    }
  },
  sq: {
    RESTAURANT: {
      greeting: (businessName: string, storeSlug: string) => 
        `Përshëndetje! Mirë se vini në ${businessName}.\nShikoni menunë tonë të shijshme në waveorder.app/${storeSlug}\nGati për të porositur? Na thoni!`,
      sampleItems: '2x Pizza Margherita (E madhe) - $18.99 secila\n1x Coca Cola - $2.99',
      itemLabel: 'Ushqime'
    },
    CAFE: {
      greeting: (businessName: string, storeSlug: string) => 
        `Përshëndetje! Mirë se vini në ${businessName}.\nShikoni menunë tonë të kafesë dhe ushqimeve në waveorder.app/${storeSlug}\nÇfarë mund t'ju përgatisim sot?`,
      sampleItems: '1x Cappuccino (E madhe) - $4.50\n1x Kroasan - $3.99\n1x Amerikano - $3.50',
      itemLabel: 'Kafe & Ushqim'
    },
    RETAIL: {
      greeting: (businessName: string, storeSlug: string) => 
        `Përshëndetje! Mirë se vini në ${businessName}.\nBlini produktet tona në waveorder.app/${storeSlug}\nKeni nevojë për ndihmë?`,
      sampleItems: '1x Bluzë (Mesatare, Blu) - $25.99\n1x Xhinse (Madhësia 32) - $49.99',
      itemLabel: 'Produkte'
    },
    GROCERY: {
      greeting: (businessName: string, storeSlug: string) => 
        `Përshëndetje! Mirë se vini në ${businessName}.\nPorosit ushqime të freskëta në waveorder.app/${storeSlug}\nI dorëzojmë të freskët në shtëpinë tuaj!`,
      sampleItems: '2x Banane (1kg) - $2.99 secila\n1x Qumësht (1L) - $3.49\n1x Bukë - $2.99',
      itemLabel: 'Ushqime'
    },
    JEWELRY: {
      greeting: (businessName: string, storeSlug: string) => 
        `Përshëndetje! Mirë se vini në ${businessName}.\nShikoni koleksionin tonë të stolitë në waveorder.app/${storeSlug}\nKërkoni diçka të veçantë?`,
      sampleItems: '1x Unazë Argjendi (Madhësia 7) - $149.99\n1x Gjerdan Ari - $299.99',
      itemLabel: 'Stolira'
    },
    FLORIST: {
      greeting: (businessName: string, storeSlug: string) => 
        `Përshëndetje! Mirë se vini në ${businessName}.\nPorosit lule të bukura në waveorder.app/${storeSlug}\nPërfekte për çdo rast!`,
      sampleItems: '1x Buqetë Trëndafilash (12 trëndafila) - $45.99\n1x Kartë Urimi - $4.99',
      itemLabel: 'Lule'
    },
    orderTerms: {
      subtotal: 'Nëntotali',
      delivery: 'Dorëzimi',
      shipping: 'Dërgimi',
      total: 'Totali',
      customer: 'Klienti',
      phone: 'Telefoni',
      deliveryAddress: 'Adresa e Dorëzimit',
      shippingAddress: 'Adresa e Dërgimit',
      deliveryTime: 'Koha e Dorëzimit',
      pickupTime: 'Koha e Marrjes',
      appointmentTime: 'Koha e Takimit',
      payment: 'Pagesa',
      notes: 'Shënime',
      asap: 'SA MË SHPEJT',
      onDelivery: 'në Dorëzim',
      onPickup: 'në Marrje'
    }
  }
}

export default function WhatsAppMessageStep({ data, onComplete, onBack }: WhatsAppMessageStepProps) {
  const selectedLanguage = data.language || 'en' // Use language from first step
  const [settings, setSettings] = useState(data.whatsappSettings || {
    orderNumberFormat: 'WO-{number}',
    // @ts-ignore
    greetingMessage: messageTemplates[selectedLanguage].greeting(data.businessName || 'Your Business', data.storeSlug || 'your-store'),
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
    const storeUrl = `waveorder.app/${data.storeSlug || 'your-store'}`
    const deliveryFee = data.deliveryMethods?.deliveryFee || 3.00
    
    const businessTypeKey = data.businessType || 'RESTAURANT'
    // @ts-ignore
    const template = messageTemplates[selectedLanguage][businessTypeKey] || messageTemplates[selectedLanguage]['RESTAURANT']
    // @ts-ignore
    const terms = messageTemplates[selectedLanguage].orderTerms

    // Get appropriate delivery term based on business type
    const getDeliveryTerm = () => {
      if (businessTypeKey === 'RETAIL' || businessTypeKey === 'JEWELRY') {
        return terms.shipping
      }
      return terms.delivery
    }

    // Get appropriate address term based on business type
    const getAddressTerm = () => {
      if (businessTypeKey === 'RETAIL' || businessTypeKey === 'JEWELRY') {
        return terms.shippingAddress
      }
      return terms.deliveryAddress
    }

    // Get appropriate time term based on business type and delivery method
    const getTimeTerm = () => {
      if (businessTypeKey === 'JEWELRY' && !data.deliveryMethods?.delivery) {
        return terms.appointmentTime
      }
      return data.deliveryMethods?.delivery ? terms.deliveryTime : terms.pickupTime
    }

    return `${selectedLanguage === 'sq' ? 'Porosia' : 'Order'} ${orderNumber}

${template.sampleItems}

---
${terms.subtotal}: $40.97
${data.deliveryMethods?.delivery ? `${getDeliveryTerm()}: ${deliveryFee.toFixed(2)}` : ''}
${terms.total}: ${(40.97 + (data.deliveryMethods?.delivery ? deliveryFee : 0)).toFixed(2)}

---
${terms.customer}: John Doe
${terms.phone}: +1234567890
${data.deliveryMethods?.delivery ? `${getAddressTerm()}: 123 Main St` : businessTypeKey === 'JEWELRY' ? 'Store Visit' : 'Pickup'}
${getTimeTerm()}: ${terms.asap}
${terms.payment}: ${selectedLanguage === 'sq' ? 'Para në dorë' : 'Cash'} ${data.deliveryMethods?.delivery ? terms.onDelivery : terms.onPickup}
${terms.notes}: ${selectedLanguage === 'sq' ? getAlbanianNote(businessTypeKey) : getEnglishNote(businessTypeKey)}

---
${businessName}
${storeUrl}`
  }

  const getEnglishNote = (businessType: string) => {
    switch (businessType) {
      case 'RESTAURANT': return 'Extra napkins please'
      case 'CAFE': return 'Extra sugar please'
      case 'RETAIL': return 'Gift wrap please'
      case 'GROCERY': return 'Double bag please'
      case 'JEWELRY': return 'Gift box please'
      case 'FLORIST': return 'Add a card please'
      default: return 'Thank you'
    }
  }

  const getAlbanianNote = (businessType: string) => {
    switch (businessType) {
      case 'RESTAURANT': return 'Peshqirë shtesë ju lutem'
      case 'CAFE': return 'Sheqer shtesë ju lutem'
      case 'RETAIL': return 'Paketim dhurate ju lutem'
      case 'GROCERY': return 'Qese të dyfishta ju lutem'
      case 'JEWELRY': return 'Kuti dhurate ju lutem'
      case 'FLORIST': return 'Shtoni një kartë ju lutem'
      default: return 'Faleminderit'
    }
  }

  const handleTryOnWhatsApp = () => {
    const sampleMessage = generateSampleOrder()
    const whatsappUrl = `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(sampleMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ 
      whatsappSettings: settings,
      language: selectedLanguage
    })
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
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base text-gray-900 placeholder:text-gray-500"
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
                    {selectedLanguage === 'sq' ? 'Përshëndetje, dua të porosit' : 'Hi, I\'d like to order'}
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