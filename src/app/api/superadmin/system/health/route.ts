// app/api/superadmin/system/health/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkTwilioHealth } from '@/lib/twilio'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured' | 'checking'
  message: string
  latency?: number
}

interface ServiceCategory {
  name: string
  description: string
  icon: string
  services: ServiceStatus[]
}

// Check MongoDB connection
async function checkMongoDB(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    await prisma.$runCommandRaw({ ping: 1 })
    const latency = Date.now() - start
    return {
      name: 'MongoDB',
      status: 'healthy',
      message: 'Database connected and responding',
      latency
    }
  } catch (error) {
    return {
      name: 'MongoDB',
      status: 'down',
      message: `Connection failed: ${(error as Error).message}`
    }
  }
}

// Check Stripe API
async function checkStripe(): Promise<ServiceStatus> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      name: 'Stripe',
      status: 'unconfigured',
      message: 'STRIPE_SECRET_KEY not configured'
    }
  }

  const start = Date.now()
  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
      }
    })
    const latency = Date.now() - start
    
    if (res.ok) {
      return {
        name: 'Stripe',
        status: 'healthy',
        message: 'API connected and authenticated',
        latency
      }
    } else if (res.status === 401) {
      return {
        name: 'Stripe',
        status: 'down',
        message: 'Invalid API key'
      }
    } else {
      return {
        name: 'Stripe',
        status: 'degraded',
        message: `API returned status ${res.status}`
      }
    }
  } catch (error) {
    return {
      name: 'Stripe',
      status: 'down',
      message: `Connection failed: ${(error as Error).message}`
    }
  }
}

// Check Stripe Webhook Secret
async function checkStripeWebhook(): Promise<ServiceStatus> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return {
      name: 'Stripe Webhooks',
      status: 'unconfigured',
      message: 'STRIPE_WEBHOOK_SECRET not configured'
    }
  }
  
  return {
    name: 'Stripe Webhooks',
    status: 'healthy',
    message: 'Webhook secret configured'
  }
}

// Check Resend API
async function checkResend(): Promise<ServiceStatus> {
  if (!process.env.RESEND_API_KEY) {
    return {
      name: 'Resend',
      status: 'unconfigured',
      message: 'RESEND_API_KEY not configured'
    }
  }

  const start = Date.now()
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      }
    })
    const latency = Date.now() - start
    
    if (res.ok) {
      return {
        name: 'Resend',
        status: 'healthy',
        message: 'Email service connected',
        latency
      }
    } else if (res.status === 401) {
      return {
        name: 'Resend',
        status: 'down',
        message: 'Invalid API key'
      }
    } else {
      return {
        name: 'Resend',
        status: 'degraded',
        message: `API returned status ${res.status}`
      }
    }
  } catch (error) {
    return {
      name: 'Resend',
      status: 'down',
      message: `Connection failed: ${(error as Error).message}`
    }
  }
}

// Check Google OAuth
async function checkGoogleOAuth(): Promise<ServiceStatus> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return {
      name: 'Google OAuth',
      status: 'unconfigured',
      message: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured'
    }
  }

  return {
    name: 'Google OAuth',
    status: 'healthy',
    message: 'OAuth credentials configured'
  }
}

// Check Google Maps API
async function checkGoogleMaps(): Promise<ServiceStatus> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return {
      name: 'Google Maps',
      status: 'unconfigured',
      message: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not configured'
    }
  }

  // Places API (autocomplete) is used client-side via JavaScript SDK
  // Can't easily test server-side, so we just verify the key exists
  // The key is configured for Places API (autocomplete) which works in the browser
  return {
    name: 'Google Maps',
    status: 'healthy',
    message: 'API key configured (Places API)'
  }
}

// Check Supabase
async function checkSupabase(): Promise<ServiceStatus> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      name: 'Supabase Storage',
      status: 'unconfigured',
      message: 'Supabase credentials not configured'
    }
  }

  const start = Date.now()
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    })
    const latency = Date.now() - start
    
    if (res.ok || res.status === 404) {
      return {
        name: 'Supabase Storage',
        status: 'healthy',
        message: 'Storage service connected',
        latency
      }
    } else {
      return {
        name: 'Supabase Storage',
        status: 'degraded',
        message: `Service returned status ${res.status}`
      }
    }
  } catch (error) {
    return {
      name: 'Supabase Storage',
      status: 'down',
      message: `Connection failed: ${(error as Error).message}`
    }
  }
}

// Check Akismet
async function checkAkismet(): Promise<ServiceStatus> {
  if (!process.env.AKISMET_API_KEY) {
    return {
      name: 'Akismet',
      status: 'unconfigured',
      message: 'AKISMET_API_KEY not configured'
    }
  }

  const start = Date.now()
  try {
    const res = await fetch('https://rest.akismet.com/1.1/verify-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `key=${process.env.AKISMET_API_KEY}&blog=${process.env.NEXTAUTH_URL || 'https://waveorder.app'}`
    })
    const latency = Date.now() - start
    const text = await res.text()
    
    if (text === 'valid') {
      return {
        name: 'Akismet',
        status: 'healthy',
        message: 'Spam protection active',
        latency
      }
    } else {
      return {
        name: 'Akismet',
        status: 'down',
        message: 'API key invalid'
      }
    }
  } catch (error) {
    return {
      name: 'Akismet',
      status: 'down',
      message: `Connection failed: ${(error as Error).message}`
    }
  }
}

// Check Google Analytics
async function checkGoogleAnalytics(): Promise<ServiceStatus> {
  if (!process.env.NEXT_PUBLIC_GA_ID) {
    return {
      name: 'Google Analytics',
      status: 'unconfigured',
      message: 'NEXT_PUBLIC_GA_ID not configured'
    }
  }

  return {
    name: 'Google Analytics',
    status: 'healthy',
    message: `Tracking ID: ${process.env.NEXT_PUBLIC_GA_ID}`
  }
}

