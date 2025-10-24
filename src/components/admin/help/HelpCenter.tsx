// src/components/admin/help/HelpCenter.tsx
'use client'

import { useState } from 'react'
import { Search, BookOpen, MessageSquare, Ticket, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { FAQSection } from './FAQSection'

interface HelpCenterProps {
  businessId: string
}

export function HelpCenter({ businessId }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics of WaveOrder and set up your WhatsApp ordering system'
    },
    {
      id: 'product-management',
      title: 'Product Management',
      icon: BookOpen,
      description: 'Add, organize, and manage your products and categories'
    },
    {
      id: 'order-management',
      title: 'Order Management',
      icon: BookOpen,
      description: 'Handle incoming orders, track status, and manage customer information'
    },
    {
      id: 'customer-management',
      title: 'Customer Management',
      icon: BookOpen,
      description: 'Manage customer information, orders, and communication'
    },
    {
      id: 'whatsapp-integration',
      title: 'WhatsApp Integration',
      icon: BookOpen,
      description: 'Set up and configure WhatsApp for order management'
    },
    {
      id: 'billing-subscriptions',
      title: 'Billing & Subscriptions',
      icon: BookOpen,
      description: 'Manage your subscription, billing, and payment methods'
    },
    {
      id: 'team-management',
      title: 'Team Management',
      icon: BookOpen,
      description: 'Invite team members, manage roles, and collaborate'
    },
    {
      id: 'advanced-features',
      title: 'Advanced Features',
      icon: BookOpen,
      description: 'Inventory management, analytics, custom domains, and more'
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: BookOpen,
      description: 'Common issues and solutions'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-1">
            Find answers to common questions and learn how to use WaveOrder effectively.
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex space-x-3">
          <a
            href={`/admin/stores/${businessId}/support/tickets`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Ticket className="w-4 h-4 mr-2" />
            Create Support Ticket
          </a>
          <a
            href={`/admin/stores/${businessId}/support/messages`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Support
          </a>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {helpSections.map((section) => (
          <div key={section.id} className="bg-white border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <section.icon className="w-6 h-6 text-teal-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
                {expandedSections.includes(section.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            
            {expandedSections.includes(section.id) && (
              <div className="px-6 pb-4">
                <FAQSection sectionId={section.id} searchQuery={searchQuery} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Support CTA */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help you get the most out of WaveOrder.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`/admin/stores/${businessId}/support/tickets`}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Create Support Ticket
              </a>
              <a
                href={`/admin/stores/${businessId}/support/messages`}
                className="inline-flex items-center px-4 py-2 border border-teal-600 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-50"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
