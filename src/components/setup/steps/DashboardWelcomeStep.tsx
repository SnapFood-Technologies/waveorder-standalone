'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SetupData } from '../Setup'
import { 
  CheckCircle, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  X,
  ArrowRight,
  Zap,
  Target,
  Gift
} from 'lucide-react'

interface DashboardWelcomeStepProps {
  data: SetupData
}

export default function DashboardWelcomeStep({ data }: DashboardWelcomeStepProps) {
  const router = useRouter()
  const [showWelcomeModal, setShowWelcomeModal] = useState(true)
  const [currentTour, setCurrentTour] = useState(0)
  
  const tourSteps = [
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track your orders, revenue, and customer insights in real-time',
      color: 'teal'
    },
    {
      icon: Package,
      title: 'Product Management',
      description: 'Easily add, edit, and organize your products and categories',
      color: 'emerald'
    },
    {
      icon: Users,
      title: 'Order Management',
      description: 'View and manage all incoming orders from one central location',
      color: 'blue'
    },
    {
      icon: Settings,
      title: 'Store Customization',
      description: 'Customize your store appearance, delivery options, and settings',
      color: 'purple'
    }
  ]

  const completionStats = {
    products: data.products?.length || 0,
    teamMembers: data.teamMembers?.length || 0,
    deliveryMethods: Object.values(data.deliveryMethods || {}).filter(v => v === true).length,
    paymentMethods: data.paymentMethods?.length || 1
  }

  const setupChecklist = [
    {
      id: 'products',
      label: 'Add Products',
      completed: completionStats.products > 0,
      description: `${completionStats.products} products added`
    },
    {
      id: 'delivery',
      label: 'Set Delivery Options',
      completed: completionStats.deliveryMethods > 0,
      description: `${completionStats.deliveryMethods} delivery methods configured`
    },
    {
      id: 'payments',
      label: 'Configure Payments',
      completed: completionStats.paymentMethods > 0,
      description: `${completionStats.paymentMethods} payment methods set`
    },
    {
      id: 'team',
      label: 'Invite Team Members',
      completed: completionStats.teamMembers > 0,
      description: completionStats.teamMembers > 0 ? `${completionStats.teamMembers} team members invited` : 'Optional - manage alone'
    }
  ]

  const nextTour = () => {
    if (currentTour < tourSteps.length - 1) {
      setCurrentTour(currentTour + 1)
    } else {
      setShowWelcomeModal(false)
    }
  }

  const skipTour = () => {
    setShowWelcomeModal(false)
  }

  const navigateToDashboard = () => {
    // Navigate to the main dashboard - you'll need to replace this with your actual route
    router.push(`/admin/stores/${data.businessName?.toLowerCase().replace(/\s+/g, '-')}/dashboard`)
  }

  useEffect(() => {
    // Automatically navigate to dashboard after 3 seconds if modal is closed
    if (!showWelcomeModal) {
      const timer = setTimeout(navigateToDashboard, 3000)
      return () => clearTimeout(timer)
    }
  }, [showWelcomeModal])

  const currentStep = tourSteps[currentTour]
  const IconComponent = currentStep?.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 relative">
      {/* Background Dashboard Preview */}
      <div className="absolute inset-0 opacity-30">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">$0.00</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{completionStats.products}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full relative">
            <button
              onClick={skipTour}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className={`w-16 h-16 bg-${currentStep.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <IconComponent className={`w-8 h-8 text-${currentStep.color}-600`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h3>
              <p className="text-gray-600">{currentStep.description}</p>
            </div>

            <div className="flex items-center justify-center space-x-2 mb-6">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentTour ? 'bg-teal-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={skipTour}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip Tour
              </button>
              <button
                onClick={nextTour}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center"
              >
                {currentTour < tourSteps.length - 1 ? 'Next' : 'Get Started'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showWelcomeModal && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to your dashboard!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your store <strong>{data.businessName}</strong> is now live and ready for orders
            </p>
            
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Store is Live</h3>
                  <p className="text-sm text-gray-600">Customers can now place orders</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Setup Complete</h3>
                  <p className="text-sm text-gray-600">All essential features configured</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ready to Grow</h3>
                  <p className="text-sm text-gray-600">Start accepting orders today</p>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Completion Checklist */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Summary</h3>
            <div className="space-y-3">
              {setupChecklist.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.completed ? <CheckCircle className="w-3 h-3" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Redirecting to your dashboard in a few seconds, or click below to continue
            </p>
            <button
              onClick={navigateToDashboard}
              className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center"
            >
              Continue to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}