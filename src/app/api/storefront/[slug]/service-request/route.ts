// POST: Create a service request (form submission). SERVICES business only.
// Notifies business same as salon bookings: email + wa.me or direct Twilio based on superadmin setting.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendServiceRequestEmailNotification } from '@/lib/orderNotificationService'
import {
  sendServiceRequestNotification,
  getTwilioConfig,
  isTwilioConfigured,
} from '@/lib/twilio'

const VALID_REQUEST_TYPES = ['EMAIL_REQUEST', 'WHATSAPP_REQUEST']
const VALID_REQUESTER_TYPES = ['PERSON', 'COMPANY']

const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'

function formatWhatsAppNumberForWaMe(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const slug = (await context.params).slug
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { slug, isActive: true, setupWizardCompleted: true },
      select: { id: true, businessType: true }
    })

    if (!business || business.businessType !== 'SERVICES') {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await request.json()

    const preferredContact = body.preferredContact === 'WHATSAPP' ? 'WHATSAPP_REQUEST' : 'EMAIL_REQUEST'
    if (!VALID_REQUEST_TYPES.includes(preferredContact)) {
      return NextResponse.json({ error: 'Invalid preferred contact' }, { status: 400 })
    }

    const requesterType = body.requesterType === 'COMPANY' ? 'COMPANY' : 'PERSON'
    if (!VALID_REQUESTER_TYPES.includes(requesterType)) {
      return NextResponse.json({ error: 'Invalid requester type' }, { status: 400 })
    }

    const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!contactName || contactName.length < 2) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const companyName =
      requesterType === 'COMPANY' && typeof body.companyName === 'string'
        ? body.companyName.trim() || null
        : null
    const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
    const message = typeof body.message === 'string' ? body.message.trim() || null : null
    let serviceIds: string[] | null = null
    if (Array.isArray(body.serviceIds)) {
      serviceIds = body.serviceIds.filter((id: unknown) => typeof id === 'string')
    } else if (body.serviceIds != null) {
      serviceIds = null
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        businessId: business.id,
        requestType: preferredContact,
        requesterType,
        contactName,
        companyName,
        email,
        phone,
        serviceIds: serviceIds ? (serviceIds as any) : undefined,
        message,
        status: 'NEW'
      }
    })

    // Notify business: same pattern as salon bookings (email + wa.me or direct Twilio)
    const businessWithNotifications = await prisma.business.findUnique({
      where: { id: business.id },
      select: {
        name: true,
        slug: true,
        orderNotificationsEnabled: true,
        orderNotificationEmail: true,
        email: true,
        whatsappNumber: true,
        whatsappDirectNotifications: true,
        currency: true,
        businessType: true,
        language: true,
      }
    })

    if (businessWithNotifications) {
      const adminLink = `${baseUrl}/admin/stores/${business.id}/service-requests/${serviceRequest.id}`
      const messageSnippet = (message || 'No message').slice(0, 100)
      const useDirectNotification =
        !!businessWithNotifications.whatsappDirectNotifications &&
        isTwilioConfigured() &&
        !!getTwilioConfig()?.serviceRequestContentSid

      // Email to business (when order notifications enabled)
      if (businessWithNotifications.orderNotificationsEnabled) {
        let whatsappUrl: string | undefined
        if (
          !useDirectNotification &&
          businessWithNotifications.whatsappNumber?.trim()
        ) {
          const waMeText = [
            `New service request from ${contactName}.`,
            `Email: ${email}.`,
            phone ? `Phone: ${phone}.` : null,
            `Preferred contact: ${preferredContact === 'WHATSAPP_REQUEST' ? 'WhatsApp' : 'Email'}.`,
            message ? `Message: ${messageSnippet}` : null,
            `View: ${adminLink}`
          ]
            .filter(Boolean)
            .join(' ')
          const cleanNumber = formatWhatsAppNumberForWaMe(businessWithNotifications.whatsappNumber)
          whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(waMeText)}`
        }

        await sendServiceRequestEmailNotification(
          {
            id: serviceRequest.id,
            contactName,
            companyName,
            email,
            phone,
            requestType: preferredContact,
            message,
            adminLink
          },
          {
            name: businessWithNotifications.name,
            orderNotificationsEnabled: true,
            orderNotificationEmail: businessWithNotifications.orderNotificationEmail,
            email: businessWithNotifications.email,
            currency: businessWithNotifications.currency,
            businessType: businessWithNotifications.businessType,
            language: businessWithNotifications.language
          },
          { whatsappUrl }
        )
      }

      // Direct Twilio WhatsApp to business (when superadmin enabled and template configured)
      if (useDirectNotification && businessWithNotifications.whatsappNumber?.trim()) {
        try {
          await sendServiceRequestNotification(
            businessWithNotifications.whatsappNumber,
            {
              contactName,
              email,
              phone,
              preferredContact,
              messageSnippet,
              adminLink
            }
          } catch (twilioErr) {
            console.error('Service request Twilio notification failed:', twilioErr)
          }
        }
      }
    }

    return NextResponse.json(
      { id: serviceRequest.id, message: 'Request received' },
      { status: 201 }
    )
  } catch (e) {
    console.error('Service request create error:', e)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}
