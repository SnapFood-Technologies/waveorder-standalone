// src/components/site/Contact.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock, MessageSquare, HelpCircle, Calendar, Send, CheckCircle, AlertCircle } from 'lucide-react'
import FAQ from './FAQ'

interface FormErrors {
  name?: string
  email?: string
  company?: string
  useCase?: string
  subject?: string
  message?: string
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    subject: 'general',
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  // Helper function to display subject options
  const getSubjectDisplay = (subject: string): string => {
    const subjects: Record<string, string> = {
      'general': 'General Question',
      'demo': 'Schedule Demo',
      'setup': 'Setup Help',
      'billing': 'Billing Question',
      'technical': 'Technical Support',
      'feature': 'Feature Request'
    }
    return subjects[subject] || 'General Question'
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name)) {
      newErrors.name = 'Name contains invalid characters'
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    } else if (formData.email.length > 255) {
      newErrors.email = 'Email must be less than 255 characters'
    }

    // Company validation (optional)
    if (formData.company && formData.company.length > 100) {
      newErrors.company = 'Company name must be less than 100 characters'
    }

    // Subject validation
    const validSubjects = ['general', 'demo', 'setup', 'billing', 'technical', 'feature']
    if (!validSubjects.includes(formData.subject)) {
      newErrors.subject = 'Please select a valid subject'
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    } else if (formData.message.length > 2000) {
      newErrors.message = 'Message must be less than 2000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError('Too many requests. Please wait 15 minutes before sending another message.')
        } else if (data.details && Array.isArray(data.details)) {
          // Handle validation errors from API
          const newErrors: FormErrors = {}
          data.details.forEach((detail: any) => {
            if (detail.field && detail.message) {
              newErrors[detail.field as keyof FormErrors] = detail.message
            }
          })
          setErrors(newErrors)
        } else {
          setError(data.error || 'Failed to send message. Please try again.')
        }
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Contact form error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
    
    if (error) {
      setError(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      useCase: '',
      subject: 'general',
      message: ''
    })
    setErrors({})
    setError(null)
    setSubmitted(false)
  }


  // Success page
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
            {/* Success Icon */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4 rounded-full w-20 h-20 mb-4 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Message Sent Successfully!</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Thank you for reaching out! We've received your message about "{getSubjectDisplay(formData.subject)}" and our team will review it carefully.
              </p>
            </div>

            {/* What happens next */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-6 mb-6 border border-teal-100">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-teal-600" />
                What happens next?
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>We'll review your {getSubjectDisplay(formData.subject).toLowerCase()} inquiry within 24 hours</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>You'll receive a detailed response at {formData.email}</span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span>Check your email for a confirmation message</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={resetForm}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Send Another Message
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
                >
                  Back to Home
                </Link>
                <Link
                  href="/demo"
                  className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors text-center font-medium"
                >
                Video Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main contact form page
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-6 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              We're Here to Help
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Have questions about WhatsApp ordering? Need help setting up your catalog? 
              Want to schedule a demo? Our support team is ready to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Contact Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Send Us a Message
                </h3>
                <p className="text-gray-600">
                  Fill out the form below and we'll get back to you within 24 hours
                </p>
              </div>

              {/* Global Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition-colors text-gray-900 placeholder:text-gray-500 ${
                        errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'
                      }`}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition-colors text-gray-900 placeholder:text-gray-500 ${
                        errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition-colors text-gray-900 placeholder:text-gray-500 ${
                        errors.company ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'
                      }`}
                      placeholder="Your business name"
                    />
                    {errors.company && (
                      <p className="mt-1 text-sm text-red-600">{errors.company}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-2">
                      Use Case
                    </label>
                    <select
                      id="useCase"
                      name="useCase"
                      value={formData.useCase}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition-colors text-gray-900 bg-white ${
                        errors.useCase ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'
                      }`}
                    >
                      <option value="">Select your use case</option>
                      <option value="restaurant">Restaurant / Cafe</option>
                      <option value="retail">Retail / E-commerce</option>
                      <option value="instagram">Instagram Seller</option>
                      <option value="salon">Salon / Beauty Studio</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.useCase && (
                      <p className="mt-1 text-sm text-red-600">{errors.useCase}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition-colors text-gray-900 bg-white ${
                      errors.subject ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'
                    }`}
                  >
                    <option value="general">General Question</option>
                    <option value="demo">Schedule Demo</option>
                    <option value="setup">Setup Help</option>
                    <option value="billing">Billing Question</option>
                    <option value="technical">Technical Support</option>
                    <option value="feature">Feature Request</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message * <span className="text-gray-500 text-xs">({formData.message.length}/2000)</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-teal-500 transition-colors resize-none text-gray-900 placeholder:text-gray-500 ${
                      errors.message ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'
                    }`}
                    placeholder="Tell us how we can help you..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <FAQ />
    </div>
  )
}