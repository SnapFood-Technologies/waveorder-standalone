// src/app/api/user/change-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendEmailChangeVerification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { newEmail } = await request.json()

    // Validate email
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = newEmail.toLowerCase().trim()

    // Check if email is same as current
    if (normalizedEmail === session.user.email) {
      return NextResponse.json(
        { error: 'This is already your current email' },
        { status: 400 }
      )
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: session.user.id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already in use' },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 24) // 24 hours

    // Store pending email change
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pendingEmail: normalizedEmail,
        emailChangeToken: token,
        emailChangeExpiry: expires
      }
    })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true }
    })

    // Create verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email-change/${token}`

    // Send verification email to NEW email address
    try {
      await sendEmailChangeVerification({
        to: normalizedEmail,
        name: user?.name || 'User',
        currentEmail: user?.email || '',
        newEmail: normalizedEmail,
        verificationUrl
      })
    } catch (emailError) {
      console.error('Failed to send email change verification:', emailError)
      
      // Rollback the pending email change
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeExpiry: null
        }
      })
      
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification email sent successfully',
      pendingEmail: normalizedEmail
    })
  } catch (error) {
    console.error('Error initiating email change:', error)
    return NextResponse.json(
      { error: 'Failed to change email' },
      { status: 500 }
    )
  }
}