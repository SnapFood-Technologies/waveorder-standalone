// lib/email.ts - WaveOrder email service
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BaseEmailParams {
  to: string
  name?: string
}

interface VerificationEmailParams extends BaseEmailParams {
  verificationUrl: string
}

interface MagicLinkParams extends BaseEmailParams {
  magicLinkUrl: string
}

interface PasswordResetParams extends BaseEmailParams {
  resetUrl: string
}

interface WelcomeEmailParams extends BaseEmailParams {
  businessName?: string
  dashboardUrl: string
}

interface ContactFormParams {
  name: string
  email: string
  subject: string
  message: string
  type: string
}

interface AdminNotificationParams extends ContactFormParams {
  messageId: string
  isSpam?: boolean
  spamScore?: number
  ipAddress?: string
}

interface UserCreatedNotificationParams {
  userId: string
  name: string
  email: string
  provider: string
  createdAt: Date
}

// Base email template wrapper
const createEmailTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - WaveOrder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px 20px; text-align: center;">
      <div style="display: inline-flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.2); padding: 12px; border-radius: 12px; margin-bottom: 20px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="display: block;">
          <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm4.64-1.96l3.54 3.54c.78.78 2.05.78 2.83 0l7.07-7.07c.78-.78.78-2.05 0-2.83-.78-.78-2.05-.78-2.83 0L12 9.93 8.75 6.68c-.78-.78-2.05-.78-2.83 0s-.78 2.05 0 2.83l.72.53z"/>
        </svg>
      </div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">WaveOrder</h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0; font-size: 16px;">WhatsApp ordering made simple</p>
    </div>
    
    <!-- Content -->
    ${content}
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">
        Questions? Contact us at 
        <a href="mailto:hello@waveorder.app" style="color: #0d9488; text-decoration: none;">hello@waveorder.app</a>
      </p>
      <p style="color: #9ca3af; margin: 12px 0 0; font-size: 12px;">
        © 2025 WaveOrder. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`

// Email verification template
const createVerificationEmailContent = (name: string, verificationUrl: string) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Hi ${name}! Thanks for joining WaveOrder. To complete your registration and start creating your WhatsApp ordering system, please verify your email address by clicking the button below.
  </p>
  
  <!-- Verification Button -->
  <div style="text-align: center; margin: 32px 0;">
    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
      Verify Email Address
    </a>
  </div>
  
  <p style="color: #6b7280; margin: 24px 0 0; font-size: 14px; line-height: 1.5;">
    If the button doesn't work, you can also copy and paste this link into your browser:<br>
    <a href="${verificationUrl}" style="color: #0d9488; word-break: break-all;">${verificationUrl}</a>
  </p>
  
  <p style="color: #9ca3af; margin: 24px 0 0; font-size: 14px;">
    This verification link will expire in 24 hours. If you didn't create an account with WaveOrder, you can safely ignore this email.
  </p>
</div>
`

// Magic link template
const createMagicLinkEmailContent = (magicLinkUrl: string) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Sign in to WaveOrder</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Click the button below to securely sign in to your WaveOrder account. This link will expire in 24 hours.
  </p>
  
  <!-- Sign In Button -->
  <div style="text-align: center; margin: 32px 0;">
    <a href="${magicLinkUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
      Sign in to WaveOrder
    </a>
  </div>
  
  <p style="color: #6b7280; margin: 24px 0 0; font-size: 14px; line-height: 1.5;">
    If the button doesn't work, you can also copy and paste this link into your browser:<br>
    <a href="${magicLinkUrl}" style="color: #0d9488; word-break: break-all;">${magicLinkUrl}</a>
  </p>
  
  <p style="color: #9ca3af; margin: 24px 0 0; font-size: 14px;">
    If you didn't request this email, you can safely ignore it.
  </p>
</div>
`

// Password reset template
const createPasswordResetEmailContent = (name: string, resetUrl: string) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Hi ${name}! We received a request to reset the password for your WaveOrder account. Click the button below to create a new password.
  </p>
  
  <!-- Reset Button -->
  <div style="text-align: center; margin: 32px 0;">
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
      Reset Password
    </a>
  </div>
  
  <p style="color: #6b7280; margin: 24px 0 0; font-size: 14px; line-height: 1.5;">
    If the button doesn't work, you can also copy and paste this link into your browser:<br>
    <a href="${resetUrl}" style="color: #0d9488; word-break: break-all;">${resetUrl}</a>
  </p>
  
  <div style="background-color: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
      ⚠️ Security Notice
    </p>
    <p style="color: #92400e; margin: 8px 0 0; font-size: 14px;">
      This password reset link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email and your password will remain unchanged.
    </p>
  </div>
</div>
`

