// Updated app/api/team/send-invitations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { sendTeamInvitationEmail } from '@/lib/email'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { teamMembers, businessId } = await request.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true }
    })

    if (!user || !business) {
      return NextResponse.json({ message: 'User or business not found' }, { status: 404 })
    }

    const successfulInvitations = []
    const failedInvitations = []

    for (const member of teamMembers) {
      try {
        const token = generateInviteToken()
        
        const invitation = await prisma.teamInvitation.create({
          data: {
            email: member.email,
            businessId,
            role: member.role,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })

        // Send invitation email
        const inviteUrl = `${process.env.NEXTAUTH_URL}/team/invite/${token}`
        await sendTeamInvitationEmail({
          to: member.email,
          businessName: business.name,
          inviterName: user.name || 'Team Admin',
          role: member.role,
          inviteUrl
        })
        
        successfulInvitations.push({ email: member.email, id: invitation.id })
        
      } catch (error) {
        console.error(`Failed to invite ${member.email}:`, error)
        // @ts-ignore
        failedInvitations.push({ email: member.email, error: error.message })
      }
    }

    return NextResponse.json({ 
      success: true, 
      invitations: successfulInvitations.length,
      successful: successfulInvitations,
      failed: failedInvitations,
      message: `${successfulInvitations.length} of ${teamMembers.length} invitations sent successfully`
    })

  } catch (error) {
    console.error('Send invitations error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}