'use client'

import { Brain, Construction, DollarSign, TrendingUp, PieChart } from 'lucide-react'

export default function WavemindFinancialPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="w-7 h-7 text-purple-600" />
          Wavemind Engine - Financial
        </h1>
        <p className="text-gray-600 mt-1">AI-powered financial insights and predictions</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
          <Construction className="w-10 h-10 text-purple-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Our AI-powered financial analytics engine is currently in development. 
          Get ready for intelligent insights that will transform how you understand your business finances.
        </p>

        {/* Planned Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white/70 rounded-lg p-4 border border-purple-100">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Revenue Predictions</h3>
            <p className="text-sm text-gray-500 mt-1">AI-driven forecasting for MRR and growth</p>
          </div>
          
          <div className="bg-white/70 rounded-lg p-4 border border-purple-100">
            <PieChart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Churn Analysis</h3>
            <p className="text-sm text-gray-500 mt-1">Predict and prevent customer churn</p>
          </div>
          
          <div className="bg-white/70 rounded-lg p-4 border border-purple-100">
            <DollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Smart Insights</h3>
            <p className="text-sm text-gray-500 mt-1">Automated recommendations for growth</p>
          </div>
        </div>
      </div>
    </div>
  )
}
