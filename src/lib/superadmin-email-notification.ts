// src/lib/superadmin-email-notification.ts
// SuperAdmin copy notifications - short emails with business-type-specific icons
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)

const TEAL = '#0d9488'
const SVG_STYLE = `width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${TEAL}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"`

// Lucide-style inline SVG icons per business type
function getBusinessTypeIconSvg(businessType: string): string {
  const icons: Record<string, string> = {
    RESTAURANT: `<svg ${SVG_STYLE}><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/></svg>`,
    CAFE: `<svg ${SVG_STYLE}><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg>`,
    RETAIL: `<svg ${SVG_STYLE}><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>`,
    SALON: `<svg ${SVG_STYLE}><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>`,
    SERVICES: `<svg ${SVG_STYLE}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>`,
    JEWELRY: `<svg ${SVG_STYLE}><path d="M10.5 3 8 9l4 13 4-13-2.5-6"/><path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z"/><path d="M2 9h20"/></svg>`,
    FLORIST: `<svg ${SVG_STYLE}><path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"/><circle cx="12" cy="8" r="2"/><path d="M12 10v12"/><path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z"/><path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z"/></svg>`,
    GROCERY: `<svg ${SVG_STYLE}><path d="M12 6.528V3a1 1 0 0 1 1-1h0"/><path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21"/></svg>`,
    OTHER: `<svg ${SVG_STYLE}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
  }
  return icons[businessType] || icons.OTHER
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    ALL: 'L',
    BHD: 'BD',
    BBD: 'Bds$'
  }
  const symbol = symbols[currency] || currency
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Pill badge for SuperAdmin emails: shop admin vs customer storefront booking/order.
 * Exported for unit tests.
 */
export function superAdminNotificationSourceBadgeHtml(
  createdByAdmin: boolean,
  kind: 'order' | 'booking'
): string {
  const isAdmin = createdByAdmin === true
  const label = isAdmin
    ? 'Created by shop admin'
    : kind === 'booking'
      ? 'Customer booking'
      : 'Customer order'
  const bg = isAdmin ? '#eef2ff' : '#ecfdf5'
  const color = isAdmin ? '#3730a3' : '#047857'
  const border = isAdmin ? '#c7d2fe' : '#a7f3d0'
  return `<p style="margin: 0 0 20px 0;">
  <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; letter-spacing: 0.02em; background-color: ${bg}; color: ${color}; border: 1px solid ${border};">
    ${escapeHtml(label)}
  </span>
</p>`
}

// Base email template wrapper (matches WaveOrder style)
function createEmailTemplate(content: string, title: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - WaveOrder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px 20px; text-align: center;">
      <div style="display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <img src="https://waveorder.app/images/waveorder-logo.png" alt="WaveOrder" width="48" height="48" style="display: block; border-radius: 8px;" />
        <span style="color: white; margin-left: 12px; font-size: 28px; font-weight: 700;">WaveOrder</span>
      </div>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px;">SuperAdmin notification</p>
    </div>
    ${content}
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        Questions? Contact <a href="mailto:contact@waveorder.app" style="color: #0d9488; text-decoration: none;">contact@waveorder.app</a>
      </p>
      <p style="color: #9ca3af; margin: 12px 0 0; font-size: 12px;">© 2026 VenueBoost Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveorder.app'

/**
 * Send SuperAdmin order notification (RESTAURANT, CAFE, RETAIL, JEWELRY, FLORIST, GROCERY, OTHER)
 */
export async function sendSuperAdminOrderNotification(
  businessId: string,
  orderData: {
    orderNumber: string
    total: number
    currency: string
    createdAt: Date
    /** From Order.createdByAdmin — false for storefront self-checkout */
    createdByAdmin?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await prisma.superAdminNotificationSettings.findUnique({
      where: { businessId },
      include: { business: { select: { name: true, businessType: true } } }
    })

    if (
      !settings?.orderNotificationsEnabled ||
      !settings.notificationEmails?.length
    ) {
      return { success: true }
    }

    const business = settings.business
    const iconSvg = getBusinessTypeIconSvg(business.businessType)
    const formattedDate = new Date(orderData.createdAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
    const totalFormatted = formatCurrency(orderData.total, orderData.currency)
    const superAdminOrderUrl = `${baseUrl}/superadmin/businesses/${businessId}/orders`
    const sourceBadge = superAdminNotificationSourceBadgeHtml(
      orderData.createdByAdmin === true,
      'order'
    )

    const content = `
    <div style="padding: 40px 30px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        ${iconSvg}
        <h2 style="color: #1f2937; margin: 0; font-size: 22px; font-weight: 600;">
          New order at ${escapeHtml(business.name)}
        </h2>
      </div>
      ${sourceBadge}
      <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
        Order #${escapeHtml(orderData.orderNumber)} • ${escapeHtml(formattedDate)}
      </p>
      <p style="color: #1f2937; margin: 0 0 24px; font-size: 18px; font-weight: 600;">
        Total: ${escapeHtml(totalFormatted)}
      </p>
      <a href="${superAdminOrderUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View in SuperAdmin →
      </a>
    </div>`

    const html = createEmailTemplate(content, `New order – ${business.name}`)
    const subject = `New order – ${business.name} – #${orderData.orderNumber} – ${formattedDate}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: settings.notificationEmails,
      subject,
      html
    })

    return { success: true }
  } catch (error) {
    console.error('SuperAdmin order notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send'
    }
  }
}

