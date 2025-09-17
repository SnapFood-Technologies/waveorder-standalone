// New API route: app/api/team/invite/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ message: 'Invalid invitation token' }, { status: 404 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Invitation has expired' }, { status: 400 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ message: 'Invitation already used' }, { status: 400 })
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        business: invitation.business,
        expiresAt: invitation.expiresAt
      }
    })

  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { userId } = await request.json()

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { business: true }
    })

    if (!invitation || invitation.expiresAt < new Date() || invitation.status !== 'PENDING') {
      return NextResponse.json({ message: 'Invalid or expired invitation' }, { status: 400 })
    }

    // Create business user relationship
    await prisma.businessUser.create({
      data: {
        userId,
        businessId: invitation.businessId,
        role: invitation.role
      }
    })

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    })

    return NextResponse.json({
      success: true,
      business: invitation.business,
      role: invitation.role
    })

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}