import { describe, it, expect } from 'vitest'
import { renderMixFollowUpMessage, buildCustomerFollowUpWhatsappUrl } from '@/lib/whatsapp-mix-followup'

describe('whatsapp-mix-followup', () => {
  it('renders default template with placeholders', () => {
    const msg = renderMixFollowUpMessage(null, {
      orderNumber: 42,
      businessName: 'Test Cafe',
      orderId: 'abc',
    })
    expect(msg).toContain('#42')
    expect(msg).toContain('Test Cafe')
    expect(msg).toContain('WaveOrder')
  })

  it('uses custom template when provided', () => {
    const msg = renderMixFollowUpMessage('Order {orderNumber} for {businessName}', {
      orderNumber: 1,
      businessName: 'X',
      orderId: 'id',
    })
    expect(msg).toBe('Order 1 for X')
  })

  it('builds wa.me url with encoded text', () => {
    const url = buildCustomerFollowUpWhatsappUrl(
      '+355691234567',
      'Hi {orderNumber}',
      { orderNumber: 9, businessName: 'B', orderId: 'x' }
    )
    expect(url.startsWith('https://wa.me/')).toBe(true)
    expect(url).toContain(encodeURIComponent('Hi 9'))
  })
})
