// GET and PATCH a single service request (form submission). SERVICES business only.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { sendServiceRequestStatusEmail } from '@/lib/customer-email-notification'
import { sendServiceRequestStatusUpdateToBusiness } from '@/lib/orderNotificationService'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string; requestId: string }> }
) {
  try {
    const { businessId, requestId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })
    if (business?.businessType !== 'SERVICES') {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const item = await prisma.serviceRequest.findFirst({
      where: { id: requestId, businessId }
    })
    if (!item) {
      return NextResponse.json({ message: 'Service request not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (e) {
    console.error('Service request get error:', e)
    return NextResponse.json({ message: 'Failed to load service request' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; requestId: string }> }
) {
  try {
    const { businessId, requestId } = await params
    const access = await checkBusinessAccess(businessId)
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true }
    })
    if (business?.businessType !== 'SERVICES') {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const existing = await prisma.serviceRequest.findFirst({
      where: { id: requestId, businessId }
    })
    if (!existing) {
      return NextResponse.json({ message: 'Service request not found' }, { status: 404 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (typeof body.status === 'string') data.status = body.status
    if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus === null || body.paymentStatus === '' ? null : String(body.paymentStatus)
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod === null || body.paymentMethod === '' ? null : String(body.paymentMethod)
    if (typeof body.amount === 'number') data.amount = body.amount
    if (body.amount === null) data.amount = null
    if (body.adminNotes !== undefined) data.adminNotes = body.adminNotes === null || body.adminNotes === '' ? null : String(body.adminNotes)

    const statusChanged = typeof body.status === 'string' && body.status !== existing.status

    const updated = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: data as any
    })

    // Notify customer and/or business when status changes (same pattern as appointment status emails)
    if (statusChanged) {
      const businessWithNotifications = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          name: true,
          orderNotificationEmail: true,
          email: true,
          language: true,
          notifyAdminOnServiceRequestStatusUpdates: true,
          notifyCustomerOnServiceRequestStatus: true
        }
      })
      const baseUrl = process.env.NEXTAUTH_URL || 'https://waveorder.app'
      const adminLink = `${baseUrl}/admin/stores/${businessId}/service-requests/${requestId}`

      if (businessWithNotifications?.notifyCustomerOnServiceRequestStatus && existing.email?.trim()) {
        sendServiceRequestStatusEmail(
          { name: existing.contactName, email: existing.email },
          {
            contactName: existing.contactName,
            status: updated.status,
            businessName: businessWithNotifications.name,
            adminLink
          },
          { language: businessWithNotifications.language || undefined }
        ).catch((err) => console.error('Service request customer status email failed:', err))
      }

      if (businessWithNotifications?.notifyAdminOnServiceRequestStatusUpdates) {
        const toEmail = businessWithNotifications.orderNotificationEmail || businessWithNotifications.email
        if (toEmail?.trim()) {
          sendServiceRequestStatusUpdateToBusiness(
            toEmail,
            {
              contactName: existing.contactName,
              status: updated.status,
              id: requestId,
              adminLink
            },
            businessWithNotifications.name
          ).catch((err) => console.error('Service request business status email failed:', err))
        }
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error('Service request patch error:', e)
    return NextResponse.json({ message: 'Failed to update service request' }, { status: 500 })
  }
}
