// src/components/admin/affiliates/AffiliateForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Link2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AffiliateFormProps {
  businessId: string
  affiliateId?: string
}

export function AffiliateForm({ businessId, affiliateId }: AffiliateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(!!affiliateId)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    commissionValue: '',
    trackingCode: '',
    isActive: true
  })

  useEffect(() => {
    if (affiliateId) {
      fetchAffiliate()
    }
  }, [affiliateId, businessId])

  const fetchAffiliate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/affiliates/${affiliateId}`)
      
      if (!response.ok) {
        const data = await response.json()
        if (data.enabled === false) {
          setEnabled(false)
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Failed to fetch affiliate')
      }

      const data = await response.json()
      setEnabled(true)
      setFormData({
        name: data.affiliate.name,
        email: data.affiliate.email || '',
        phone: data.affiliate.phone || '',
        notes: data.affiliate.notes || '',
        commissionType: data.affiliate.commissionType,
        commissionValue: data.affiliate.commissionValue.toString(),
        trackingCode: data.affiliate.trackingCode,
        isActive: data.affiliate.isActive
      })

      // Generate link
      const linkResponse = await fetch(`/api/admin/stores/${businessId}/affiliates/${affiliateId}/generate-link`)
      if (linkResponse.ok) {
        const linkData = await linkResponse.json()
        setAffiliateLink(linkData.link)
      }
    } catch (error) {
      console.error('Error fetching affiliate:', error)
      toast.error('Failed to load affiliate')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Affiliate name is required')
      return
    }

    if (!formData.commissionValue || parseFloat(formData.commissionValue) <= 0) {
      toast.error('Valid commission value is required')
      return
    }

    if (formData.commissionType === 'PERCENTAGE' && parseFloat(formData.commissionValue) > 100) {
      toast.error('Percentage commission cannot exceed 100%')
      return
    }

    setSaving(true)
    try {
      const url = affiliateId 
        ? `/api/admin/stores/${businessId}/affiliates/${affiliateId}`
        : `/api/admin/stores/${businessId}/affiliates`
      
      const method = affiliateId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
          commissionType: formData.commissionType,
          commissionValue: parseFloat(formData.commissionValue),
          trackingCode: formData.trackingCode.trim() || null,
          isActive: formData.isActive
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to save affiliate')
      }

      toast.success(affiliateId ? 'Affiliate updated successfully' : 'Affiliate created successfully')
      router.push(`/admin/stores/${businessId}/affiliates/list`)
    } catch (error) {
      console.error('Error saving affiliate:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save affiliate')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyLink = async () => {
    if (!affiliateLink && affiliateId) {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/affiliates/${affiliateId}/generate-link`)
        if (response.ok) {
          const data = await response.json()
          setAffiliateLink(data.link)
          await navigator.clipboard.writeText(data.link)
          setCopiedLink(true)
          toast.success('Link copied to clipboard!')
          setTimeout(() => setCopiedLink(false), 2000)
        }
      } catch (error) {
        toast.error('Failed to generate link')
      }
    } else if (affiliateLink) {
      await navigator.clipboard.writeText(affiliateLink)
      setCopiedLink(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Affiliate System Not Enabled
              </h3>
              <p className="text-yellow-800">
                Affiliate system is not enabled for this business. Please contact support to enable this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/stores/${businessId}/affiliates/list`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {affiliateId ? 'Edit Affiliate' : 'Create Affiliate'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {affiliateId ? 'Update affiliate information and settings' : 'Add a new affiliate to your program'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Affiliate Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Instagram Influencer @username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="affiliate@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Internal notes about this affiliate..."
              />
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Type *
              </label>
              <select
                value={formData.commissionType}
                onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="PERCENTAGE">Percentage of Order Total</option>
                <option value="FIXED">Fixed Amount per Order</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Value *
              </label>
              <div className="relative">
                {formData.commissionType === 'PERCENTAGE' ? (
                  <>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.commissionValue}
                      onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-12"
                      placeholder="10.0"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.commissionValue}
                      onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="5.00"
                    />
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.commissionType === 'PERCENTAGE' 
                  ? 'Percentage of order total (e.g., 10 for 10%)'
                  : 'Fixed amount per order (e.g., 5.00 for €5.00 per order)'
                }
              </p>
            </div>

            {!affiliateId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.trackingCode}
                  onChange={(e) => setFormData({ ...formData, trackingCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  placeholder="AFF001 (auto-generated if empty)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to auto-generate (e.g., AFF001, AFF002). Must be unique per business.
                </p>
              </div>
            )}

            {affiliateId && formData.trackingCode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Code
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-mono">
                    {formData.trackingCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
                {affiliateLink && (
                  <p className="text-xs text-gray-500 mt-2 break-all">
                    <Link2 className="w-3 h-3 inline mr-1" />
                    {affiliateLink}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (affiliate can receive commissions)
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <Link
            href={`/admin/stores/${businessId}/affiliates/list`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {affiliateId ? 'Update Affiliate' : 'Create Affiliate'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