// Welcome email template
const createWelcomeEmailContent = (name: string, businessName: string, dashboardUrl: string) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Welcome to WaveOrder! 🎉</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Hi ${name}! Your account is now verified and ready to use. ${businessName ? `Your business "${businessName}" is set up and ready to accept WhatsApp orders.` : 'You can now start setting up your WhatsApp ordering system.'}
  </p>
  
  <!-- Get Started Button -->
  <div style="text-align: center; margin: 32px 0;">
    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
      ${businessName ? 'Go to Dashboard' : 'Complete Setup'}
    </a>
  </div>
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">Quick Start Guide:</h3>
    <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 14px;">
      <li style="margin-bottom: 8px;">Set up your business profile and WhatsApp number</li>
      <li style="margin-bottom: 8px;">Add your products and organize them into categories</li>
      <li style="margin-bottom: 8px;">Customize your catalog design and branding</li>
      <li>Start receiving orders directly on WhatsApp</li>
    </ul>
  </div>
</div>
`

// User created notification for admin
const createUserCreatedNotificationContent = ({ userId, name, email, provider, createdAt }: UserCreatedNotificationParams) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">🎉 New User Registration</h2>
  
  <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
    <p style="color: #0c4a6e; margin: 0; font-size: 14px; font-weight: 500;">
      A new user has joined WaveOrder!
    </p>
  </div>
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 16px;">User Details:</h3>
    <div style="font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 8px; color: #374151;"><strong>User ID:</strong> <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 4px;">${userId}</code></p>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Name:</strong> ${name}</p>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0d9488;">${email}</a></p>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Sign-up Method:</strong> ${provider === 'google' ? 'Google OAuth' : provider === 'email' ? 'Magic Link' : 'Email/Password'}</p>
      <p style="margin: 0 0 8px; color: #6b7280;"><strong>Created:</strong> ${createdAt.toLocaleString()}</p>
    </div>
  </div>
</div>
`

// Email service functions
export async function sendVerificationEmail({ to, name = 'there', verificationUrl }: VerificationEmailParams) {
  const content = createVerificationEmailContent(name, verificationUrl)
  const html = createEmailTemplate(content, 'Verify Your Email')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: 'Welcome to WaveOrder - Verify Your Email',
      html,
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    throw new Error('Failed to send verification email')
  }
}

export async function sendMagicLinkEmail({ to, magicLinkUrl }: MagicLinkParams) {
  const content = createMagicLinkEmailContent(magicLinkUrl)
  const html = createEmailTemplate(content, 'Sign in to WaveOrder')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: 'Sign in to WaveOrder',
      html,
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send magic link email:', error)
    throw new Error('Failed to send magic link email')
  }
}

export async function sendPasswordResetEmail({ to, name = 'there', resetUrl }: PasswordResetParams) {
  const content = createPasswordResetEmailContent(name, resetUrl)
  const html = createEmailTemplate(content, 'Reset Your Password')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: 'Reset Your WaveOrder Password',
      html,
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

export async function sendWelcomeEmail({ to, name = 'there', businessName, dashboardUrl }: WelcomeEmailParams) {
  const content = createWelcomeEmailContent(name, businessName || '', dashboardUrl)
  const html = createEmailTemplate(content, 'Welcome to WaveOrder')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: `Welcome to WaveOrder, ${name}! Your store is ready 🎉`,
      html,
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    throw new Error('Failed to send welcome email')
  }
}

export async function sendUserCreatedNotification(params: UserCreatedNotificationParams) {
  const content = createUserCreatedNotificationContent(params)
  const html = createEmailTemplate(content, 'New User Registration')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: ['hello@waveorder.app'], // Admin email
      subject: `🎉 New User Registration: ${params.name}`,
      html,
      reply_to: params.email,
      headers: {
        'X-User-ID': params.userId,
        'X-Provider': params.provider,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send user created notification:', error)
    return { success: false, error: error.message }
  }
}