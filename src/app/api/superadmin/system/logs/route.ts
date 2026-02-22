// app/api/superadmin/system/logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // Filters
    const logType = searchParams.get('logType')
    const severity = searchParams.get('severity')
    const slug = searchParams.get('slug')
    const businessId = searchParams.get('businessId')
    const statusCode = searchParams.get('statusCode') ? parseInt(searchParams.get('statusCode')!) : null
    
    // Date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Known scanner/spam slug patterns to exclude from main log views
    const spamFilePatterns = /\.(php|png|ico|xml|txt|js|css|svg|jpg|jpeg|gif|webp|json|html|htm|asp|aspx|jsp|cgi|env|sql|bak|log|zip|tar|gz|git|htaccess|htpasswd|ds_store|gitignore|npmrc|dockerignore)$/i
    const spamExactSlugs = [
      'wp-admin', 'wp-login', 'wp-content', 'wp-includes', 'administrator',
      'admin', 'phpmyadmin', 'cpanel', '.git', '.env', '.aws', 'config',
      'backup', 'db', 'database', 'mysql', 'phpinfo', 'info', 'test', 'debug',
      'shell', 'cmd', 'eval', 'exec', 'system', 'passwd', 'etc', 'proc',
      'boot', 'root', 'tmp', 'var', 'usr', 'bin', 'cgi-bin', 'scripts',
      'includes', 'vendor', 'node_modules', '.well-known', 'xmlrpc', 'wp-json',
      'api', 'robots', 'sitemap', 'favicon', 'apple-touch-icon',
      'apple-touch-icon-precomposed', 'browserconfig', 'crossdomain',
      'clientaccesspolicy', 'dashboard', 'login', 'logout', 'register',
      'signup', 'signin', 'auth', 'account', 'profile', 'settings', 'setup',
      'install', 'superadmin', 'management', 'secure'
    ]

    const isSpamSlug = (s: string | null | undefined): boolean => {
      if (!s) return false
      const lower = s.toLowerCase()
      if (spamFilePatterns.test(lower)) return true
      if (spamExactSlugs.includes(lower)) return true
      if (lower.startsWith('.')) return true
      return false
    }

    // Build where clause
    const where: any = {}
    
    if (logType) {
      where.logType = logType
    }
    
    if (severity) {
      where.severity = severity
    }
    
    if (slug) {
      where.slug = slug
    }
    
    if (businessId) {
      where.businessId = businessId
    }
    
    if (statusCode !== null) {
      where.statusCode = statusCode
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Exclude known scanner/spam 404s from the main log list by
    // filtering out storefront_404 logs whose slug matches spam patterns.
    // MongoDB $not/$regex works with Prisma, but groupBy doesn't support it easily,
    // so we add slug NOT IN for exact matches and do a post-filter for regex patterns.
    const spamExcludeFilter = {
      NOT: {
        AND: [
          { logType: 'storefront_404' },
          { slug: { in: spamExactSlugs } }
        ]
      }
    }

    const mainWhere = { ...where, ...spamExcludeFilter }

    // Fetch logs with pagination (excluding spam 404s)
    const [rawLogs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where: mainWhere,
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: skip + limit + 50, // fetch extra to account for regex-pattern filtered entries
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }),
      prisma.systemLog.count({ where })
    ])

    // Post-filter regex-pattern spam slugs (file extensions like .env.php, etc.)
    const filteredLogs = rawLogs.filter(log => {
      if (log.logType === 'storefront_404' && isSpamSlug(log.slug)) return false
      return true
    })
    const logs = filteredLogs.slice(skip, skip + limit)

    // Get all storefront_404 count, then subtract spam count for clean number
    const [totalStorefront404s, spamExact404Count] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'storefront_404' } }),
      prisma.systemLog.count({ where: { logType: 'storefront_404', slug: { in: spamExactSlugs } } }),
    ])

    // For regex-pattern spam, count by fetching slugs and filtering in JS
    const all404Slugs = await prisma.systemLog.groupBy({
      by: ['slug'],
      where: { logType: 'storefront_404' },
      _count: { id: true }
    })
    const regexSpam404Count = all404Slugs
      .filter(item => item.slug && spamFilePatterns.test(item.slug.toLowerCase()) && !spamExactSlugs.includes(item.slug.toLowerCase()))
      .reduce((sum, item) => sum + item._count.id, 0)

    const totalSpam404s = spamExact404Count + regexSpam404Count
    const cleanStorefront404s = totalStorefront404s - totalSpam404s

    // Get summary statistics (with spam 404s excluded from error count)
    const [rawTotalLogs, rawErrorLogs, warningLogs, infoLogs] = await Promise.all([
      prisma.systemLog.count({}),
      prisma.systemLog.count({ where: { severity: 'error' } }),
      prisma.systemLog.count({ where: { severity: 'warning' } }),
      prisma.systemLog.count({ where: { severity: 'info' } }),
    ])
    const totalLogs = rawTotalLogs - totalSpam404s
    const errorLogs = rawErrorLogs - totalSpam404s
    const storefront404s = cleanStorefront404s

    // Get log type distribution for analytics
    const logTypeDistribution = await prisma.systemLog.groupBy({
      by: ['logType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    // Get user & subscription stats
    const [
      userRegisteredCount, userLoginCount, subscriptionChangedCount, integrationApiCallCount,
      passwordResetRequestedCount, passwordResetCompletedCount, passwordResetErrorCount,
      orderStatusChangedCount, appointmentStatusChangedCount,
      twilioMessageSentCount, twilioMessageErrorCount
    ] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'user_registered' } }),
      prisma.systemLog.count({ where: { logType: 'user_login' } }),
      prisma.systemLog.count({ where: { logType: 'subscription_changed' } }),
      prisma.systemLog.count({ where: { logType: 'integration_api_call' } }),
      prisma.systemLog.count({ where: { logType: 'password_reset_requested' } }),
      prisma.systemLog.count({ where: { logType: 'password_reset_completed' } }),
      prisma.systemLog.count({ where: { logType: 'password_reset_error' } }),
      prisma.systemLog.count({ where: { logType: 'order_status_changed' } }),
      prisma.systemLog.count({ where: { logType: 'appointment_status_changed' } }),
      prisma.systemLog.count({ where: { logType: 'twilio_message_sent' } }),
      prisma.systemLog.count({ where: { logType: 'twilio_message_error' } })
    ])

    // Get order-related stats
    const [orderCreatedCount, orderErrorCount] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'order_created' } }),
      prisma.systemLog.count({ where: { logType: 'order_error' } })
    ])

    // Get appointment-related stats
    const [appointmentCreatedCount, appointmentErrorCount] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'appointment_created' } }),
      prisma.systemLog.count({ where: { logType: 'appointment_error' } })
    ])

    // Get storefront-related stats
    const [storefrontSuccessCount, storefrontErrorCount] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'storefront_success' } }),
      prisma.systemLog.count({ where: { logType: 'storefront_error' } })
    ])

    // Get top slugs with most activity (last 7 days)
    // Exclude obvious hack attempts (files with extensions like .php, .png, .xml, etc.)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // First get all slugs, then filter out file extensions in JS
    // (MongoDB doesn't support regex NOT CONTAINS easily in groupBy)
    const allSlugsByLogs = await prisma.systemLog.groupBy({
      by: ['slug'],
      where: {
        slug: { not: null },
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50 // Get more to filter
    })
    
    // Filter out obvious non-store slugs (hack attempts, files, etc.)
    const suspiciousPatterns = /\.(php|png|ico|xml|txt|js|css|svg|jpg|jpeg|gif|webp|json|html|htm|asp|aspx|jsp|cgi|env|sql|bak|log|zip|tar|gz|git|htaccess|htpasswd|ds_store|gitignore|npmrc|dockerignore)$/i
    const suspiciousExact = ['wp-admin', 'wp-login', 'wp-content', 'wp-includes', 'administrator', 'admin', 'phpmyadmin', 'cpanel', '.git', '.env', '.aws', 'config', 'backup', 'db', 'database', 'mysql', 'phpinfo', 'info', 'test', 'debug', 'shell', 'cmd', 'eval', 'exec', 'system', 'passwd', 'etc', 'proc', 'boot', 'root', 'tmp', 'var', 'usr', 'bin', 'cgi-bin', 'scripts', 'includes', 'vendor', 'node_modules', '.well-known', 'xmlrpc', 'wp-json', 'api', 'robots', 'sitemap', 'favicon', 'apple-touch-icon', 'apple-touch-icon-precomposed', 'browserconfig', 'crossdomain', 'clientaccesspolicy', 'dashboard', 'login', 'logout', 'register', 'signup', 'signin', 'auth', 'account', 'profile', 'settings', 'setup', 'install', 'superadmin', 'management', 'secure']
    const topSlugsByLogs = allSlugsByLogs
      .filter(item => {
        if (!item.slug) return false
        const slug = item.slug.toLowerCase()
        // Exclude file extensions
        if (suspiciousPatterns.test(slug)) return false
        // Exclude exact matches (common hack targets)
        if (suspiciousExact.includes(slug)) return false
        // Exclude slugs starting with . (hidden files/folders)
        if (slug.startsWith('.')) return false
        return true
      })
      .slice(0, 10)

    // Get onboarding funnel stats
    const onboardingLogTypes = [
      'onboarding_step_completed',
      'onboarding_step_error',
      'onboarding_completed'
    ]
    
    const onboardingLogs = await prisma.systemLog.findMany({
      where: {
        logType: { in: onboardingLogTypes }
      },
      select: {
        logType: true,
        metadata: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Build onboarding funnel: count unique users who completed each step
    const stepNames: Record<number, string> = {
      1: 'Business Type',
      2: 'Goals',
      3: 'Pricing',
      4: 'Store Creation',
      5: 'Team Setup',
      7: 'Product Setup',
      8: 'Delivery Methods',
      9: 'Payment Methods',
      10: 'WhatsApp Message',
      11: 'Store Ready'
    }

    // Count completions per step and track unique users per step
    const stepCompletions: Record<number, number> = {}
    const stepErrors: Record<number, number> = {}
    let totalOnboardingCompleted = 0
    let totalOnboardingErrors = 0

    for (const log of onboardingLogs) {
      const meta = log.metadata as any
      const step = meta?.step as number
      
      if (log.logType === 'onboarding_completed') {
        totalOnboardingCompleted++
      } else if (log.logType === 'onboarding_step_completed' && step) {
        stepCompletions[step] = (stepCompletions[step] || 0) + 1
      } else if (log.logType === 'onboarding_step_error' && step) {
        stepErrors[step] = (stepErrors[step] || 0) + 1
        totalOnboardingErrors++
      }
    }

    // Build funnel array sorted by step number
    const onboardingFunnel = Object.keys(stepNames)
      .map(Number)
      .sort((a, b) => a - b)
      .map(step => ({
        step,
        stepName: stepNames[step],
        completions: stepCompletions[step] || 0,
        errors: stepErrors[step] || 0
      }))

    const onboardingStats = {
      totalStarts: stepCompletions[1] || 0,
      totalCompleted: totalOnboardingCompleted,
      totalErrors: totalOnboardingErrors,
      completionRate: (stepCompletions[1] || 0) > 0
        ? ((totalOnboardingCompleted / (stepCompletions[1] || 1)) * 100).toFixed(1)
        : '0.0',
      funnel: onboardingFunnel
    }

    // Get logs by day (last 7 days) - using Prisma groupBy workaround
    // Since MongoDB doesn't support DATE() function, we'll fetch recent logs and aggregate in JS
    const recentLogs = await prisma.systemLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    
    // Aggregate by day in JavaScript
    const logsByDayMap = new Map<string, number>()
    recentLogs.forEach(log => {
      const dateKey = log.createdAt.toISOString().split('T')[0]
      logsByDayMap.set(dateKey, (logsByDayMap.get(dateKey) || 0) + 1)
    })
    
    const logsByDay = Array.from(logsByDayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7)

    return NextResponse.json({
      logs: logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        total: total - totalSpam404s,
        totalPages: Math.ceil((total - totalSpam404s) / limit)
      },
      stats: {
        total: totalLogs,
        errors: errorLogs,
        warnings: warningLogs,
        info: infoLogs,
        storefront404s
      },
      analytics: {
        logTypeDistribution: logTypeDistribution.map(item => ({
          logType: item.logType,
          count: item.logType === 'storefront_404' ? item._count.id - totalSpam404s : item._count.id
        })).filter(item => item.count > 0),
        orderStats: {
          created: orderCreatedCount,
          errors: orderErrorCount,
          total: orderCreatedCount + orderErrorCount
        },
        appointmentStats: {
          created: appointmentCreatedCount,
          errors: appointmentErrorCount,
          total: appointmentCreatedCount + appointmentErrorCount
        },
        storefrontStats: {
          success: storefrontSuccessCount,
          errors: storefrontErrorCount,
          notFound: storefront404s,
          total: storefrontSuccessCount + storefrontErrorCount + storefront404s
        },
        userStats: {
          registered: userRegisteredCount,
          logins: userLoginCount,
          total: userRegisteredCount + userLoginCount
        },
        passwordResetStats: {
          requested: passwordResetRequestedCount,
          completed: passwordResetCompletedCount,
          errors: passwordResetErrorCount,
          total: passwordResetRequestedCount + passwordResetCompletedCount + passwordResetErrorCount
        },
        orderStatusChangedStats: {
          changed: orderStatusChangedCount,
          total: orderStatusChangedCount
        },
        appointmentStatusChangedStats: {
          changed: appointmentStatusChangedCount,
          total: appointmentStatusChangedCount
        },
        twilioStats: {
          sent: twilioMessageSentCount,
          errors: twilioMessageErrorCount,
          total: twilioMessageSentCount + twilioMessageErrorCount
        },
        subscriptionStats: {
          changed: subscriptionChangedCount,
          total: subscriptionChangedCount
        },
        integrationStats: {
          apiCalls: integrationApiCallCount,
          total: integrationApiCallCount
        },
        topSlugsByLogs: topSlugsByLogs.map(item => ({
          slug: item.slug,
          count: item._count.id
        })),
        logsByDay: logsByDay,
        onboardingStats,
        scannerTraffic: {
          total: totalSpam404s,
          note: 'Bot probes, vulnerability scanners, and noisy 404s filtered from main view'
        }
      }
    })
  } catch (error) {
    console.error('Error fetching system logs:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
