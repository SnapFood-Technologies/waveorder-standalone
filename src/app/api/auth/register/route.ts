import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { sendVerificationEmail, sendUserCreatedNotification } from '@/lib/email'
import crypto from 'crypto'
import { calculateTrialEndDate, calculateGraceEndDate } from '@/lib/trial'

type ValidPlan = 'STARTER' | 'PRO' | 'BUSINESS'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, plan: requestedPlan } = await request.json()

    // Validate input
    // if (!name || !email || !password) {
      if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate plan selection (default to PRO if not specified)
    const validPlans: ValidPlan[] = ['STARTER', 'PRO', 'BUSINESS']
    const selectedPlan: ValidPlan = validPlans.includes(requestedPlan) ? requestedPlan : 'PRO'

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

    // Calculate trial dates
    const trialEndsAt = calculateTrialEndDate()
    const graceEndsAt = calculateGraceEndDate(trialEndsAt)

    // Create user with trial
    // Note: Using type assertion as Prisma types may not reflect new schema fields immediately
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'BUSINESS_OWNER',
        verificationToken,
        verificationExpiry,
        // Set selected plan and trial dates
        plan: selectedPlan,
        trialEndsAt,
        graceEndsAt,
        trialUsed: true
      } as any
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