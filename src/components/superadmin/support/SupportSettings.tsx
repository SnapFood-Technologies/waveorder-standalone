// src/components/superadmin/support/SupportSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle, Clock, Mail, Bell, User, Settings, Phone, MessageSquare, Globe } from 'lucide-react'

interface SupportSettings {
  autoAssignTickets: boolean
  defaultTicketPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  responseTimeSLA: number // in hours
  emailNotifications: {
    ticketCreated: boolean
    ticketUpdated: boolean
    ticketResolved: boolean
    messageReceived: boolean
  }
  businessNotifications: {
    ticketCreated: boolean
    ticketUpdated: boolean
    ticketResolved: boolean
    messageReceived: boolean
  }
  workingHours: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }
  superAdminEmailSettings: {
    primaryEmail: string
    backupEmails: string[]
    emailFrequency: 'immediate' | 'hourly' | 'daily'
    emailDigest: boolean
    urgentOnly: boolean
  }
  supportContactSettings: {
    supportEmail: string
    supportPhone: string
    supportWebsite: string
    supportHours: string
    responseTime: string
    emergencyContact: string
    supportMessage: string
    supportTeamName: string
  }
}

export function SupportSettings() {
  const [settings, setSettings] = useState<SupportSettings>({
    autoAssignTickets: false,
    defaultTicketPriority: 'MEDIUM',
    responseTimeSLA: 24,
    emailNotifications: {
      ticketCreated: true,
      ticketUpdated: true,
      ticketResolved: true,
      messageReceived: true
    },
    businessNotifications: {
      ticketCreated: true,
      ticketUpdated: true,
      ticketResolved: true,
      messageReceived: true
    },
    workingHours: {
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'UTC'
    },
    superAdminEmailSettings: {
      primaryEmail: '',
      backupEmails: [],
      emailFrequency: 'immediate',
      emailDigest: false,
      urgentOnly: false
    },
    supportContactSettings: {
      supportEmail: 'support@waveorder.app',
      supportPhone: '+1 (555) 123-4567',
      supportWebsite: 'https://waveorder.app/support',
      supportHours: 'Monday - Friday, 9:00 AM - 6:00 PM EST',
      responseTime: 'Within 24 hours',
      emergencyContact: 'emergency@waveorder.app',
      supportMessage: 'We\'re here to help! Contact us anytime for support with your WaveOrder store.',
      supportTeamName: 'WaveOrder Support Team'
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/superadmin/support/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/superadmin/support/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current = newSettings as any
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Support Settings</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure support system behavior and notification preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Ticket Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Management</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-assign tickets</label>
              <p className="text-sm text-gray-500">Automatically assign new tickets to available support staff</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoAssignTickets}
              onChange={(e) => handleChange('autoAssignTickets', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default ticket priority</label>
            <select
              value={settings.defaultTicketPriority}
              onChange={(e) => handleChange('defaultTicketPriority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Response time SLA (hours)</label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.responseTimeSLA}
              onChange={(e) => handleChange('responseTimeSLA', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-sm text-gray-500 mt-1">Expected response time for new tickets</p>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="w-5 h-5 mr-2 text-teal-600" />
          Email Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Ticket created</label>
              <p className="text-sm text-gray-500">Send email when a new ticket is created</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications.ticketCreated}
              onChange={(e) => handleChange('emailNotifications.ticketCreated', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Ticket updated</label>
              <p className="text-sm text-gray-500">Send email when a ticket is updated</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications.ticketUpdated}
              onChange={(e) => handleChange('emailNotifications.ticketUpdated', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Ticket resolved</label>
              <p className="text-sm text-gray-500">Send email when a ticket is resolved</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications.ticketResolved}
              onChange={(e) => handleChange('emailNotifications.ticketResolved', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Message received</label>
              <p className="text-sm text-gray-500">Send email when a new message is received</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications.messageReceived}
              onChange={(e) => handleChange('emailNotifications.messageReceived', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Business Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-teal-600" />
          Business Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Ticket created</label>
              <p className="text-sm text-gray-500">Notify business when a ticket is created</p>
            </div>
            <input
              type="checkbox"
              checked={settings.businessNotifications.ticketCreated}
              onChange={(e) => handleChange('businessNotifications.ticketCreated', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Ticket updated</label>
              <p className="text-sm text-gray-500">Notify business when a ticket is updated</p>
            </div>
            <input
              type="checkbox"
              checked={settings.businessNotifications.ticketUpdated}
              onChange={(e) => handleChange('businessNotifications.ticketUpdated', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Ticket resolved</label>
              <p className="text-sm text-gray-500">Notify business when a ticket is resolved</p>
            </div>
            <input
              type="checkbox"
              checked={settings.businessNotifications.ticketResolved}
              onChange={(e) => handleChange('businessNotifications.ticketResolved', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Message received</label>
              <p className="text-sm text-gray-500">Notify business when a new message is received</p>
            </div>
            <input
              type="checkbox"
              checked={settings.businessNotifications.messageReceived}
              onChange={(e) => handleChange('businessNotifications.messageReceived', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* SuperAdmin Email Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-teal-600" />
          SuperAdmin Email Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary email address</label>
            <input
              type="email"
              value={settings.superAdminEmailSettings.primaryEmail}
              onChange={(e) => handleChange('superAdminEmailSettings.primaryEmail', e.target.value)}
              placeholder="admin@waveorder.app"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-sm text-gray-500 mt-1">Main email address for receiving support notifications</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup email addresses</label>
            <div className="space-y-2">
              {settings.superAdminEmailSettings.backupEmails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...settings.superAdminEmailSettings.backupEmails]
                      newEmails[index] = e.target.value
                      handleChange('superAdminEmailSettings.backupEmails', newEmails)
                    }}
                    placeholder="backup@waveorder.app"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newEmails = settings.superAdminEmailSettings.backupEmails.filter((_, i) => i !== index)
                      handleChange('superAdminEmailSettings.backupEmails', newEmails)
                    }}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newEmails = [...settings.superAdminEmailSettings.backupEmails, '']
                  handleChange('superAdminEmailSettings.backupEmails', newEmails)
                }}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                + Add backup email
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Additional email addresses to receive notifications</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email frequency</label>
            <select
              value={settings.superAdminEmailSettings.emailFrequency}
              onChange={(e) => handleChange('superAdminEmailSettings.emailFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly digest</option>
              <option value="daily">Daily digest</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">How often to receive email notifications</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Email digest</label>
              <p className="text-sm text-gray-500">Group multiple notifications into a single email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.superAdminEmailSettings.emailDigest}
              onChange={(e) => handleChange('superAdminEmailSettings.emailDigest', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Urgent notifications only</label>
              <p className="text-sm text-gray-500">Only receive emails for urgent tickets and high-priority messages</p>
            </div>
            <input
              type="checkbox"
              checked={settings.superAdminEmailSettings.urgentOnly}
              onChange={(e) => handleChange('superAdminEmailSettings.urgentOnly', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Support Contact Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-teal-600" />
          Support Contact Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Team Name</label>
            <input
              type="text"
              value={settings.supportContactSettings.supportTeamName}
              onChange={(e) => handleChange('supportContactSettings.supportTeamName', e.target.value)}
              placeholder="WaveOrder Support Team"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-sm text-gray-500 mt-1">Name that will appear when SuperAdmin sends messages (instead of actual user name)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.supportContactSettings.supportEmail}
                onChange={(e) => handleChange('supportContactSettings.supportEmail', e.target.value)}
                placeholder="support@waveorder.app"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="text-sm text-gray-500 mt-1">Primary support email address</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
              <input
                type="tel"
                value={settings.supportContactSettings.supportPhone}
                onChange={(e) => handleChange('supportContactSettings.supportPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="text-sm text-gray-500 mt-1">Support phone number</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Website</label>
            <input
              type="url"
              value={settings.supportContactSettings.supportWebsite}
              onChange={(e) => handleChange('supportContactSettings.supportWebsite', e.target.value)}
              placeholder="https://waveorder.app/support"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-sm text-gray-500 mt-1">Support website URL</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Hours</label>
              <input
                type="text"
                value={settings.supportContactSettings.supportHours}
                onChange={(e) => handleChange('supportContactSettings.supportHours', e.target.value)}
                placeholder="Monday - Friday, 9:00 AM - 6:00 PM EST"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="text-sm text-gray-500 mt-1">Business hours for support</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Response Time</label>
              <input
                type="text"
                value={settings.supportContactSettings.responseTime}
                onChange={(e) => handleChange('supportContactSettings.responseTime', e.target.value)}
                placeholder="Within 24 hours"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="text-sm text-gray-500 mt-1">Expected response time</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
            <input
              type="email"
              value={settings.supportContactSettings.emergencyContact}
              onChange={(e) => handleChange('supportContactSettings.emergencyContact', e.target.value)}
              placeholder="emergency@waveorder.app"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-sm text-gray-500 mt-1">Emergency contact email for urgent issues</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Support Message</label>
            <textarea
              value={settings.supportContactSettings.supportMessage}
              onChange={(e) => handleChange('supportContactSettings.supportMessage', e.target.value)}
              placeholder="We're here to help! Contact us anytime for support with your WaveOrder store."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-sm text-gray-500 mt-1">Welcome message shown to users when they contact support</p>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-teal-600" />
          Working Hours
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable working hours</label>
              <p className="text-sm text-gray-500">Set specific working hours for support</p>
            </div>
            <input
              type="checkbox"
              checked={settings.workingHours.enabled}
              onChange={(e) => handleChange('workingHours.enabled', e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
          </div>

          {settings.workingHours.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
                <input
                  type="time"
                  value={settings.workingHours.startTime}
                  onChange={(e) => handleChange('workingHours.startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End time</label>
                <input
                  type="time"
                  value={settings.workingHours.endTime}
                  onChange={(e) => handleChange('workingHours.endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.workingHours.timezone}
                  onChange={(e) => handleChange('workingHours.timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
