// src/components/admin/profile/UserProfileForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  User,
  Mail,
  Lock,
  Upload,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Camera,
  Info,
  Crown
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import EmailChangeSection from './EmailChangeSection'
import LoginActivitySection from './LoginActivitySection'

interface UserProfile {
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  plan: 'FREE' | 'PRO'
  pendingEmail?: string | null
}

export default function UserProfileForm() {
  const { data: session, update: updateSession } = useSession()
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    emailVerified: false,
    image: null,
    plan: 'FREE',
    pendingEmail: null
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setImagePreview(data.user.image)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Image must be JPEG, PNG, or WebP')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImageFile(file)
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(profile.image)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {}

    if (!profile.name.trim()) {
      newErrors.name = 'Name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) return

    setSaving(true)
    
    try {
      const formData = new FormData()
      formData.append('name', profile.name)
      formData.append('email', profile.email)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfile(data.user)
      setImagePreview(data.user.image)
      setImageFile(null)
      
      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
          email: data.user.email,
          image: data.user.image
        }
      })

      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    setSendingVerification(true)
    
    try {
      const response = await fetch('/api/user/send-verification', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification email')
      }

      toast.success('Verification email sent successfully! Please check your inbox.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send verification email')
    } finally {
      setSendingVerification(false)
    }
  }

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) return

    setChangingPassword(true)
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      toast.success('Password changed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-8xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">Manage your profile information and security settings</p>
            </div>
          </div>
          
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Keep Your Account Secure</h3>
                <p className="text-sm text-blue-700">
                  Update your profile information, verify your email address, and maintain a strong password to protect your account.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-sm text-gray-600">Update your account details and profile picture</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Picture
                  </label>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="relative flex-shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors shadow-lg"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Upload Photo
                      </button>
                      {imageFile && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="ml-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG or WebP. Max 5MB. Square recommended.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email - Read Only Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    
                    {profile.emailVerified ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Email verified</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Email not verified</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSendVerificationEmail}
                          disabled={sendingVerification}
                          className="px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {sendingVerification ? 'Sending...' : 'Send Verification'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Role & Plan */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <Shield className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900 text-sm">
                        {session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Business Owner'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subscription Plan
                    </label>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                      profile.plan === 'PRO' 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      {profile.plan === 'PRO' && <Crown className="w-4 h-4 text-purple-600" />}
                      <span className={`font-medium text-sm ${
                        profile.plan === 'PRO' ? 'text-purple-900' : 'text-gray-900'
                      }`}>
                        {profile.plan === 'PRO' ? 'PRO Plan' : 'FREE Plan'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Email Change Section Component */}
            <EmailChangeSection
              currentEmail={profile.email}
              emailVerified={profile.emailVerified}
              pendingEmail={profile.pendingEmail}
              onEmailChanged={fetchProfile}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Change Password */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                    <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.newPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Change Password Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Login Activity Section Component */}
            <LoginActivitySection />
          </div>
        </div>
      </div>
    </>
  )
}