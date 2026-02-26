// src/app/api/admin/stores/[businessId]/team/members/create/route.ts
// Manual team member creation (without email invitation)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canInviteMembers } from '@/lib/permissions'
import { getPlanLimits } from '@/lib/stripe'
import { hash } from 'bcryptjs'
import { logTeamAudit } from '@/lib/team-audit'
import crypto from 'crypto'

// Generate a secure random password
function generatePassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const values = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(values, (x) => charset[x % charset.length]).join('')
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

    // Check if manual team creation is enabled for this business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { enableManualTeamCreation: true }
    })

    if (!business?.enableManualTeamCreation) {
      return NextResponse.json({ 
        message: 'Manual team creation is not enabled for this business. Please contact support to enable this feature.',
        code: 'FEATURE_NOT_ENABLED'
      }, { status: 403 })
    }

    // Get business owner's plan to check team member limit
    const businessOwner = await prisma.businessUser.findFirst({
      where: { businessId, role: 'OWNER' },
      include: { user: { select: { plan: true } } }
    })
    
    const userPlan = (businessOwner?.user?.plan as 'STARTER' | 'PRO' | 'BUSINESS') || 'STARTER'
    const planLimits = getPlanLimits(userPlan)
    // When manual team creation is enabled, allow team access (5 members) even for PRO
    const teamMemberLimit = 5
    
    // Check if plan allows team members (0 for STARTER/PRO unless manual creation enabled)
    if (planLimits.teamMembers === 0 && !business.enableManualTeamCreation) {
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
    if (totalTeamSize >= teamMemberLimit) {
      return NextResponse.json({ 
        message: `Team member limit reached. Your plan allows up to ${teamMemberLimit} team members. You currently have ${currentTeamCount} members and ${pendingInvitations} pending invitations.`,
        code: 'TEAM_LIMIT_REACHED',
        currentCount: currentTeamCount,
        pendingCount: pendingInvitations,
        limit: teamMemberLimit,
        plan: userPlan
      }, { status: 403 })
    }

    const { name, email, role, phone } = await request.json()

    if (!name || !email || !role) {
      return NextResponse.json(
        { message: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['MANAGER', 'STAFF', 'DELIVERY'].includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Must be MANAGER, STAFF, or DELIVERY' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (existingUser) {
      // Check if user is already a member of this business
      const existingMember = await prisma.businessUser.findFirst({
        where: {
          userId: existingUser.id,
          businessId
        }
      })

      if (existingMember) {
        return NextResponse.json(
          { message: 'User is already a team member' },
          { status: 400 }
        )
      }

      // User exists but not a member - add them to the business
      const businessUserRecord = await prisma.businessUser.create({
        data: {
          userId: existingUser.id,
          businessId,
          role
        }
      })

      // Log audit event
      await logTeamAudit({
        businessId,
        actorId: session.user.id,
        actorEmail: session.user.email || '',
        action: 'MEMBER_INVITED',
        targetEmail: email,
        details: { role, method: 'MANUAL_CREATE' }
      })

      return NextResponse.json({
        success: true,
        member: {
          id: businessUserRecord.id,
          userId: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: businessUserRecord.role
        },
        message: 'User added to team successfully',
        credentials: null // No new credentials needed
      })
    }

    // Generate password
    const plainPassword = generatePassword()
    const hashedPassword = await hash(plainPassword, 12)

    // Create user account
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'BUSINESS_OWNER', // Default role, actual access controlled by BusinessUser
        emailVerified: new Date() // Auto-verify for manually created accounts
      }
    })

    // Create business user relationship
    const businessUserRecord = await prisma.businessUser.create({
      data: {
        userId: newUser.id,
        businessId,
        role
      }
    })

    // Log audit event
    await logTeamAudit({
      businessId,
      actorId: session.user.id,
      actorEmail: session.user.email || '',
      action: 'MEMBER_INVITED',
      targetEmail: email,
      details: { role, method: 'MANUAL_CREATE', userId: newUser.id }
    })

    return NextResponse.json({
      success: true,
      member: {
        id: businessUserRecord.id,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: businessUserRecord.role
      },
      credentials: {
        email: newUser.email,
        password: plainPassword // Return plain password for admin to copy/share
      },
      message: 'Team member created successfully'
    })

  } catch (error) {
    console.error('Create team member error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
