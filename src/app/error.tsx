'use client'

import { useEffect } from 'react'
import { RefreshCw, RotateCcw, AlertTriangle, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console for debugging
    console.error('Application error:', error)

    // Check if it's a chunk load error (stale cache)
    const isChunkError = 
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Unexpected token') ||
      error.name === 'ChunkLoadError'

    if (isChunkError) {
      // Clear caches and reload
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      // Force hard reload after short delay
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }, [error])

  // Check if it's a network/chunk error for messaging
  const isNetworkError = 
    error.message?.includes('ChunkLoadError') ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('Network')

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto text-center">
        {/* Error Visual */}
        <div className="mb-8">
          <div className="text-7xl md:text-8xl font-bold text-gray-200 mb-4">
            Oops!
          </div>
          <div className="w-24 h-24 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-12 h-12 text-teal-600" />
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {isNetworkError ? 'Connection Issue' : 'Something Went Wrong'}
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          {isNetworkError 
            ? 'There was a problem loading the page. This usually happens after an update.'
            : 'An unexpected error occurred. Don\'t worry, we\'re on it.'
          }
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh Page
          </button>
          
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Try Again
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl border border-teal-100">
          <p className="text-gray-600 mb-4">
            If the problem persists, try:
          </p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>• Clearing your browser cache</li>
            <li>• Using incognito/private mode</li>
            <li>• Refreshing the page</li>
          </ul>
        </div>

        {/* Home Link */}
        <div className="mt-8">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-teal-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
