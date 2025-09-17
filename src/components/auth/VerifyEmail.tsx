'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, CheckCircle, AlertCircle, Waves, RefreshCw } from 'lucide-react'

export default function VerifyEmailComponent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token')
  const success = searchParams.get('success') === 'true'
  const error = searchParams.get('error')
  
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [verified, setVerified] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [autoRedirect, setAutoRedirect] = useState(true)

  useEffect(() => {
    console.log('🔍 VerifyEmailComponent mounted with params:', {
      email,
      token: token ? token.substring(0, 8) + '...' : null,
      success,
      error
    })

    if (token) {
      verifyEmail(token)
    } else if (success) {
      setVerified(true)
      if (autoRedirect) {
        const timer = setTimeout(() => {
          router.push('/setup')
        }, 5000)
        return () => clearTimeout(timer)
      }
    } else if (error) {
      switch (error) {
        case 'invalid-token':
          setApiError('Invalid or expired verification token')
          break
        case 'missing-token':
          setApiError('Verification token is missing')
          break
        case 'user-not-found':
          setApiError('User account not found')
          break
        case 'server-error':
          setApiError('Server error occurred. Please try again.')
          break
        default:
          setApiError('An error occurred during verification')
      }
    }
  }, [token, success, error, router, autoRedirect])

  const verifyEmail = async (verificationToken) => {
    setLoading(true)
    setApiError('')

    console.log('📧 Verifying email with token:', verificationToken.substring(0, 8) + '...')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken })
      })

      const data = await response.json()
      console.log('✅ Verify email response:', { status: response.status, data })

      if (response.ok) {
        setVerified(true)
        setTimeout(() => {
          router.push('/setup')
        }, 5000)
      } else {
        setApiError(data.message || 'Invalid or expired verification link')
      }
    } catch (error) {
      console.error('❌ Verify email error:', error)
      setApiError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    console.log('🔄 Resend verification called with email:', email)
    
    if (!email) {
      console.log('❌ No email available for resend')
      setApiError('Email address is required to resend verification')
      return
    }

    if (typeof email !== 'string' || !email.trim()) {
      console.log('❌ Invalid email format:', email)
      setApiError('Invalid email address')
      return
    }

    setResendLoading(true)
    setApiError('')
    setResendSuccess(false)

    const requestBody = { email: email.trim() }
    console.log('📤 Sending request to /api/auth/resend-verification with body:', requestBody)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

      let data
      try {
        data = await response.json()
        console.log('📥 Response data:', data)
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError)
        const responseText = await response.text()
        console.log('📥 Raw response text:', responseText)
        throw new Error('Invalid JSON response from server')
      }

      if (response.ok) {
        console.log('✅ Resend verification successful')
        setResendSuccess(true)
      } else {
        console.log('❌ Resend verification failed:', data.message)
        setApiError(data.message || 'Failed to resend verification email')
      }
    } catch (error) {
      console.error('❌ Resend verification network error:', error)
      setApiError('Network error. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
            </div>
            
            <div className="bg-teal-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-teal-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Email Verified!</h2>
            <p className="text-gray-600 mb-8">
              Your email has been successfully verified. You can now start setting up your WhatsApp ordering system.
            </p>

            {autoRedirect && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-700 text-sm">
                  Redirecting to setup in 5 seconds...
                </p>
                <button
                  onClick={() => setAutoRedirect(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
                >
                  Cancel auto-redirect
                </button>
              </div>
            )}
            
            <div className="space-y-3">
              <Link
                href="/setup"
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all text-center block"
              >
                Start Setup
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading && token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
            </div>
            
            <div className="bg-teal-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <RefreshCw className="w-12 h-12 text-teal-600 animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Verifying Your Email</h2>
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
          </div>
          
          <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Mail className="w-12 h-12 text-blue-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to{' '}
            {email ? <strong>{email}</strong> : 'your email address'}.
            Click the link in your email to verify your account.
          </p>
        </div>

        {/* Debug info - remove in production */}
        <div className="bg-gray-100 p-3 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Email: {email || 'Not provided'}</p>
          <p>Token: {token ? 'Present' : 'Not present'}</p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-700">{apiError}</p>
          </div>
        )}

        {resendSuccess && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0" />
            <p className="text-teal-700">Verification email sent successfully!</p>
          </div>
        )}

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder.
          </p>
          
          {email && (
            <button
              onClick={resendVerification}
              disabled={resendLoading}
              className="inline-flex items-center px-4 py-2 border border-teal-300 rounded-lg text-teal-600 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </button>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Having trouble?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you're checking the correct email address</li>
            <li>• The verification link expires in 24 hours</li>
            <li>• Try requesting a new verification email</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            Still need help?{' '}
            <Link href="/contact" className="text-teal-600 hover:text-teal-700 font-medium">
              Contact support
            </Link>
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already verified?{' '}
            <Link href="/auth/login" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}