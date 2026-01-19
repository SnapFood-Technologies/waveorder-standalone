// src/components/site/NotFoundClient.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft, Home, Search, MessageSquare } from 'lucide-react'

export default function NotFoundClient() {
  const popularPages = [
    {
      title: "Features",
      href: "/features",
      description: "Explore WaveOrder's capabilities"
    },
    {
      title: "Pricing", 
      href: "/pricing",
      description: "View our transparent pricing plans"
    },
    {
      title: "Demo",
      href: "/demo", 
      description: "See WaveOrder in action"
    },
    {
      title: "Get Started",
      href: "/auth/register",
      description: "Create your account"
    }
  ]

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="py-20 bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <div className="text-8xl md:text-9xl font-bold text-gray-200 mb-4">
            404
          </div>
          <div className="w-24 h-24 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-teal-600" />
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
          The page you're looking for doesn't exist or may have been moved. 
          Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <Link 
            href="/contact"
            className="inline-flex items-center px-6 py-3 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Contact Support
          </Link>
        </div>

        {/* Popular Pages */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-8 rounded-xl border border-teal-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Popular Pages
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularPages.map((page, index) => (
              <Link
                key={index}
                href={page.href}
                className="group bg-white p-4 rounded-lg border border-gray-200 hover:border-teal-200 hover:bg-teal-50 transition-all duration-200 text-left"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 mb-1">
                  {page.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Back Navigation */}
        <div className="mt-8">
          <button 
            onClick={handleGoBack}
            className="inline-flex items-center text-gray-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back to previous page
          </button>
        </div>
      </div>
    </div>
  )
}