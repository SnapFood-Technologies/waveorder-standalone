'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { 
  MessageSquare, 
  Package, 
  Truck, 
  Users, 
  UserPlus, 
  ArrowLeft 
} from 'lucide-react'

interface GoalsStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

const businessGoals = [
  {
    value: 'ACCEPT_WHATSAPP_ORDERS',
    label: 'Accept WhatsApp orders & bookings',
    description: 'Enable customers to order products or book appointments directly through WhatsApp',
    icon: MessageSquare
  },
  {
    value: 'MANAGE_PRODUCTS_INVENTORY',
    label: 'Manage catalog & inventory',
    description: 'Track your products, services, and stock levels in one place',
    icon: Package
  },
  {
    value: 'TRACK_DELIVERY_PICKUP',
    label: 'Manage orders & appointments',
    description: 'Monitor order status, delivery progress, and appointment schedules',
    icon: Truck
  },
  {
    value: 'BUILD_CUSTOMER_RELATIONSHIPS',
    label: 'Build customer relationships',
    description: 'Maintain customer data, order history, and preferences',
    icon: Users
  },
  {
    value: 'TEAM_COLLABORATION',
    label: 'Team collaboration & staff management',
    description: 'Add team members and assign roles to help manage your business',
    icon: UserPlus
  }
]

export default function GoalsStep({ data, onComplete, onBack }: GoalsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.businessGoals || [])
  const [loading, setLoading] = useState(false)

  const toggleGoal = (goalValue: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalValue)
        ? prev.filter(g => g !== goalValue)
        : [...prev, goalValue]
    )
  }

  const handleSubmit = async () => {
    if (selectedGoals.length === 0) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ businessGoals: selectedGoals })
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
          What's your goal with WaveOrder?
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4 sm:px-2 max-w-2xl mx-auto">
          Select all that apply to help us customize your experience
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {businessGoals.map((goal) => {
            const IconComponent = goal.icon
            const isSelected = selectedGoals.includes(goal.value)
            
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={`w-full p-4 sm:p-6 border-2 rounded-xl text-left transition-all hover:border-teal-300 hover:bg-teal-50 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">{goal.label}</h3>
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">{goal.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center sm:justify-start px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          
          <button
            type="button"
            disabled={selectedGoals.length === 0 || loading}
            onClick={handleSubmit}
            className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
          >
            {loading ? 'Continue...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}