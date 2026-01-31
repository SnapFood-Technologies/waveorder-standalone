// src/app/api/admin/stores/[businessId]/team/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendTeamInvitationEmail } from '@/lib/email'
import { canInviteMembers } from '@/lib/permissions'
import { logTeamAudit } from '@/lib/team-audit'
import { getPlanLimits } from '@/lib/stripe'


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get all team members for this business
    const members = await prisma.businessUser.findMany({
      where: {
        businessId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            updatedAt: true
          }
        }
      },
      orderBy: [
        { role: 'desc' }, // OWNER first
        { createdAt: 'asc' }
      ]
    })

    const formattedMembers = members.map(member => ({
      id: member.id,
      userId: member.userId,
      name: member.user.name || 'Unknown',
      email: member.user.email,
      role: member.role,
      joinedAt: member.createdAt,
      lastActive: member.user.updatedAt
    }))

    return NextResponse.json({ members: formattedMembers })

  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params
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

    // Get business owner's plan to check team member limit
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const planLimits = getPlanLimits(userPlan)
    
    // Check if plan allows team members
    if (planLimits.teamMembers === 0) {
      return NextResponse.json({ 
        message: `Team access is not available on the ${userPlan} plan. Please upgrade to the Business plan to add team members.`,
        code: 'TEAM_ACCESS_NOT_AVAILABLE',
        plan: userPlan
      }, { status: 403 })
    }
    
    // Count current team members (excluding owner)
    const currentTeamCount = await prisma.businessUser.count({
      where: { 
        businessId,
        role: { not: 'OWNER' }
      }
    })
    
    // Also count pending invitations
    const pendingInvitations = await prisma.teamInvitation.count({
      where: {
        businessId,
        status: 'PENDING'
      }
    })
    
    const totalTeamSize = currentTeamCount + pendingInvitations
    
    // Check if user can add more team members
    if (totalTeamSize >= planLimits.teamMembers) {
      return NextResponse.json({ 
        message: `Team member limit reached. Your ${userPlan} plan allows up to ${planLimits.teamMembers} team members. You currently have ${currentTeamCount} members and ${pendingInvitations} pending invitations.`,
        code: 'TEAM_LIMIT_REACHED',
        currentCount: currentTeamCount,
        pendingCount: pendingInvitations,
        limit: planLimits.teamMembers,
        plan: userPlan
      }, { status: 403 })
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { message: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['MANAGER', 'STAFF'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Must be MANAGER or STAFF' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.businessUser.findFirst({
      where: {
        businessId,
        user: {
          email
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { message: 'User is already a team member' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        businessId,
        email,
        status: 'PENDING'
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { message: 'Invitation already sent to this email' },
        { status: 400 }
      )
    }

    // Rate limiting: max 10 invitations per hour per business
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentInvitations = await prisma.teamInvitation.count({
      where: {
        businessId,
        createdAt: {
          gte: oneHourAgo
        }
      }
    })

    if (recentInvitations >= 10) {
      return NextResponse.json(
        { message: 'Too many invitations sent. Please wait before sending more.' },
        { status: 429 }
      )
    }

    // Generate invitation token
    const token = generateInviteToken()
    
    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        email: email.trim().toLowerCase(),
        businessId,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'PENDING'
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

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/team/invite/${token}`
    await sendTeamInvitationEmail({
      to: email,
      businessName: business?.name || 'Business',
      inviterName: inviter?.name || 'Team Admin',
      role,
      inviteUrl
    })

    // Log audit event
    await logTeamAudit({
      businessId,
      actorId: session.user.id,
      actorEmail: session.user.email || '',
      action: 'MEMBER_INVITED',
      targetEmail: email,
      details: { role, invitationId: invitation.id }
    })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      },
      message: 'Invitation sent successfully'
    })

  } catch (error) {
    console.error('Invite team member error:', error)
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
