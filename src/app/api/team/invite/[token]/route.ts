// app/api/team/invite/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'


// GET - Validate invitation and return details
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
      return NextResponse.json({ 
        valid: false,
        message: 'Invalid invitation token' 
      }, { status: 404 })
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' }
      })
      
      return NextResponse.json({ 
        valid: false,
        message: 'This invitation has expired' 
      }, { status: 400 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ 
        valid: false,
        message: 'This invitation has already been used or cancelled' 
      }, { status: 400 })
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (existingUser) {
      // Check if already a member of this business
      const existingMember = await prisma.businessUser.findFirst({
        where: {
          userId: existingUser.id,
          businessId: invitation.businessId
        }
      })

      if (existingMember) {
        return NextResponse.json({
          valid: false,
          message: 'You are already a member of this team. Please sign in instead.',
          shouldRedirectToLogin: true
        }, { status: 400 })
      }
    }

    // Return invitation details for the form
    return NextResponse.json({
      valid: true,
      email: invitation.email,
      businessName: invitation.business.name,
      businessId: invitation.business.id,
      role: invitation.role,
      inviterName: 'Team Admin', // You can fetch actual inviter if needed
      expiresAt: invitation.expiresAt
    })

  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json({ 
      valid: false,
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Accept invitation (create account + join team)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { name, password } = await request.json()

    // Validate input
    if (!name || !password) {
      return NextResponse.json({ 
        message: 'Name and password are required' 
      }, { status: 400 })
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { business: true }
    })

    if (!invitation) {
      return NextResponse.json({ 
        message: 'Invalid invitation token' 
      }, { status: 404 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ 
        message: 'This invitation has expired' 
      }, { status: 400 })
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ 
        message: 'This invitation has already been used' 
      }, { status: 400 })
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (user) {
      // User exists - check if already a member
      const existingMember = await prisma.businessUser.findFirst({
        where: {
          userId: user.id,
          businessId: invitation.businessId
        }
      })

      if (existingMember) {
        return NextResponse.json({
          message: 'You are already a member of this team'
        }, { status: 400 })
      }

      // User exists but not a member - just add them to business
      await prisma.businessUser.create({
        data: {
          userId: user.id,
          businessId: invitation.businessId,
          role: invitation.role
        }
      })
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10)
      
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: invitation.email,
          password: hashedPassword,
          emailVerified: new Date(), // Auto-verify since invited
          role: 'BUSINESS_OWNER'
        }
      })

      // Add user to business
      await prisma.businessUser.create({
        data: {
          userId: user.id,
          businessId: invitation.businessId,
          role: invitation.role
        }
      })
    }

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      business: {
        id: invitation.business.id,
        name: invitation.business.name,
        slug: invitation.business.slug
      },
      role: invitation.role
    })

  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json({ 
      message: 'Failed to accept invitation. Please try again.' 
    }, { status: 500 })
  } finally {
  }
}