// src/app/api/admin/stores/[businessId]/team/invitations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'

    // Validate status filter
    const validStatuses = ['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status filter' },
        { status: 400 }
      )
    }

    // Get invitations for this business
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        businessId,
        status: status as any
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Check for expired invitations if status is PENDING
    if (status === 'PENDING') {
      const now = new Date()
      const expiredInvitations = invitations.filter(inv => inv.expiresAt < now)
      
      if (expiredInvitations.length > 0) {
        // Update expired invitations in background
        await prisma.teamInvitation.updateMany({
          where: {
            id: {
              in: expiredInvitations.map(inv => inv.id)
            }
          },
          data: {
            status: 'EXPIRED'
          }
        })

        // Filter out expired invitations from response
        const activeInvitations = invitations.filter(inv => inv.expiresAt >= now)
        const formattedInvitations = activeInvitations.map(invitation => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          sentAt: invitation.createdAt
        }))

        return NextResponse.json({ invitations: formattedInvitations })
      }
    }

    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      sentAt: invitation.createdAt
    }))

    return NextResponse.json({ invitations: formattedInvitations })

  } catch (error) {
    console.error('Get team invitations error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
