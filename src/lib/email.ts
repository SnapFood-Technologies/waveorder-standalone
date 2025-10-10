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
  subscriptionPlan?: 'FREE' | 'PRO' // Add this
}

interface TeamInvitationParams extends BaseEmailParams {
  businessName: string
  inviterName: string
  role: string
  inviteUrl: string
}

interface TeamMemberRemovedParams extends BaseEmailParams {
  businessName: string
  removedBy: string
  reason?: string
}

interface RoleChangedParams extends BaseEmailParams {
  businessName: string
  oldRole: string
  newRole: string
  changedBy: string
}

// Add these interfaces
interface SubscriptionChangeEmailParams {
  to: string
  name: string
  changeType: 'upgraded' | 'downgraded' | 'canceled' | 'renewed'
  oldPlan?: 'FREE' | 'PRO'
  newPlan: 'FREE' | 'PRO'
  billingInterval?: 'monthly' | 'annual'
  amount?: number
  nextBillingDate?: Date
}

interface PaymentFailedEmailParams {
  to: string
  name: string
  amount: number
  nextRetryDate?: Date
  updatePaymentUrl: string
}



interface ContactFormParams {
  name: string
  email: string
  subject: string
  message: string
  type: string
}

interface BusinessCreatedEmailParams {
  to: string
  name: string
  businessName: string
  setupUrl: string
  dashboardUrl: string
  subscriptionPlan?: 'FREE' | 'PRO' // Add this
}


interface ContactNotificationParams {
  messageId: string
  name: string
  email: string
  company?: string
  subject: string
  message: string
  type: string
  ipAddress?: string
  isSpam?: boolean
  spamScore?: number
}

interface ContactConfirmationParams {
  to: string
  name: string
  subject: string
  messageId: string
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


const createBusinessCreatedEmailContent = (
  name: string, 
  businessName: string, 
  setupUrl: string,
  dashboardUrl: string,
  subscriptionPlan: 'FREE' | 'PRO' = 'FREE'
) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">
    Welcome to WaveOrder, ${name}! 🎉
  </h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Great news! Your business "${businessName}" has been successfully created on WaveOrder. You're all set to start accepting WhatsApp orders and managing your business online.
  </p>
  
  <!-- Subscription Plan Badge -->
  <div style="text-align: center; margin: 24px 0;">
    <div style="display: inline-block; background: ${subscriptionPlan === 'PRO' ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'}; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      ${subscriptionPlan === 'PRO' ? '👑 PRO Plan' : '🆓 FREE Plan'}
    </div>
  </div>
  
  ${subscriptionPlan === 'PRO' ? `
  <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <p style="color: #6b21a8; margin: 0 0 8px; font-size: 14px; font-weight: 600;">
      🎉 PRO Features Unlocked!
    </p>
    <p style="color: #7c3aed; margin: 0; font-size: 14px;">
      You have access to unlimited products, advanced analytics, custom domains, inventory management, and priority support.
    </p>
  </div>
  ` : `
  <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <p style="color: #0c4a6e; margin: 0 0 8px; font-size: 14px; font-weight: 600;">
      🆓 Your account is on the FREE plan
    </p>
    <p style="color: #0369a1; margin: 0; font-size: 14px;">
      Get started with up to 30 products and 10 categories. Upgrade to PRO anytime for unlimited products, advanced features, and priority support.
    </p>
  </div>
  `}

  <!-- Complete Setup Button -->
  <div style="text-align: center; margin: 32px 0;">
    <a href="${setupUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
      Complete Setup & Access Dashboard
    </a>
  </div>
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 16px;">What's Next?</h3>
    <div style="font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="width: 6px; height: 6px; background: #0d9488; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #374151;"><strong>Click the button above</strong> to set your password and access your dashboard</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="width: 6px; height: 6px; background: #0d9488; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #374151;"><strong>Add your products</strong> and organize them into categories</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="width: 6px; height: 6px; background: #0d9488; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #374151;"><strong>Customize your store</strong> branding and settings</span>
      </div>
      <div style="display: flex; align-items: start;">
        <div style="width: 6px; height: 6px; background: #0d9488; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #374151;"><strong>Start receiving orders</strong> directly on WhatsApp</span>
      </div>
    </div>
  </div>

