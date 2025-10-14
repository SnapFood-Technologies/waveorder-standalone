// src/app/api/user/verify-email-change/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailChangeToken: token,
        emailChangeExpiry: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true,
        pendingEmail: true,
        name: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    if (!user.pendingEmail) {
      return NextResponse.json(
        { error: 'No pending email change found' },
        { status: 400 }
      )
    }

    // Check if the pending email is now taken
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: user.pendingEmail,
        id: { not: user.id }
      }
    })

    if (emailTaken) {
      // Clean up the pending change
      await prisma.user.update({
        where: { id: user.id },
        data: {
          pendingEmail: null,
          emailChangeToken: null,
          emailChangeExpiry: null
        }
      })
      
      return NextResponse.json(
        { error: 'This email is now in use by another account' },
        { status: 400 }
      )
    }

    // Update email and clear pending change
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail,
        emailVerified: new Date(),
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpiry: null
      }
    })

    return NextResponse.json({
      message: 'Email changed successfully',
      newEmail: user.pendingEmail
    })
  } catch (error) {
    console.error('Email change verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email change' },
      { status: 500 }
    )
  }
}