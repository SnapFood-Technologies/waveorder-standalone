import { describe, it, expect } from 'vitest'

/**
 * Phase 1: Webhook validation tests.
 * The full webhook requires Prisma/DB. We test the validation behavior
 * by calling the route with minimal/missing payloads.
 */
describe('Twilio incoming webhook', () => {
  it('rejects request when From is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/twilio/incoming/route')
    const formData = new FormData()
    formData.set('To', 'whatsapp:+15551234567')
    const request = new Request('http://localhost/api/webhooks/twilio/incoming', {
      method: 'POST',
      body: formData
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toContain('Missing')
  })

  it('rejects request when To is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/twilio/incoming/route')
    const formData = new FormData()
    formData.set('From', 'whatsapp:+15559876543')
    const request = new Request('http://localhost/api/webhooks/twilio/incoming', {
      method: 'POST',
      body: formData
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