  <div style="background-color: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
      ⏰ Setup Link Expires in 7 Days
    </p>
    <p style="color: #92400e; margin: 8px 0 0; font-size: 14px;">
      Please complete your setup within 7 days. After that, you'll need to contact support for a new setup link.
    </p>
  </div>
  
  <p style="color: #6b7280; margin: 24px 0 0; font-size: 14px; line-height: 1.5;">
    If the button doesn't work, you can also copy and paste this link into your browser:<br>
    <a href="${setupUrl}" style="color: #0d9488; word-break: break-all;">${setupUrl}</a>
  </p>
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">Need Help?</h3>
    <p style="color: #6b7280; margin: 0; font-size: 14px;">
      Our support team is here to help! If you have any questions about setting up your business or using WaveOrder, don't hesitate to reach out to us at 
      <a href="mailto:hello@waveorder.app" style="color: #0d9488; text-decoration: none;">hello@waveorder.app</a>
    </p>
  </div>
</div>
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

// Add email templates
const createSubscriptionChangeEmailContent = (
  name: string,
  changeType: 'upgraded' | 'downgraded' | 'canceled' | 'renewed',
  oldPlan: 'FREE' | 'PRO' | undefined,
  newPlan: 'FREE' | 'PRO',
  billingInterval: 'monthly' | 'annual' | undefined,
  amount: number | undefined,
  nextBillingDate: Date | undefined
) => {
  const isUpgrade = changeType === 'upgraded'
  const isDowngrade = changeType === 'downgraded'
  const isCanceled = changeType === 'canceled'
  const isRenewed = changeType === 'renewed'

  let title = ''
  let message = ''
  let badgeColor = ''
  let badgeText = ''

  if (isUpgrade) {
    title = '🎉 Welcome to WaveOrder PRO!'
    message = `Your account has been successfully upgraded to the PRO plan. You now have access to all premium features including unlimited products, advanced analytics, custom domains, inventory management, and priority support.`
    badgeColor = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
    badgeText = '👑 PRO Plan Active'
  } else if (isDowngrade || isCanceled) {
    title = 'Subscription Changed'
    message = `Your PRO subscription has been canceled. You'll continue to have access to all PRO features until ${nextBillingDate?.toLocaleDateString() || 'the end of your billing period'}, after which your account will be downgraded to the FREE plan.`
    badgeColor = 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
    badgeText = 'Subscription Ending'
  } else if (isRenewed) {
    title = '✅ Subscription Renewed'
    message = `Your PRO subscription has been successfully renewed. Thank you for continuing with WaveOrder!`
    badgeColor = 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
    badgeText = '👑 PRO Renewed'
  }

  return `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">${title}</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Hi ${name}! ${message}
  </p>
  
  <!-- Plan Badge -->
  <div style="text-align: center; margin: 24px 0;">
    <div style="display: inline-block; background: ${badgeColor}; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      ${badgeText}
    </div>
  </div>
  
  ${isUpgrade ? `
  <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <h3 style="color: #6b21a8; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
      🎉 PRO Features Now Active
    </h3>
    <div style="font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">✅ Unlimited products & categories</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">✅ Advanced analytics & reporting</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">✅ Custom domain connection</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">✅ Inventory management</span>
      </div>
      <div style="display: flex; align-items: start;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">✅ Priority support</span>
      </div>
    </div>
  </div>
  ` : ''}
  
  ${(isDowngrade || isCanceled) ? `
  <div style="background-color: #fef3cd; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <h3 style="color: #92400e; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
      What You'll Lose After ${nextBillingDate?.toLocaleDateString()}
    </h3>
    <div style="font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #92400e;">❌ Unlimited products (limited to 30)</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #92400e;">❌ Advanced analytics</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #92400e;">❌ Custom domains</span>
      </div>
      <div style="display: flex; align-items: start;">
        <div style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #92400e;">❌ Inventory management</span>
      </div>
    </div>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #fde68a;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        Changed your mind? You can reactivate your PRO subscription anytime from your dashboard.
      </p>
    </div>
  </div>
  ` : ''}
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">Billing Information</h3>
    <div style="font-size: 14px; line-height: 1.6;">
      ${amount ? `<p style="margin: 0 0 8px; color: #374151;"><strong>Amount:</strong> $${amount}/${billingInterval === 'annual' ? 'year' : 'month'}</p>` : ''}
      ${nextBillingDate ? `<p style="margin: 0; color: #374151;"><strong>${isCanceled || isDowngrade ? 'Access Until:' : 'Next Billing Date:'}</strong> ${nextBillingDate.toLocaleDateString()}</p>` : ''}
    </div>
  </div>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${process.env.NEXTAUTH_URL}/admin/stores" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
      Go to Dashboard
    </a>
  </div>
</div>
`
}

const createPaymentFailedEmailContent = (
  name: string,
  amount: number,
  nextRetryDate: Date | undefined,
  updatePaymentUrl: string
) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">⚠️ Payment Failed</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Hi ${name}! We weren't able to process your payment of $${amount} for your WaveOrder PRO subscription.
  </p>
  
  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <h3 style="color: #991b1b; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
      Action Required
    </h3>
    <p style="color: #dc2626; margin: 0; font-size: 14px;">
      Please update your payment method to continue using PRO features. ${nextRetryDate ? `We'll automatically retry on ${nextRetryDate.toLocaleDateString()}.` : 'Your subscription may be canceled if we cannot process payment.'}
    </p>
  </div>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${updatePaymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);">
      Update Payment Method
    </a>
  </div>
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">Common Reasons for Payment Failure:</h3>
    <div style="font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #6b7280; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #374151;">Insufficient funds</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #6b7280; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #374151;">Expired card</span>
      </div>
      <div style="display: flex; align-items: start;">
        <div style="width: 6px; height: 6px; background: #6b7280; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #374151;">Bank declined the transaction</span>
      </div>
    </div>
  </div>
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
// Team invitation template
const createTeamInvitationContent = (name: string, businessName: string, inviterName: string, role: string, inviteUrl: string) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">You're Invited to Join ${businessName}</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    ${inviterName} has invited you to join their WaveOrder team as a <strong>${role.toLowerCase()}</strong>. You'll be able to help manage orders, products, and customer interactions.
  </p>
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">Role: ${role}</h3>
    <p style="color: #6b7280; margin: 0; font-size: 14px;">
      ${role === 'MANAGER' 
        ? 'As a manager, you\'ll have access to manage orders, menu items, settings, and can invite other team members.' 
        : 'As a staff member, you\'ll be able to view and manage orders to help serve customers efficiently.'}
    </p>
  </div>
  
