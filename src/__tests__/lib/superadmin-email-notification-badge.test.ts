import { describe, it, expect } from 'vitest'
import { superAdminNotificationSourceBadgeHtml } from '@/lib/superadmin-email-notification'

describe('superAdminNotificationSourceBadgeHtml', () => {
  it('order: customer pill label', () => {
    const html = superAdminNotificationSourceBadgeHtml(false, 'order')
    expect(html).toContain('Customer order')
    expect(html).not.toContain('shop admin')
  })

  it('order: shop admin pill label', () => {
    const html = superAdminNotificationSourceBadgeHtml(true, 'order')
    expect(html).toContain('Created by shop admin')
    expect(html).not.toContain('Customer order')
  })

  it('booking: customer vs admin labels', () => {
    expect(superAdminNotificationSourceBadgeHtml(false, 'booking')).toContain('Customer booking')
    expect(superAdminNotificationSourceBadgeHtml(true, 'booking')).toContain('Created by shop admin')
  })
})