// Check Microsoft Clarity
async function checkClarity(): Promise<ServiceStatus> {
  if (!process.env.NEXT_PUBLIC_CLARITY_ID) {
    return {
      name: 'Microsoft Clarity',
      status: 'unconfigured',
      message: 'NEXT_PUBLIC_CLARITY_ID not configured'
    }
  }

  return {
    name: 'Microsoft Clarity',
    status: 'healthy',
    message: `Project ID: ${process.env.NEXT_PUBLIC_CLARITY_ID}`
  }
}

// Check Sentry
async function checkSentry(): Promise<ServiceStatus> {
  // Sentry DSN is hardcoded in sentry.server.config.ts and sentry.edge.config.ts
  // DSN: https://8209f61fb7edfc252214afaa89435a7b@o4510295012016128.ingest.de.sentry.io/4510295063724112
  // Since the config files exist with hardcoded DSN, Sentry is always configured
  return {
    name: 'Sentry',
    status: 'healthy',
    message: 'Error tracking active'
  }
}

// Check NextAuth
async function checkNextAuth(): Promise<ServiceStatus> {
  if (!process.env.NEXTAUTH_SECRET) {
    return {
      name: 'NextAuth',
      status: 'unconfigured',
      message: 'NEXTAUTH_SECRET not configured'
    }
  }

  if (!process.env.NEXTAUTH_URL) {
    return {
      name: 'NextAuth',
      status: 'degraded',
      message: 'NEXTAUTH_URL not configured'
    }
  }

  return {
    name: 'NextAuth',
    status: 'healthy',
    message: `URL: ${process.env.NEXTAUTH_URL}`
  }
}

// Check Cron Jobs
async function checkCron(): Promise<ServiceStatus> {
  if (!process.env.CRON_SECRET) {
    return {
      name: 'Cron Jobs',
      status: 'unconfigured',
      message: 'CRON_SECRET not configured'
    }
  }

  return {
    name: 'Cron Jobs',
    status: 'healthy',
    message: 'Cron authentication configured'
  }
}

// Check OpenAI API (Wavemind Engine)
async function checkOpenAI(): Promise<ServiceStatus> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      name: 'OpenAI',
      status: 'unconfigured',
      message: 'OPENAI_API_KEY not configured'
    }
  }

  const start = Date.now()
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    })
    const latency = Date.now() - start
    
    if (res.ok) {
      return {
        name: 'OpenAI',
        status: 'healthy',
        message: 'Wavemind AI engine connected',
        latency
      }
    } else if (res.status === 401) {
      return {
        name: 'OpenAI',
        status: 'down',
        message: 'Invalid API key'
      }
    } else if (res.status === 429) {
      return {
        name: 'OpenAI',
        status: 'degraded',
        message: 'Rate limited'
      }
    } else {
      return {
        name: 'OpenAI',
        status: 'degraded',
        message: `API returned status ${res.status}`
      }
    }
  } catch (error) {
    return {
      name: 'OpenAI',
      status: 'down',
      message: `Connection failed: ${(error as Error).message}`
    }
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Run all health checks in parallel
    const [
      mongodb,
      stripe,
      stripeWebhook,
      resend,
      googleOAuth,
      googleMaps,
      supabase,
      akismet,
      googleAnalytics,
      clarity,
      sentry,
      nextAuth,
      cron,
      twilioResult,
      openai
    ] = await Promise.all([
      checkMongoDB(),
      checkStripe(),
      checkStripeWebhook(),
      checkResend(),
      checkGoogleOAuth(),
      checkGoogleMaps(),
      checkSupabase(),
      checkAkismet(),
      checkGoogleAnalytics(),
      checkClarity(),
      checkSentry(),
      checkNextAuth(),
      checkCron(),
      checkTwilioHealth(),
      checkOpenAI()
    ])
    
    // Convert Twilio result to ServiceStatus format
    const twilio: ServiceStatus = {
      name: 'Twilio WhatsApp',
      status: twilioResult.status,
      message: twilioResult.message,
      latency: twilioResult.latency
    }

    const categories: ServiceCategory[] = [
      {
        name: 'Core Infrastructure',
        description: 'Critical services for application operation',
        icon: 'Database',
        services: [mongodb, nextAuth]
      },
      {
        name: 'Payment Processing',
        description: 'Stripe payment and subscription services',
        icon: 'CreditCard',
        services: [stripe, stripeWebhook]
      },
      {
        name: 'Email Services',
        description: 'Transactional email delivery',
        icon: 'Mail',
        services: [resend]
      },
      {
        name: 'Messaging',
        description: 'WhatsApp and SMS notifications',
        icon: 'MessageSquare',
        services: [twilio]
      },
      {
        name: 'Authentication',
        description: 'User authentication providers',
        icon: 'Lock',
        services: [googleOAuth]
      },
      {
        name: 'External APIs',
        description: 'Third-party API integrations',
        icon: 'Globe',
        services: [googleMaps, akismet]
      },
      {
        name: 'Storage',
        description: 'File and image storage',
        icon: 'Cloud',
        services: [supabase]
      },
      {
        name: 'Analytics & Monitoring',
        description: 'Traffic analytics and error tracking',
        icon: 'BarChart3',
        services: [googleAnalytics, clarity, sentry]
      },
      {
        name: 'Background Jobs',
        description: 'Scheduled tasks and automation',
        icon: 'Server',
        services: [cron]
      },
      {
        name: 'AI Services',
        description: 'Wavemind AI engine for insights',
        icon: 'Brain',
        services: [openai]
      }
    ]

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { message: 'Failed to check health status' },
      { status: 500 }
    )
  }
}
