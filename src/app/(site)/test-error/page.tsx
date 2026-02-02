'use client'

import { useState } from 'react'

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    // This will trigger the error boundary
    throw new Error('Test error - simulating a crash!')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Boundary Test</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to trigger an error and see the error page.
        </p>
        <button
          onClick={() => setShouldError(true)}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
        >
          Trigger Error
        </button>
        <p className="text-xs text-gray-400 mt-6">
          This page is for testing only. Remove in production if needed.
        </p>
      </div>
    </div>
  )
}
