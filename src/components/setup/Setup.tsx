'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Waves, Loader2 } from 'lucide-react'

// Step components
import BusinessTypeStep from './steps/BusinessTypeStep'
import GoalsStep from './steps/GoalsStep'
import PricingStep from './steps/PricingStep'
import StoreCreationStep from './steps/StoreCreationStep'
import TeamSetupStep from './steps/TeamSetupStep'
import ProductSetupStep from './steps/ProductSetupStep'
import DeliveryMethodsStep from './steps/DeliveryMethodsStep'
import PaymentMethodsStep from './steps/PaymentMethodsStep'
import WhatsAppMessageStep from './steps/WhatsAppMessageStep'
import StoreReadyStep from './steps/StoreReadyStep'
import DashboardWelcomeStep from './steps/DashboardWelcomeStep'

export interface SetupData {
  businessType: string
  currency: string
  businessGoals: string[]
  subscriptionPlan: 'FREE' | 'PRO'
  businessName: string
  language?: string
  primaryColor?: string
  whatsappNumber: string
  storeSlug: string
  teamMembers: { email: string; role: string }[]
  paymentInstructions?: string
  categories: { id: string; name: string }[]
  // Step 6 (Domain) - Hidden but tracked
  domainSkipped: boolean
  products: any[]
  deliveryMethods: {
    delivery: boolean
    pickup: boolean
    dineIn?: boolean
    deliveryFee?: number
    deliveryRadius?: number
    estimatedDeliveryTime?: string
    estimatedPickupTime?: string
  }
  paymentMethods: string[]
  whatsappSettings: {
    orderNumberFormat: string
    greetingMessage: string
    messageTemplate?: string
  }
}

const TOTAL_STEPS = 11 // Excluding hidden domain step

export default function SetupComponent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [setupData, setSetupData] = useState<SetupData>({
    businessType: '',
    currency: 'USD', // Add this
    businessGoals: [],
    subscriptionPlan: 'FREE',
    businessName: '',
    whatsappNumber: '',
    storeSlug: '',
    teamMembers: [],
    domainSkipped: true,
    products: [],
    categories: [], // Add this
    deliveryMethods: {
      delivery: false,
      pickup: true,
      dineIn: false
    },
    paymentMethods: ['CASH'],
    paymentInstructions: '', // Add this
    whatsappSettings: {
      orderNumberFormat: 'WO-{number}',
      greetingMessage: ''
    }
  })

  useEffect(() => {
    if (status === 'loading') return
  
    // If there's a token, validate it (bypass session check)
    if (token) {
      validateSetupToken()
      return
    }
    
    // No token - require authenticated session
    if (!session) {
      router.push('/auth/login')
      return
    }
  
    // Authenticated user without token - check existing businesses
    checkUserBusinesses()
  }, [session, status, token, router])

  const checkUserBusinesses = async () => {
    try {
      const response = await fetch('/api/user/businesses')
      const data = await response.json()
      
      if (data.businesses?.length > 0) {
        if (data.businesses[0].setupWizardCompleted) {
        // User already has businesses, redirect to dashboard
        router.push(`/admin/stores/${data.businesses[0].id}/dashboard`)
        } else {
           // Load existing progress
  const progressResponse = await fetch('/api/setup/progress')
  if (progressResponse.ok) {
    const progressData = await progressResponse.json()
    setCurrentStep(progressData.currentStep)
    setSetupData(prev => ({ ...prev, ...progressData.setupData }))
  }

  setLoading(false)
        }
      } else {
        // User can access setup without token (already authenticated)
        setLoading(false)
      }
    } catch (error) {
      setError('Failed to check user status')
      setLoading(false)
    }
  }

  const validateSetupToken = async () => {
    try {
      // First validate token
      const validateResponse = await fetch('/api/setup/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
  
      if (!validateResponse.ok) {
        const data = await validateResponse.json()
        if (data.redirectTo) {
          router.push(data.redirectTo)
        } else {
          setError(data.message || 'Invalid setup token')
        }
        setLoading(false)
        return
      }
  
      // Then load progress
      const progressResponse = await fetch(`/api/setup/progress?token=${token}`)
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setCurrentStep(progressData.currentStep)
        setSetupData(prev => ({ ...prev, ...progressData.setupData }))
      }
      
      setLoading(false)
    } catch (error) {
      setError('Failed to validate setup token')
      setLoading(false)
    }
  }

  const handleStepComplete = async (stepData: Partial<SetupData>) => {
    const updatedData = { ...setupData, ...stepData }
    setSetupData(updatedData)
    
    // Save progress to backend
    try {
      await fetch('/api/setup/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: currentStep,
          data: updatedData,
          setupToken: token
        })
      })
    } catch (error) {
      console.error('Failed to save progress:', error)
    }

    // Move to next step (skip domain step)
    const nextStep = currentStep === 5 ? 7 : currentStep + 1 // Skip step 6 (domain)
    
    if (nextStep <= TOTAL_STEPS) {
      setCurrentStep(nextStep)
    }
  }

  const handleBack = () => {
    // Handle going back (skip domain step)
    const prevStep = currentStep === 7 ? 5 : currentStep - 1 // Skip step 6 (domain)
    if (prevStep >= 1) {
      setCurrentStep(prevStep)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessTypeStep data={setupData} onComplete={handleStepComplete} />
      case 2:
        return <GoalsStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} />
      case 3:
        return <PricingStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} />
      case 4:
        return <StoreCreationStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} setupToken={token} />
      case 5:
        return <TeamSetupStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} />
      // Step 6 (Domain) is skipped
      case 7:
        return <ProductSetupStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} />
      case 8:
        return <DeliveryMethodsStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} />
      case 9:
        return <PaymentMethodsStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} />
      case 10:
        return <WhatsAppMessageStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} />
      case 11:
        return <StoreReadyStep data={setupData} onComplete={handleStepComplete} onBack={handleBack} setupToken={token} />
      case 12:
        return <DashboardWelcomeStep data={setupData} />
      default:
        return <BusinessTypeStep data={setupData} onComplete={handleStepComplete} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <span className="text-xl font-bold text-gray-900">Complete Your Setup</span>
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep} of {TOTAL_STEPS}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Step */}
      <div className="flex-1">
        {renderCurrentStep()}
      </div>
    </div>
  )
}