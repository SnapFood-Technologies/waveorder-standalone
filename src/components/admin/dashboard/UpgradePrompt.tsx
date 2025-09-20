// src/components/admin/dashboard/UpgradePrompt.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, X } from 'lucide-react'

interface UpgradePromptProps {
  businessId: string
}

export function UpgradePrompt({ businessId }: UpgradePromptProps) {
  const [subscription, setSubscription] = useState<{ plan: string }>({ plan: 'FREE' })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }
    }

    // Check if user has dismissed the prompt
    const isDismissed = localStorage.getItem('upgrade-prompt-dismissed')
    setDismissed(!!isDismissed)

    fetchSubscription()
  }, [])

  const dismissPrompt = () => {
    setDismissed(true)
    localStorage.setItem('upgrade-prompt-dismissed', 'true')
  }

  if (subscription.plan !== 'FREE' || dismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-6 text-white relative">
      <button
        onClick={dismissPrompt}
        className="absolute top-4 right-4 text-white/80 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>
      
      <div className="flex items-start space-x-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <Crown className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Upgrade to Pro for just $1</h3>
          <p className="text-teal-100 mb-4">
            Unlock advanced inventory management, discount codes, detailed analytics, and more powerful features to grow your business.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/stores/${businessId}/settings/billing`}
              className="inline-flex items-center px-6 py-3 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Link>
            
            <Link
              href="/pricing"
              className="text-teal-100 hover:text-white underline self-center"
            >
              Learn more about Pro features
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}