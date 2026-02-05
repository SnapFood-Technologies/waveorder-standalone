'use client'

import { useState } from 'react'
import { X, Loader2, Crown, Building2, CheckCircle, AlertTriangle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
  currentPlan: string
  ownerEmail?: string
  onSuccess: () => void
}

const PLAN_OPTIONS = [
  {
    id: 'PRO',
    name: 'Pro Plan',
    icon: Crown,
    color: 'purple',
    features: [
      'Unlimited products',
      'Advanced analytics',
      'Delivery scheduling',
      'Product variants & modifiers',
      'Priority support'
    ]
  },
  {
    id: 'BUSINESS',
    name: 'Business Plan',
    icon: Building2,
    color: 'indigo',
    features: [
      'Everything in Pro',
      'Unlimited stores',
      'Full team access',
      'Custom domain support',
      'API access',
      'Dedicated support'
    ]
  }
]

const TRIAL_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' }
]

export function UpgradePlanModal({
  isOpen,
  onClose,
  businessId,
  businessName,
  currentPlan,
  ownerEmail,
  onSuccess
}: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('PRO')
  const [trialDays, setTrialDays] = useState<number>(14)
  const [sendEmail, setSendEmail] = useState<boolean>(true)
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter available plans (can only upgrade, not downgrade)
  const availablePlans = PLAN_OPTIONS.filter(plan => {
    const hierarchy: Record<string, number> = { STARTER: 1, PRO: 2, BUSINESS: 3 }
    return hierarchy[plan.id] > hierarchy[currentPlan]
  })

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/upgrade-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlan: selectedPlan,
          trialDays,
          sendEmail,
          reason: reason || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upgrade plan')
      }

      toast.success(`Successfully upgraded ${businessName} to ${selectedPlan} with ${trialDays}-day trial!`)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // If no plans available to upgrade to
  if (availablePlans.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upgrade Plan</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">
              This business is already on the highest plan ({currentPlan}).
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Set default to first available plan
  if (!availablePlans.find(p => p.id === selectedPlan)) {
    setSelectedPlan(availablePlans[0].id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upgrade Plan with Trial</h2>
            <p className="text-sm text-gray-500">
              Upgrade <span className="font-medium">{businessName}</span> from {currentPlan}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Plan
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePlans.map((plan) => {
                const Icon = plan.icon
                const isSelected = selectedPlan === plan.id
                const colorClasses = plan.color === 'purple'
                  ? { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', ring: 'ring-purple-500' }
                  : { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-500' }

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? `${colorClasses.border} ${colorClasses.bg} ring-2 ${colorClasses.ring}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${isSelected ? colorClasses.bg : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? colorClasses.text : 'text-gray-500'}`} />
                      </div>
                      <span className={`font-semibold ${isSelected ? colorClasses.text : 'text-gray-900'}`}>
                        {plan.name}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                          <CheckCircle className={`w-3 h-3 ${isSelected ? colorClasses.text : 'text-gray-400'}`} />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-xs text-gray-400">
                          +{plan.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Trial Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Trial Duration
            </label>
            <div className="flex gap-3">
              {TRIAL_OPTIONS.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => setTrialDays(option.days)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    trialDays === option.days
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Email Notification */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="mt-1 h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="sendEmail" className="flex-1">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">Send email notification</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Notify the business owner at <span className="font-medium">{ownerEmail || 'their email'}</span> about this upgrade
              </p>
            </label>
          </div>

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Complimentary trial for loyal customer, Partnership offer..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">This will be logged for internal reference</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedPlan}
            className="px-6 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Upgrading...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Upgrade to {selectedPlan}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
