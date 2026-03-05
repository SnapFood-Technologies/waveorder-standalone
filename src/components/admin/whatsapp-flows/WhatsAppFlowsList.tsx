'use client'

import Link from 'next/link'
import { MessageCircle, Zap } from 'lucide-react'

interface WhatsAppFlowsListProps {
  businessId: string
}

export function WhatsAppFlowsList({ businessId }: WhatsAppFlowsListProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Flows</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Create automated welcome, away, and keyword-triggered flows
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Coming in Phase 2</h3>
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          Welcome messages, away messages, and keyword-based flows will be available in the next update.
          For now, you can view and reply to conversations in the inbox.
        </p>
        <Link
          href={`/admin/stores/${businessId}/whatsapp-flows/conversations`}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Go to Conversations
        </Link>
      </div>
    </div>
  )
}
