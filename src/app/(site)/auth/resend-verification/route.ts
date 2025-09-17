import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendVerificationEmail } from '@/lib/email'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {

  try {
   
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { email } = body

    if (!email) {

      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string') {
    
      return NextResponse.json(
        { message: 'Email must be a string' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    let user
    try {
      user = await prisma.user.findUnique({
        where: { 
          email: normalizedEmail 
        }
      })
     
      if (user) {
        
      }
    } catch (dbError) {
      console.error('❌ Database error when finding user:', dbError)
      return NextResponse.json(
        { message: 'Database error occurred' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { message: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // Check if user is already verified
    if (user.emailVerified) {

      return NextResponse.json(
        { message: 'Email address is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    

    // Update user with new verification token
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationExpiry
        }
      })
      
    } catch (updateError) {
      console.error('❌ Failed to update user with new token:', updateError)
      return NextResponse.json(
        { message: 'Failed to update verification token' },
        { status: 500 }
      )
    }

    // Send new verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`

    
    try {
      await sendVerificationEmail({
        to: normalizedEmail,
        name: user.name || 'there',
        verificationUrl
      })

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
    // @ts-ignore
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
        // @ts-ignore
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}