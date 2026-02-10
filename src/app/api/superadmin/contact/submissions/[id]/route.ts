// src/app/api/superadmin/contact/submissions/[id]/route.ts
/**
 * SuperAdmin API: Individual Contact Submission
 * GET - Get submission details
 * PUT - Update status, send reply, convert to lead
 * DELETE - Delete submission
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ===========================================
// GET - Get submission details
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.contactMessage.findUnique({
      where: { id }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error fetching submission:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

// ===========================================
// PUT - Update status, send reply, or convert to lead
// ===========================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Verify submission exists
    const submission = await prisma.contactMessage.findUnique({
      where: { id }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Handle different actions
    switch (action) {
      // ---- Update Status ----
      case 'update_status': {
        const { status, adminNotes } = body
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'SPAM', 'CLOSED']
        
        if (!validStatuses.includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const updated = await prisma.contactMessage.update({
          where: { id },
          data: {
            status,
            ...(adminNotes !== undefined && { adminNotes }),
            ...(status === 'RESOLVED' && { respondedAt: new Date(), respondedBy: session.user.name || session.user.email })
          }
        })

        return NextResponse.json({ success: true, submission: updated })
      }

      // ---- Send Reply Email ----
      case 'send_reply': {
        const { replySubject, replyMessage } = body

        if (!replySubject || !replyMessage) {
          return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
        }

        // Build professional HTML email
        const htmlContent = `
          <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">WaveOrder Support</h1>
            </div>
            <div style="padding: 30px 20px; background: #fff; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 16px;">Hi ${submission.name},</p>
              <div style="margin: 0 0 16px; white-space: pre-wrap;">${replyMessage}</div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 13px; color: #6b7280; margin: 0;">
                This is in response to your message sent on ${new Date(submission.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
            </div>
            <div style="padding: 20px; text-align: center; background: #f9fafb; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} WaveOrder. All rights reserved.</p>
            </div>
          </div>
        `

        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'support@waveorder.app',
            to: submission.email,
            subject: replySubject,
            html: htmlContent,
            replyTo: 'support@waveorder.app'
          })

          // Update submission status
          await prisma.contactMessage.update({
            where: { id },
            data: {
              status: 'RESOLVED',
              respondedAt: new Date(),
              respondedBy: session.user.name || session.user.email,
              emailSent: true,
              emailSentAt: new Date()
            }
          })

          return NextResponse.json({ success: true, message: 'Reply sent successfully' })
        } catch (emailError) {
          console.error('Failed to send reply email:', emailError)
          return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }
      }

      // ---- Convert to Lead ----
      case 'convert_to_lead': {
        const { businessType, priority, notes, teamMemberId } = body

        // Check if already converted (by checking if a lead with same email exists)
        const existingLead = await prisma.lead.findFirst({
          where: { email: submission.email }
        })

        if (existingLead) {
          return NextResponse.json(
            { error: 'A lead with this email already exists', leadId: existingLead.id },
            { status: 409 }
          )
        }

        // Map contact subject to source detail
        const subjectMap: Record<string, string> = {
          GENERAL: 'General Inquiry',
          DEMO: 'Demo Request',
          SETUP: 'Setup Help',
          BILLING: 'Billing Question',
          TECHNICAL: 'Technical Support',
          FEATURE: 'Feature Request'
        }

        // Create lead from contact submission
        const lead = await prisma.lead.create({
          data: {
            name: submission.name,
            email: submission.email,
            company: submission.company,
            source: submission.subject === 'DEMO' ? 'DEMO_REQUEST' : 'WEBSITE',
            sourceDetail: subjectMap[submission.subject] || 'Website Contact Form',
            status: 'NEW',
            priority: priority || 'MEDIUM',
            businessType: businessType || null,
            notes: notes || `Converted from contact form submission.\n\nOriginal message:\n${submission.message}`,
            ipAddress: submission.ipAddress,
            userAgent: submission.userAgent,
            landingPage: submission.referer,
            ...(teamMemberId && { teamMemberId })
          }
        })

        // Create lead activity for the conversion
        await prisma.leadActivity.create({
          data: {
            leadId: lead.id,
            type: 'STATUS_CHANGE',
            title: 'Lead created from contact form',
            description: `Converted from contact submission (${subjectMap[submission.subject] || submission.subject}). Original message: "${submission.message.substring(0, 200)}${submission.message.length > 200 ? '...' : ''}"`,
            performedBy: session.user.name || session.user.email
          }
        })

        // Update contact submission status
        await prisma.contactMessage.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            adminNotes: `Converted to lead (ID: ${lead.id})${submission.adminNotes ? '\n\n' + submission.adminNotes : ''}`
          }
        })

        return NextResponse.json({ success: true, leadId: lead.id })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating submission:', error)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

// ===========================================
// DELETE - Delete submission
// ===========================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify exists
    const submission = await prisma.contactMessage.findUnique({
      where: { id }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    await prisma.contactMessage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
