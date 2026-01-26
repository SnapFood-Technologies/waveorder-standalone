import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { sendVerificationEmail, sendUserCreatedNotification } from '@/lib/email'
import crypto from 'crypto'


export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    // if (!name || !email || !password) {
      if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'BUSINESS_OWNER',
        verificationToken,
        verificationExpiry
      }
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`
    
    try {
      await sendVerificationEmail({
        to: email,
        name,
        verificationUrl
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails
    }

    // Send admin notification
    try {
      await sendUserCreatedNotification({
        userId: user.id,
        name,
        email: email.toLowerCase(),
        provider: 'credentials',
        createdAt: user.createdAt
      })
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError)
    }

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to verify your account.',
        userId: user.id 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}