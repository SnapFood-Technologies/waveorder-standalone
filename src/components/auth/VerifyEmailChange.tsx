// src/components/auth/VerifyEmailChange.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Waves } from 'lucide-react'

interface VerifyEmailChangeProps {
  token: string
}

export default function VerifyEmailChange({ token }: VerifyEmailChangeProps) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    verifyEmailChange(token)
  }, [token])

  const verifyEmailChange = async (token: string) => {
    try {
      const response = await fetch('/api/user/verify-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setNewEmail(data.newEmail)
        setMessage('Your email address has been changed successfully!')
        
        setTimeout(() => {
          router.push('/auth/login')
        }, 5000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to verify email change')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred while verifying your email change')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          {/* Header */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
          </div>

          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email Change...</h2>
              <p className="text-gray-600">Please wait while we verify your new email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Changed Successfully!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              
              {newEmail && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-teal-800">
                    Your new email address is: <strong>{newEmail}</strong>
                  </p>
                  <p className="text-xs text-teal-600 mt-2">
                    Use this email to sign in from now on
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-500">Redirecting you to login in 5 seconds...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Common reasons:</h3>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• The verification link has expired (valid for 24 hours)</li>
                  <li>• The link has already been used</li>
                  <li>• The email address is now in use by another account</li>
                </ul>
              </div>
              
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}