  <!-- Accept Invitation Button -->
  <div style="text-align: center; margin: 32px 0;">
    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4);">
      Accept Invitation
    </a>
  </div>
  
  <p style="color: #6b7280; margin: 24px 0 0; font-size: 14px; line-height: 1.5;">
    If the button doesn't work, you can also copy and paste this link into your browser:<br>
    <a href="${inviteUrl}" style="color: #0d9488; word-break: break-all;">${inviteUrl}</a>
  </p>
  
  <div style="background-color: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
      📅 Invitation Expires
    </p>
    <p style="color: #92400e; margin: 8px 0 0; font-size: 14px;">
      This invitation will expire in 7 days. If you don't have a WaveOrder account, one will be created for you when you accept.
    </p>
  </div>
</div>
`


// Export functions
export async function sendSubscriptionChangeEmail({
  to,
  name,
  changeType,
  oldPlan,
  newPlan,
  billingInterval,
  amount,
  nextBillingDate
}: SubscriptionChangeEmailParams) {
  const content = createSubscriptionChangeEmailContent(
    name,
    changeType,
    oldPlan,
    newPlan,
    billingInterval,
    amount,
    nextBillingDate
  )
  const html = createEmailTemplate(content, 'Subscription Update')

  const subjectMap = {
    upgraded: '🎉 Welcome to WaveOrder PRO!',
    downgraded: 'Your WaveOrder Subscription Has Changed',
    canceled: 'Your WaveOrder PRO Subscription Has Been Canceled',
    renewed: '✅ Your WaveOrder PRO Subscription Has Been Renewed'
  }

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: subjectMap[changeType],
      html,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
      headers: {
        'X-Change-Type': changeType,
        'X-New-Plan': newPlan,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send subscription change email:', error)
    throw new Error('Failed to send subscription change email')
  }
}

export async function sendPaymentFailedEmail({
  to,
  name,
  amount,
  nextRetryDate,
  updatePaymentUrl
}: PaymentFailedEmailParams) {
  const content = createPaymentFailedEmailContent(name, amount, nextRetryDate, updatePaymentUrl)
  const html = createEmailTemplate(content, 'Payment Failed')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: '⚠️ Payment Failed - Action Required for WaveOrder PRO',
      html,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
      headers: {
        'X-Payment-Failed': 'true',
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send payment failed email:', error)
    throw new Error('Failed to send payment failed email')
  }
}

// Update the sendBusinessCreatedEmail function
export async function sendBusinessCreatedEmail({
  to,
  name,
  businessName,
  setupUrl,
  dashboardUrl,
  subscriptionPlan = 'FREE'
}: BusinessCreatedEmailParams) {
  const content = createBusinessCreatedEmailContent(name, businessName, setupUrl, dashboardUrl, subscriptionPlan)
  const html = createEmailTemplate(content, 'Welcome to WaveOrder')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: `Welcome to WaveOrder ${subscriptionPlan === 'PRO' ? '👑' : ''} - Your business "${businessName}" is ready!`,
      html,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
      headers: {
        'X-Business-Name': businessName,
        'X-Setup-Email': 'true',
        'X-Subscription-Plan': subscriptionPlan,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send business created email:', error)
    throw new Error('Failed to send business created email')
  }
}

// Add team invitation email function
export async function sendTeamInvitationEmail({ to, name = 'there', businessName, inviterName, role, inviteUrl }: TeamInvitationParams) {
  const content = createTeamInvitationContent(name, businessName, inviterName, role, inviteUrl)
  const html = createEmailTemplate(content, 'Team Invitation')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: `You're invited to join ${businessName} on WaveOrder`,
      html,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
      headers: {
        'X-Business-Name': businessName,
        'X-Role': role,
        'X-Inviter': inviterName,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send team invitation email:', error)
    throw new Error('Failed to send team invitation email')
  }
}

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
const createWelcomeEmailContent = (
  name: string, 
  businessName: string, 
  dashboardUrl: string,
  subscriptionPlan: 'FREE' | 'PRO' = 'FREE'
) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Welcome to WaveOrder! 🎉</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Hi ${name}! Your account is now verified and ready to use. ${businessName ? `Your business "${businessName}" is set up and ready to accept WhatsApp orders.` : 'You can now start setting up your WhatsApp ordering system.'}
  </p>
  
  <!-- Subscription Plan Badge -->
  <div style="text-align: center; margin: 24px 0;">
    <div style="display: inline-block; background: ${subscriptionPlan === 'PRO' ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'}; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      ${subscriptionPlan === 'PRO' ? '👑 PRO Plan Active' : '🆓 FREE Plan'}
    </div>
  </div>
  
  ${subscriptionPlan === 'PRO' ? `
  <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <h3 style="color: #6b21a8; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
      🎉 Welcome to PRO!
    </h3>
    <p style="color: #7c3aed; margin: 0 0 12px; font-size: 14px;">
      You now have access to all PRO features:
    </p>
    <div style="font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">Unlimited products & categories</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">Advanced analytics & reporting</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">Custom domain connection</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">Inventory management</span>
      </div>
      <div style="display: flex; align-items: start;">
        <div style="width: 6px; height: 6px; background: #a855f7; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #7c3aed;">Priority support</span>
      </div>
    </div>
  </div>
  ` : `
  <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <h3 style="color: #0c4a6e; margin: 0 0 12px; font-size: 16px; font-weight: 600;">
      🆓 You're on the FREE Plan
    </h3>
    <p style="color: #0369a1; margin: 0 0 12px; font-size: 14px;">
      Get started with essential features:
    </p>
    <div style="font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #0ea5e9; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #0369a1;">Up to 30 products</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #0ea5e9; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #0369a1;">10 categories</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 8px;">
        <div style="width: 6px; height: 6px; background: #0ea5e9; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #0369a1;">WhatsApp order management</span>
      </div>
      <div style="display: flex; align-items: start;">
        <div style="width: 6px; height: 6px; background: #0ea5e9; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span style="color: #0369a1;">Basic analytics</span>
      </div>
    </div>
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #bae6fd;">
      <p style="color: #0c4a6e; margin: 0; font-size: 14px;">
        💡 Want more? <a href="${dashboardUrl}/settings/billing" style="color: #0369a1; font-weight: 600; text-decoration: none;">Upgrade to PRO</a> for unlimited products, advanced features, and custom domains.
      </p>
    </div>
  </div>
  `}
  
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

