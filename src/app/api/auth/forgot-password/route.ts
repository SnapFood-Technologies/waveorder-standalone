import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'
import crypto from 'crypto'


export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, role: true }
    })

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, we sent a reset link' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpiry
      }
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
    
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name || 'there',
        resetUrl,
        role: user.role as 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'STAFF' | undefined
      })
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError)

      // Log email send failure
      const ipAddress = extractIPAddress(request)
      const userAgent = request.headers.get('user-agent') || undefined
      logSystemEvent({
        logType: 'password_reset_error',
        severity: 'error',
        endpoint: '/api/auth/forgot-password',
        method: 'POST',
        statusCode: 500,
        ipAddress,
        userAgent,
        url: request.url,
        errorMessage: 'Failed to send password reset email',
        metadata: { userId: user.id, email: user.email }
      })

      return NextResponse.json(
        { message: 'Failed to send reset email' },
        { status: 500 }
      )
    }

    // Log successful password reset request
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    logSystemEvent({
      logType: 'password_reset_requested',
      severity: 'info',
      endpoint: '/api/auth/forgot-password',
      method: 'POST',
      statusCode: 200,
      ipAddress,
      userAgent,
      url: request.url,
      metadata: { userId: user.id, email: user.email, role: user.role }
    })

    return NextResponse.json(
      { message: 'If an account with that email exists, we sent a reset link' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)

    // Log unexpected error
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    logSystemEvent({
      logType: 'password_reset_error',
      severity: 'error',
      endpoint: '/api/auth/forgot-password',
      method: 'POST',
      statusCode: 500,
      ipAddress,
      userAgent,
      url: request.url,
      errorMessage: error instanceof Error ? error.message : 'Forgot password internal error',
      errorStack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