/**
 * Send SuperAdmin booking notification (SALON, SERVICES - appointments)
 */
export async function sendSuperAdminBookingNotification(
  businessId: string,
  bookingData: {
    orderNumber: string
    appointmentDateTime: Date
    createdByAdmin?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await prisma.superAdminNotificationSettings.findUnique({
      where: { businessId },
      include: { business: { select: { name: true, businessType: true } } }
    })

    if (
      !settings?.bookingNotificationsEnabled ||
      !settings.notificationEmails?.length
    ) {
      return { success: true }
    }

    const business = settings.business
    const iconSvg = getBusinessTypeIconSvg(business.businessType)
    const formattedDate = new Date(bookingData.appointmentDateTime).toLocaleString(
      'en-US',
      { dateStyle: 'medium', timeStyle: 'short' }
    )
    const superAdminBookingsUrl = `${baseUrl}/superadmin/businesses/${businessId}/appointments`
    const sourceBadge = superAdminNotificationSourceBadgeHtml(
      bookingData.createdByAdmin === true,
      'booking'
    )

    const content = `
    <div style="padding: 40px 30px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        ${iconSvg}
        <h2 style="color: #1f2937; margin: 0; font-size: 22px; font-weight: 600;">
          New booking at ${escapeHtml(business.name)}
        </h2>
      </div>
      ${sourceBadge}
      <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
        Booking #${escapeHtml(bookingData.orderNumber)} • ${escapeHtml(formattedDate)}
      </p>
      <a href="${superAdminBookingsUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View in SuperAdmin →
      </a>
    </div>`

    const html = createEmailTemplate(content, `New booking – ${business.name}`)
    const subject = `New booking – ${business.name} – #${bookingData.orderNumber} – ${formattedDate}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: settings.notificationEmails,
      subject,
      html
    })

    return { success: true }
  } catch (error) {
    console.error('SuperAdmin booking notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send'
    }
  }
}

/**
 * Send SuperAdmin service request notification (SERVICES form submissions)
 */
export async function sendSuperAdminServiceRequestNotification(
  businessId: string,
  serviceRequestData: {
    contactName: string
    createdAt: Date
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await prisma.superAdminNotificationSettings.findUnique({
      where: { businessId },
      include: { business: { select: { name: true, businessType: true } } }
    })

    if (
      !settings?.serviceRequestNotificationsEnabled ||
      !settings.notificationEmails?.length
    ) {
      return { success: true }
    }

    const business = settings.business
    const iconSvg = getBusinessTypeIconSvg(business.businessType)
    const formattedDate = new Date(serviceRequestData.createdAt).toLocaleString(
      'en-US',
      { dateStyle: 'medium', timeStyle: 'short' }
    )
    const superAdminServiceRequestsUrl = `${baseUrl}/superadmin/businesses/${businessId}/service-requests`

    const content = `
    <div style="padding: 40px 30px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        ${iconSvg}
        <h2 style="color: #1f2937; margin: 0; font-size: 22px; font-weight: 600;">
          New service request at ${escapeHtml(business.name)}
        </h2>
      </div>
      <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
        From: ${escapeHtml(serviceRequestData.contactName)} • ${escapeHtml(formattedDate)}
      </p>
      <a href="${superAdminServiceRequestsUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        View in SuperAdmin →
      </a>
    </div>`

    const html = createEmailTemplate(
      content,
      `New service request – ${business.name}`
    )
    const subject = `New service request – ${business.name} – ${formattedDate}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: settings.notificationEmails,
      subject,
      html
    })

    return { success: true }
  } catch (error) {
    console.error('SuperAdmin service request notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send'
    }
  }
}
