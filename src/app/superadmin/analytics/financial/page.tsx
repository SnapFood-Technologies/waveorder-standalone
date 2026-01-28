'use client'

import { DollarSign, TrendingUp, CreditCard, Construction } from 'lucide-react'

export default function FinancialPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-green-600" />
          Financial Analytics
        </h1>
        <p className="text-gray-600 mt-1">Revenue, subscriptions, and financial performance metrics</p>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Construction className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600 max-w-md">
            Financial analytics will provide detailed insights into platform revenue, subscription performance, 
            and financial trends over time.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Revenue Trends</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Subscription Metrics</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">MRR & ARR</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
