import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { logSystemEvent, extractIPAddress } from '@/lib/systemLog'


export async function POST(request: NextRequest) {
  // Build the actual public URL from headers to avoid logging localhost in dev/proxy setups
  const reqHost = request.headers.get('host') || request.headers.get('x-forwarded-host')
  const reqProtocol = request.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const parsedUrl = new URL(request.url)
  const actualUrl = reqHost ? `${reqProtocol}://${reqHost}${parsedUrl.pathname}${parsedUrl.search}` : request.url

  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpiry: {
          gt: new Date() // Token not expired
        }
      }
    })

    if (!user) {
      // Log invalid/expired token attempt
      const ipAddress = extractIPAddress(request)
      const userAgent = request.headers.get('user-agent') || undefined
      logSystemEvent({
        logType: 'password_reset_error',
        severity: 'warning',
        endpoint: '/api/auth/reset-password',
        method: 'POST',
        statusCode: 400,
        ipAddress,
        userAgent,
        url: actualUrl,
        errorMessage: 'Invalid or expired reset token',
        metadata: { tokenProvided: !!token }
      })

      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 12)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpiry: null
      }
    })

    // Log successful password reset
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    logSystemEvent({
      logType: 'password_reset_completed',
      severity: 'info',
      endpoint: '/api/auth/reset-password',
      method: 'POST',
      statusCode: 200,
      ipAddress,
      userAgent,
      url: actualUrl,
      metadata: { userId: user.id, email: user.email }
    })

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset password error:', error)

    // Log unexpected error
    const ipAddress = extractIPAddress(request)
    const userAgent = request.headers.get('user-agent') || undefined
    logSystemEvent({
      logType: 'password_reset_error',
      severity: 'error',
      endpoint: '/api/auth/reset-password',
      method: 'POST',
      statusCode: 500,
      ipAddress,
      userAgent,
      url: actualUrl,
      errorMessage: error instanceof Error ? error.message : 'Reset password internal error',
      errorStack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
