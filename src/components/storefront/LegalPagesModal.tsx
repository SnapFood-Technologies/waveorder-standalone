'use client'

import { useState, useEffect } from 'react'
import { X, Shield, FileText, CreditCard, RotateCcw, Truck, Receipt } from 'lucide-react'
import Link from 'next/link'

interface Page {
  slug: string
  title: string
  showInFooter: boolean
  sortOrder: number
}

interface LegalPagesModalProps {
  isOpen: boolean
  onClose: () => void
  businessSlug: string
  primaryColor: string
}

const pageIcons: Record<string, any> = {
  'privacy-policy': Shield,
  'terms-of-use': FileText,
  'payment-methods': CreditCard,
  'cancellation-return': RotateCcw,
  'shipping-policy': Truck,
  'refund-policy': Receipt,
}

export default function LegalPagesModal({
  isOpen,
  onClose,
  businessSlug,
  primaryColor,
}: LegalPagesModalProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && businessSlug) {
      fetch(`/api/storefront/${businessSlug}/pages`)
        .then(res => res.json())
        .then(data => {
          setPages(data.pages || [])
          setLoading(false)
        })
        .catch(err => {
          console.error('Error fetching pages:', err)
          setLoading(false)
        })
    }
  }, [isOpen, businessSlug])

  if (!isOpen) return null

  const handlePageClick = (slug: string) => {
    window.open(`/${businessSlug}/${slug}`, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 flex-shrink-0" style={{ backgroundColor: `${primaryColor}10` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Shield className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Legal & Policies
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
            </div>
          ) : pages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pages available</p>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => {
                const IconComponent = pageIcons[page.slug] || FileText
                return (
                  <button
                    key={page.slug}
                    onClick={() => handlePageClick(page.slug)}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors text-left flex items-center gap-3 group"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      <IconComponent className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <span className="flex-1 font-medium text-gray-900 group-hover:text-gray-700">
                      {page.title}
                    </span>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