export async function sendWelcomeEmail({ 
  to, 
  name = 'there', 
  businessName, 
  dashboardUrl,
  subscriptionPlan = 'FREE'
}: WelcomeEmailParams) {
  const content = createWelcomeEmailContent(name, businessName || '', dashboardUrl, subscriptionPlan)
  const html = createEmailTemplate(content, 'Welcome to WaveOrder')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: `Welcome to WaveOrder${subscriptionPlan === 'PRO' ? ' PRO 👑' : ''}, ${name}! Your account is verified 🎉`,
      html,
      headers: {
        'X-Subscription-Plan': subscriptionPlan,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    throw new Error('Failed to send welcome email')
  }
}

// Contact form notification email content (to admin)
const createContactNotificationContent = ({ 
  messageId, name, email, company, subject, message, type, ipAddress, isSpam, spamScore 
}: ContactNotificationParams) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">
    📧 New Contact Form Submission
  </h2>
  
  ${isSpam ? `
  <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
    <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: 500;">
      ⚠️ POTENTIAL SPAM DETECTED (Score: ${spamScore?.toFixed(2) || 'N/A'})
    </p>
  </div>
  ` : ''}
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 16px; font-size: 16px;">Contact Details:</h3>
    <div style="font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 8px; color: #374151;"><strong>Message ID:</strong> <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 4px;">${messageId}</code></p>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Name:</strong> ${name}</p>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0d9488;">${email}</a></p>
      ${company ? `<p style="margin: 0 0 8px; color: #374151;"><strong>Business:</strong> ${company}</p>` : ''}
      <p style="margin: 0 0 8px; color: #374151;"><strong>Subject:</strong> ${subject.charAt(0).toUpperCase() + subject.slice(1)}</p>
      <p style="margin: 0 0 8px; color: #374151;"><strong>Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
      ${ipAddress ? `<p style="margin: 0 0 8px; color: #6b7280;"><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
    </div>
  </div>
  
  <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #bae6fd;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">Message:</h3>
    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
      <p style="color: #374151; margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="${process.env.NEXTAUTH_URL}/admin/contacts/${messageId}" style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      View in Admin Dashboard
    </a>
  </div>
</div>
`

// Contact form confirmation email content (to user)
const createContactConfirmationContent = (name: string, subject: string, messageId: string) => `
<div style="padding: 40px 30px;">
  <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 24px; font-weight: 600;">Thank You for Contacting WaveOrder!</h2>
  <p style="color: #6b7280; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
    Hi ${name}! We've received your message about "${subject}" and appreciate you reaching out to us.
  </p>
  
  <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #bae6fd;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">What happens next?</h3>
    <div style="color: #374151; font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="width: 6px; height: 6px; background: #0d9488; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span>Our team will review your ${subject} inquiry carefully</span>
      </div>
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="width: 6px; height: 6px; background: #0d9488; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span>You'll receive a detailed response within 24 hours</span>
      </div>
      <div style="display: flex; align-items: start;">
        <div style="width: 6px; height: 6px; background: #0d9488; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0;"></div>
        <span>For urgent matters, you can also reach us directly at hello@waveorder.app</span>
      </div>
    </div>
  </div>
  
  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <h3 style="color: #1f2937; margin: 0 0 12px; font-size: 16px;">While you wait, explore WaveOrder:</h3>
    <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0 0 8px;">📚 <a href="${process.env.NEXTAUTH_URL}/resources" style="color: #0d9488; text-decoration: none;">Check our documentation</a></p>
      <p style="margin: 0 0 8px;">❓ <a href="${process.env.NEXTAUTH_URL}/resources" style="color: #0d9488; text-decoration: none;">Browse frequently asked questions</a></p>
      <p style="margin: 0;">🚀 <a href="${process.env.NEXTAUTH_URL}/demo" style="color: #0d9488; text-decoration: none;">Try our live demo</a></p>
    </div>
  </div>
  
  <p style="color: #9ca3af; margin: 24px 0 0; font-size: 12px;">
    Reference ID: ${messageId}
  </p>
</div>
`

// Contact notification email function
export async function sendContactNotificationEmail(params: ContactNotificationParams) {
  const content = createContactNotificationContent(params)
  const html = createEmailTemplate(content, 'New Contact Form Submission')
  
  const subjectLine = params.isSpam 
    ? `🚨 [POTENTIAL SPAM] Contact Form: ${params.subject} - ${params.name}`
    : `📧 New Contact: ${params.subject} - ${params.name}`

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: ['hello@waveorder.app'], // Admin email
      subject: subjectLine,
      html,
      // @ts-ignore
      reply_to: params.email,
      headers: {
        'X-Message-ID': params.messageId,
        'X-Contact-Type': params.type,
        'X-Spam-Score': params.spamScore?.toString() || '0',
        'X-IP-Address': params.ipAddress || 'unknown',
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send contact notification email:', error)
    throw new Error('Failed to send contact notification email')
  }
}

// Contact confirmation email function
export async function sendContactConfirmationEmail({ to, name, subject, messageId }: ContactConfirmationParams) {
  const content = createContactConfirmationContent(name, subject, messageId)
  const html = createEmailTemplate(content, 'Thank You for Contacting WaveOrder')

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: `Thank you for contacting WaveOrder, ${name}!`,
      html,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
      headers: {
        'X-Message-ID': messageId,
        'X-Contact-Confirmation': 'true',
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send contact confirmation email:', error)
    throw new Error('Failed to send contact confirmation email')
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
      // @ts-ignore
      reply_to: params.email,
      headers: {
        'X-User-ID': params.userId,
        'X-Provider': params.provider,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send user created notification:', error)
    // @ts-ignore
    return { success: false, error: error.message }
  }
}

// Team member removal email
export async function sendTeamMemberRemovedEmail({ to, name, businessName, removedBy, reason }: TeamMemberRemovedParams) {
  const content = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="font-size: 32px; color: #0d9488;">👋</div>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Access Removed</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">You've been removed from ${businessName}</p>
      </div>
      
      <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <p style="margin: 0 0 20px; font-size: 16px;">Hi ${name || 'there'},</p>
        
        <p style="margin: 0 0 20px; font-size: 16px;">
          Your access to <strong>${businessName}</strong> has been removed by ${removedBy}.
        </p>
        
        ${reason ? `
          <div style="background: #f8fafc; border-left: 4px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Reason:</strong> ${reason}</p>
          </div>
        ` : ''}
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>What this means:</strong><br>
            • You no longer have access to the business dashboard<br>
            • You cannot view or manage orders, products, or settings<br>
            • All your previous permissions have been revoked
          </p>
        </div>
        
        <p style="margin: 20px 0 0; font-size: 16px;">
          If you believe this was done in error, please contact ${removedBy} directly or reach out to our support team.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:hello@waveorder.app" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Contact Support
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
          Thank you for your time with ${businessName}.<br>
          <strong>WaveOrder Team</strong>
        </p>
      </div>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: `Access removed from ${businessName}`,
      html: content,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
      headers: {
        'X-Team-Removal': 'true',
        'X-Business': businessName,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send team member removed email:', error)
    throw new Error('Failed to send team member removed email')
  }
}

// Role change notification email
export async function sendRoleChangedEmail({ to, name, businessName, oldRole, newRole, changedBy }: RoleChangedParams) {
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Full access to all features, can manage team and billing'
      case 'MANAGER':
        return 'Can manage products, orders, and invite staff members'
      case 'STAFF':
        return 'Can view and manage orders and products'
      default:
        return 'Limited access'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '#3b82f6'
      case 'MANAGER':
        return '#8b5cf6'
      case 'STAFF':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const isUpgrade = ['STAFF', 'MANAGER'].includes(oldRole) && newRole === 'OWNER' ||
                   oldRole === 'STAFF' && newRole === 'MANAGER'

  const content = `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
      <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="font-size: 32px; color: #0d9488;">${isUpgrade ? '🎉' : '📋'}</div>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Role Updated</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your role in ${businessName} has been changed</p>
      </div>
      
      <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <p style="margin: 0 0 20px; font-size: 16px;">Hi ${name || 'there'},</p>
        
        <p style="margin: 0 0 20px; font-size: 16px;">
          Your role in <strong>${businessName}</strong> has been updated by ${changedBy}.
        </p>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 30px 0;">
          <div style="text-align: center;">
            <div style="background: ${getRoleBadgeColor(oldRole)}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
              ${oldRole}
            </div>
            <p style="margin: 0; font-size: 14px; color: #64748b;">Previous Role</p>
          </div>
          
          <div style="font-size: 24px; color: #0d9488;">→</div>
          
          <div style="text-align: center;">
            <div style="background: ${getRoleBadgeColor(newRole)}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
              ${newRole}
            </div>
            <p style="margin: 0; font-size: 14px; color: #64748b;">New Role</p>
          </div>
        </div>
        
        <div style="background: #f0fdf4; border: 1px solid #22c55e; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #166534;">
            <strong>New Permissions:</strong><br>
            ${getRoleDescription(newRole)}
          </p>
        </div>
        
        ${isUpgrade ? `
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              🎉 <strong>Congratulations!</strong> Your role has been upgraded. You now have access to additional features and permissions.
            </p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}/auth/login" style="display: inline-block; background: #0d9488; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Access Dashboard
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
          Questions about your new role? Contact ${changedBy} or our support team.<br>
          <strong>WaveOrder Team</strong>
        </p>
      </div>
    </div>
  `

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@waveorder.app',
      to: [to],
      subject: `Role updated in ${businessName} - You are now ${newRole}`,
      html: content,
      // @ts-ignore
      reply_to: 'hello@waveorder.app',
      headers: {
        'X-Role-Change': 'true',
        'X-Business': businessName,
        'X-New-Role': newRole,
      },
    })

    return { success: true, emailId: result.data?.id }
  } catch (error) {
    console.error('Failed to send role changed email:', error)
    throw new Error('Failed to send role changed email')
  }
}