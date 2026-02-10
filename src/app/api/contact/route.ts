// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkSpam } from '@/lib/akismet'
import { sendContactNotificationEmail, sendContactConfirmationEmail } from '@/lib/email'
import { headers } from 'next/headers'

// Validation schema
const contactSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  company: z.string()
    .max(100, 'Company name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  useCase: z.string()
    .max(50, 'Use case must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  
    // @ts-ignore
  subject: z.enum(['general', 'demo', 'setup', 'billing', 'technical', 'feature'], {
    errorMap: () => ({ message: 'Please select a valid subject' })
  }),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
})

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const key = ip
  const limit = rateLimitStore.get(key)

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(key, { count: 1, resetTime: now + 15 * 60 * 1000 }) // 15 minutes
    return false
  }

  if (limit.count >= 3) { // Max 3 submissions per 15 minutes
    return true
  }

  limit.count++
  return false
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  // @ts-ignore
  return request.ip || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    // Get client information
    const ip = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || ''

    // Rate limiting
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait 15 minutes before sending another message.',
          code: 'RATE_LIMITED'
        },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = contactSchema.safeParse(body)

    if (!validationResult.success) {
          // @ts-ignore
      const errors = validationResult.error.errors.map(err => ({
        field: err.path[0],
        message: err.message
      }))

      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      )
    }

    const { name, email, company, useCase, subject, message } = validationResult.data

    // Spam check with Akismet
    let isSpam = false
    let spamScore = 0

    try {
      const spamCheck = await checkSpam({
        user_ip: ip,
        user_agent: userAgent,
        author: name,
        author_email: email,
        content: `${subject}: ${message}`,
        type: 'contact-form'
      })

      isSpam = spamCheck.isSpam
      spamScore = spamCheck.confidence || 0

      // Auto-reject high-confidence spam
      if (isSpam && spamScore > 0.8) {
        
        // Return success to avoid revealing spam detection
        return NextResponse.json({ 
          success: true,
          message: 'Thank you for your message. We will get back to you soon.'
        })
      }
    } catch (error) {
      console.error('Akismet check failed:', error)
      // Continue without spam check if Akismet fails
    }

    // Convert subject to enum value
      // @ts-ignore
    const subjectEnum = subject.toUpperCase() as keyof typeof prisma.contactSubject

    // Detect country/city from IP (non-blocking, best-effort)
    let geoData: { country?: string; city?: string; region?: string; countryCode?: string } = {}
    try {
      if (ip && ip !== 'unknown') {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })
        if (geoResponse.ok) {
          const geoJson = await geoResponse.json()
          if (geoJson.status === 'success') {
            geoData = {
              country: geoJson.country || undefined,
              city: geoJson.city || undefined,
              region: geoJson.regionName || undefined,
              countryCode: geoJson.countryCode || undefined
            }
          }
        }
      }
    } catch (geoError) {
      // Silently ignore geolocation errors -- not critical
      console.error('IP geolocation failed:', geoError)
    }

    // Save to database
      // @ts-ignore
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        company: company || null,
        useCase: useCase || null,
        // @ts-ignore
        subject: subjectEnum,
        message,
        isSpam,
        spamScore,
        ipAddress: ip,
        userAgent,
        referer,
        country: geoData.country || null,
        city: geoData.city || null,
        region: geoData.region || null,
        countryCode: geoData.countryCode || null,
        status: isSpam ? 'SPAM' : 'PENDING'
      }
    })

    // Send emails only if not spam
    if (!isSpam) {
      try {
        // Send notification to admin
        await sendContactNotificationEmail({
          messageId: contactMessage.id,
          name,
          email,
          company: company || undefined,
          subject,
          message,
          type: subject,
          ipAddress: ip,
          isSpam,
          spamScore
        })

        // Send confirmation to user
        await sendContactConfirmationEmail({
          to: email,
          name,
          subject,
          messageId: contactMessage.id
        })

        // Mark email as sent
        await prisma.contactMessage.update({
          where: { id: contactMessage.id },
          data: { 
            emailSent: true,
            emailSentAt: new Date()
          }
        })

      } catch (emailError) {
        console.error('Failed to send emails:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you within 24 hours.',
      messageId: contactMessage.id
    })

  } catch (error) {
    console.error('Contact form error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error. Please try again later.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}