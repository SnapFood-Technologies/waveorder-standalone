// components/team/AcceptInvitation.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Waves, 
  Loader2,
  Users,
  Mail,
  Shield,
  Building2
} from 'lucide-react'

interface InvitationData {
  email: string
  businessName: string
  businessId: string
  role: string
  inviterName: string
  expiresAt: string
}

interface AcceptInvitationProps {
  token: string
}

export default function AcceptInvitation({ token }: AcceptInvitationProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [invitationValid, setInvitationValid] = useState(false)
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Invitation token is missing')
      setValidating(false)
      return
    }

    validateInvitation()
  }, [token])

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/team/invite/${token}`, {
        method: 'GET'
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setInvitationValid(true)
        setInvitationData(data)
      } else {
        setError(data.message || 'Invalid or expired invitation')
        setInvitationValid(false)
      }
    } catch (error) {
      setError('Failed to validate invitation')
      setInvitationValid(false)
    } finally {
      setValidating(false)
    }
  }

  const validatePassword = (password: string) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/team/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation')
      }

      const signInResult = await signIn('credentials', {
        email: invitationData?.email,
        password: formData.password,
        redirect: false
      })

      if (signInResult?.ok) {
        router.push(`/admin/stores/${invitationData?.businessId}/dashboard`)
      } else {
        setError('Account created but failed to sign in. Please try signing in manually.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-blue-100 text-blue-800'
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800'
      case 'STAFF':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'Manage products, orders, and invite staff members'
      case 'STAFF':
        return 'View and manage orders and products'
      default:
        return 'Team member access'
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
            </div>
            <div className="bg-teal-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Validating Invitation</h2>
            <p className="text-gray-600">Please wait while we verify your invitation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!invitationValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
            </div>
            
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Invalid Invitation</h2>
            <p className="text-gray-600 mb-8">
              {error || 'This invitation link is invalid or has expired. Please contact the team administrator for a new invitation.'}
            </p>
            <a
              href="mailto:hello@waveorder.app"
              className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">WaveOrder</span>
          </div>
          <div className="bg-teal-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Users className="w-12 h-12 text-teal-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join the Team!</h2>
          <p className="text-gray-600">
            You've been invited to join <strong>{invitationData?.businessName}</strong>
          </p>
        </div>

        {/* Invitation Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Business</p>
                <p className="font-medium text-gray-900">{invitationData?.businessName}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{invitationData?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitationData?.role || '')}`}>
                  {invitationData?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-blue-800">
              <strong>{invitationData?.inviterName}</strong> invited you to join as {invitationData?.role}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {getRoleDescription(invitationData?.role || '')}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Password strength:</div>
                <div className="flex space-x-1">
                  <div className={`h-1 flex-1 rounded ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                  <div className={`h-1 flex-1 rounded ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Must include: 8+ characters, uppercase, lowercase, number
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Passwords do not match
              </p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || formData.password !== formData.confirmPassword || !validatePassword(formData.password) || !formData.name.trim()}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Joining Team...
              </>
            ) : (
              'Accept Invitation & Join Team'
            )}
          </button>
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your account will be created with the provided email</li>
            <li>• You'll be automatically signed in</li>
            <li>• You'll be redirected to the business dashboard</li>
            <li>• You can start managing orders and products right away</li>
          </ul>
        </div>
      </div>
    </div>
  )
}