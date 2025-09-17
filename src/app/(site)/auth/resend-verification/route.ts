import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  console.log('🚀 Resend verification API called')
  
  try {
    // Log request details
    console.log('📋 Request method:', request.method)
    console.log('📋 Request URL:', request.url)
    console.log('📋 Content-Type:', request.headers.get('content-type'))

    let body
    try {
      body = await request.json()
      console.log('📦 Request body received:', body)
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { email } = body
    console.log('📧 Email from request:', email)

    if (!email) {
      console.log('❌ No email provided in request')
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string') {
      console.log('❌ Email is not a string:', typeof email)
      return NextResponse.json(
        { message: 'Email must be a string' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log('📧 Normalized email:', normalizedEmail)

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      console.log('❌ Invalid email format:', normalizedEmail)
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log('🔍 Looking for user with email:', normalizedEmail)

    // Find user by email
    let user
    try {
      user = await prisma.user.findUnique({
        where: { 
          email: normalizedEmail 
        }
      })
      console.log('👤 User found:', user ? 'YES' : 'NO')
      if (user) {
        console.log('👤 User details:', {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          hasVerificationToken: !!user.verificationToken
        })
      }
    } catch (dbError) {
      console.error('❌ Database error when finding user:', dbError)
      return NextResponse.json(
        { message: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (!user) {
      console.log('❌ No user found with email:', normalizedEmail)
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // Check if user is already verified
    if (user.emailVerified) {
      console.log('❌ User email already verified:', user.emailVerified)
      return NextResponse.json(
        { message: 'Email address is already verified' },
        { status: 400 }
      )
    }

    console.log('✅ User found and email not verified, proceeding with token generation')

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    console.log('🎫 Generated verification token:', verificationToken.substring(0, 8) + '...')
    console.log('⏰ Token expiry:', verificationExpiry)

    // Update user with new verification token
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationExpiry
        }
      })
      console.log('✅ User updated with new verification token')
    } catch (updateError) {
      console.error('❌ Failed to update user with new token:', updateError)
      return NextResponse.json(
        { message: 'Failed to update verification token' },
        { status: 500 }
      )
    }

    // Send new verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`
    console.log('📧 Verification URL:', verificationUrl)
    
    try {
      console.log('📧 Attempting to send verification email...')
      await sendVerificationEmail({
        to: normalizedEmail,
        name: user.name || 'there',
        verificationUrl
      })
      console.log('✅ Verification email sent successfully')

      return NextResponse.json(
        { 
          message: 'Verification email sent successfully. Please check your inbox.',
          email: normalizedEmail
        },
        { status: 200 }
      )
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError)
      return NextResponse.json(
        { message: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Resend verification error:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}