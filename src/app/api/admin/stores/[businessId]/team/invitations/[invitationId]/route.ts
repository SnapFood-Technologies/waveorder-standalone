// src/app/api/admin/stores/[businessId]/team/invitations/[invitationId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendTeamInvitationEmail } from '@/lib/email'
import { canInviteMembers } from '@/lib/permissions'
import { logTeamAudit } from '@/lib/team-audit'


export async function POST(
  request: NextRequest,
  context: { params: Promise<{ businessId: string; invitationId: string }> }
) {
  try {
    const { businessId, invitationId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this business and can invite members
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      }
    })

    if (!businessUser || !canInviteMembers(businessUser.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get the invitation
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        businessId
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Invitation is no longer pending' },
        { status: 400 }
      )
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' }
      })

      return NextResponse.json(
        { message: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.businessUser.findFirst({
      where: {
        businessId,
        user: {
          email: invitation.email
        }
      }
    })

    if (existingMember) {
      // Mark invitation as accepted since user is already a member
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' }
      })

      return NextResponse.json(
        { message: 'User is already a team member' },
        { status: 400 }
      )
    }

    // Generate new token and extend expiry
    const newToken = generateInviteToken()
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Update invitation
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      }
    })

    // Get business name for email
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true }
    })

    // Get inviter name
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    // Resend invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/team/invite/${newToken}`
    await sendTeamInvitationEmail({
      to: invitation.email,
      businessName: business?.name || 'Business',
      inviterName: inviter?.name || 'Team Admin',
      role: invitation.role,
      inviteUrl
    })

    // Log audit event
    await logTeamAudit({
      businessId,
      actorId: session.user.id,
      actorEmail: session.user.email || '',
      action: 'INVITATION_RESENT',
      targetEmail: invitation.email,
      details: { invitationId: invitation.id, role: invitation.role }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: newExpiresAt
      }
    })

  } catch (error) {
    console.error('Resend invitation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ businessId: string; invitationId: string }> }
) {
  try {
    const { businessId, invitationId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this business and can invite members
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      }
    })

    if (!businessUser || !canInviteMembers(businessUser.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get the invitation
    const invitation = await prisma.teamInvitation.findFirst({
      where: {
        id: invitationId,
        businessId
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Invitation is no longer pending' },
        { status: 400 }
      )
    }

    // Cancel the invitation
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' }
    })

    // Log audit event
    await logTeamAudit({
      businessId,
      actorId: session.user.id,
      actorEmail: session.user.email || '',
      action: 'INVITATION_CANCELLED',
      targetEmail: invitation.email,
      details: { invitationId: invitation.id, role: invitation.role }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel invitation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInviteToken(): string {
  // Use crypto.randomUUID() for secure token generation
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}
