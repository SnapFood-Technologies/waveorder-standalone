// src/components/admin/shared/LimitReachedPrompt.tsx
'use client'

import { AlertTriangle, Crown, X } from 'lucide-react'
import Link from 'next/link'

interface LimitReachedPromptProps {
  businessId: string
  limitType: 'products' | 'categories' | 'team' | 'stores'
  currentCount: number
  limit: number
  plan: string
  onDismiss?: () => void
}

const LIMIT_MESSAGES = {
  products: {
    title: 'Product Limit Reached',
    description: 'You have reached the maximum number of products for your plan.',
    upgradeText: 'Upgrade to PRO for unlimited products'
  },
  categories: {
    title: 'Category Limit Reached',
    description: 'You have reached the maximum number of categories for your plan.',
    upgradeText: 'Upgrade to PRO for unlimited categories'
  },
  team: {
    title: 'Team Member Limit Reached',
    description: 'You have reached the maximum number of team members for your plan.',
    upgradeText: 'Contact support to add more team members'
  },
  stores: {
    title: 'Store Limit Reached',
    description: 'You have reached the maximum number of stores for your plan.',
    upgradeText: 'Upgrade to BUSINESS for unlimited stores'
  }
}

export function LimitReachedPrompt({ 
  businessId, 
  limitType, 
  currentCount, 
  limit, 
  plan,
  onDismiss 
}: LimitReachedPromptProps) {
  const message = LIMIT_MESSAGES[limitType]

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 relative">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-amber-600/80 hover:text-amber-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      <div className="flex items-start space-x-4">
        <div className="bg-amber-100 p-3 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-800 mb-1">
            {message.title}
          </h3>
          <p className="text-amber-700 mb-2">
            {message.description}
          </p>
          <p className="text-sm text-amber-600 mb-4">
            Your <span className="font-semibold">{plan}</span> plan allows up to{' '}
            <span className="font-semibold">{limit}</span> {limitType}. You currently have{' '}
            <span className="font-semibold">{currentCount}</span>.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/stores/${businessId}/settings/billing`}
              className="inline-flex items-center px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              <Crown className="w-4 h-4 mr-2" />
              {message.upgradeText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact version for use in modals or inline alerts
export function LimitReachedAlert({ 
  limitType, 
  currentCount, 
  limit, 
  plan 
}: Omit<LimitReachedPromptProps, 'businessId' | 'onDismiss'>) {
  const message = LIMIT_MESSAGES[limitType]

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-amber-800 font-medium">{message.title}</p>
          <p className="text-amber-700 text-sm">
            {plan} plan limit: {currentCount}/{limit} {limitType}. Please upgrade to add more.
          </p>
        </div>
      </div>
    </div>
  )
}
