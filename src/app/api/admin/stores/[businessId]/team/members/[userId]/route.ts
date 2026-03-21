// src/app/api/admin/stores/[businessId]/team/members/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  canUpdateMemberRoles,
  canRemoveMembers,
  canManageUserRole,
  canRemoveUser,
  canEditMemberProfile,
} from '@/lib/permissions'
import { sendRoleChangedEmail, sendTeamMemberRemovedEmail } from '@/lib/email'
import { logTeamAudit } from '@/lib/team-audit'
import type { BusinessRole } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ businessId: string; userId: string }> }
) {
  try {
    const { businessId, userId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this business and can update roles
    const managerUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      }
    })

    if (!managerUser || !canUpdateMemberRoles(managerUser.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const isRoleUpdate = typeof body?.role === 'string' && body.role.length > 0

    // Get target membership once (role + profile flows)
    const targetUser = await prisma.businessUser.findFirst({
      where: {
        userId,
        businessId,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ message: 'Team member not found' }, { status: 404 })
    }

    // ── Update display name / phone (owner only; not other owners; not self) ──
    if (!isRoleUpdate) {
      const hasName = 'name' in body
      const hasPhone = 'phone' in body
      if (!hasName && !hasPhone) {
        return NextResponse.json(
          { message: 'Provide role, or name and/or phone to update' },
          { status: 400 }
        )
      }

      const { canEdit, reason } = canEditMemberProfile(
        managerUser.role,
        targetUser.role,
        userId,
        session.user.id
      )
      if (!canEdit) {
        return NextResponse.json({ message: reason }, { status: 403 })
      }

      const updateData: { name?: string; phone?: string | null } = {}
      if (hasName) {
        if (typeof body.name !== 'string' || !body.name.trim()) {
          return NextResponse.json({ message: 'Name must be a non-empty string' }, { status: 400 })
        }
        updateData.name = body.name.trim()
      }
      if (hasPhone) {
        if (body.phone === null || body.phone === '') {
          updateData.phone = null
        } else if (typeof body.phone === 'string') {
          updateData.phone = body.phone.trim() || null
        } else {
          return NextResponse.json({ message: 'Invalid phone' }, { status: 400 })
        }
      }

      const before = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, phone: true, email: true },
      })

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })

      const after = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, phone: true, email: true },
      })

      await logTeamAudit({
        businessId,
        actorId: session.user.id,
        actorEmail: session.user.email || '',
        action: 'MEMBER_PROFILE_UPDATED',
        targetId: userId,
        targetEmail: after?.email || before?.email || '',
        details: {
          before: { name: before?.name, phone: before?.phone },
          after: { name: after?.name, phone: after?.phone },
        },
        request,
      })

      return NextResponse.json({
        success: true,
        message: 'Member updated successfully',
        member: {
          userId,
          name: after?.name || '',
          email: after?.email,
          ...(after?.phone ? { phone: after.phone } : {}),
        },
      })
    }

    // ── Role change (existing behaviour) ──
    const rawRole = body.role as string

    // Validate role
    if (rawRole !== 'MANAGER' && rawRole !== 'STAFF') {
      return NextResponse.json(
        { message: 'Invalid role. Must be MANAGER or STAFF' },
        { status: 400 }
      )
    }
    const newRole: BusinessRole = rawRole

    // Check if manager can update this user's role
    const { canManage, reason: roleReason } = canManageUserRole(
      managerUser.role,
      targetUser.role,
      userId,
      session.user.id
    )

    if (!canManage) {
      return NextResponse.json(
        { message: roleReason },
        { status: 403 }
      )
    }

    // Update role
    await prisma.businessUser.update({
      where: {
        id: targetUser.id
      },
      data: {
        role: newRole,
      }
    })

    // Get user and business info for notification
    const [user, business, inviter] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true }
      })
    ])

    // Send role change notification email
    try {
      await sendRoleChangedEmail({
        // @ts-ignore
        to: user?.email,
        // @ts-ignore
        name: user?.name || 'Team Member',
        // @ts-ignore
        businessName: business?.name,
        oldRole: targetUser.role,
        newRole,
        // @ts-ignore
        changedBy: inviter?.name || 'Team Admin'
      })
    } catch (emailError) {
      console.error('Failed to send role change email:', emailError)
      // Don't fail the request if email fails
    }

    // Log audit event
    await logTeamAudit({
      businessId,
      actorId: session.user.id,
      actorEmail: session.user.email || '',
      action: 'MEMBER_ROLE_CHANGED',
      targetId: userId,
      targetEmail: user?.email || '',
      details: { oldRole: targetUser.role, newRole }
    })

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully'
    })

  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ businessId: string; userId: string }> }
) {
  try {
    const { businessId, userId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this business and can remove members
    const managerUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      }
    })

    if (!managerUser || !canRemoveMembers(managerUser.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    // Get target user's current role
    const targetUser = await prisma.businessUser.findFirst({
      where: {
        userId,
        businessId
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { message: 'Team member not found' },
        { status: 404 }
      )
    }

    // Check if manager can remove this user
    const { canRemove, reason } = canRemoveUser(
      managerUser.role,
      targetUser.role,
      userId,
      session.user.id
    )

    if (!canRemove) {
      return NextResponse.json(
        { message: reason },
        { status: 403 }
      )
    }

    // Check if this is the last OWNER (prevent removing last owner)
    if (targetUser.role === 'OWNER') {
      const ownerCount = await prisma.businessUser.count({
        where: {
          businessId,
          role: 'OWNER'
        }
      })

      if (ownerCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot remove the last business owner' },
          { status: 400 }
        )
      }
    }

    // Get user and business info for notification
    const [user, business, remover] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      }),
      prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true }
      })
    ])

    // Remove user from business
    await prisma.businessUser.delete({
      where: {
        id: targetUser.id
      }
    })

    // Send removal notification email
    try {
      await sendTeamMemberRemovedEmail({
        // @ts-ignore
        to: user.email,
        // @ts-ignore
        name: user.name || 'Team Member',
        // @ts-ignore
        businessName: business.name,
        // @ts-ignore
        removedBy: remover.name || 'Team Admin'
      })
    } catch (emailError) {
      console.error('Failed to send removal email:', emailError)
      // Don't fail the request if email fails
    }

    // Log audit event
    await logTeamAudit({
      businessId,
      actorId: session.user.id,
      actorEmail: session.user.email || '',
      action: 'MEMBER_REMOVED',
      targetId: userId,
      targetEmail: user?.email || '',
      details: { role: targetUser.role }
    })

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully'
    })

  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
