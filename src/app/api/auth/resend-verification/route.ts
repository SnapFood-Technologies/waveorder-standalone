// src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const token = randomBytes(32).toString('hex')
    const expires = new Date()
    expires.setHours(expires.getHours() + 24)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationExpiry: expires
      }
    })

    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email-change?token=${token}&email=${encodeURIComponent(user.email)}`

    await sendVerificationEmail({
      to: user.email,
      name: user.name || 'User',
      verificationUrl
    })

    return NextResponse.json({
      message: 'Verification email sent successfully'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { message: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}