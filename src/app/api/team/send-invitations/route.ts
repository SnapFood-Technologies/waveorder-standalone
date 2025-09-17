// app/api/team/send-invitations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { teamMembers, businessId } = await request.json()

    const invitations = await Promise.all(
      teamMembers.map(async (member: any) => {
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

        // TODO: Send actual email invitation
        console.log(`Invitation sent to ${member.email} with token: ${token}`)
        
        return invitation
      })
    )

    return NextResponse.json({ 
      success: true, 
      invitations: invitations.length,
      message: `${invitations.length} invitations sent successfully`
    })

  } catch (error) {
    console.error('Send invitations error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
