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
    label: 'Accept WhatsApp orders easily',
    description: 'Enable customers to order directly through WhatsApp',
    icon: MessageSquare
  },
  {
    value: 'MANAGE_PRODUCTS_INVENTORY',
    label: 'Manage products and inventory',
    description: 'Track your menu items and stock levels',
    icon: Package
  },
  {
    value: 'TRACK_DELIVERY_PICKUP',
    label: 'Track delivery and pickup orders',
    description: 'Monitor order status and delivery progress',
    icon: Truck
  },
  {
    value: 'BUILD_CUSTOMER_RELATIONSHIPS',
    label: 'Build customer relationships',
    description: 'Maintain customer data and order history',
    icon: Users
  },
  {
    value: 'TEAM_COLLABORATION',
    label: 'Grow with team collaboration',
    description: 'Add team members to help manage orders',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedGoals.length === 0) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ businessGoals: selectedGoals })
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          What's your goal with WaveOrder?
        </h1>
        <p className="text-lg text-gray-600">
          Select all that apply to help us customize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="space-y-4 mb-8">
          {businessGoals.map((goal) => {
            const IconComponent = goal.icon
            const isSelected = selectedGoals.includes(goal.value)
            
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => toggleGoal(goal.value)}
                className={`w-full p-6 border-2 rounded-xl text-left transition-all hover:border-teal-300 hover:bg-teal-50 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-lg">{goal.label}</h3>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{goal.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

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
            type="submit"
            disabled={selectedGoals.length === 0 || loading}
            className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Continue...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}