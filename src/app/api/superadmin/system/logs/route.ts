// app/api/superadmin/system/logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Shared spam detection for scanner/bot 404 traffic.
// Instead of maintaining an ever-growing exact list, we combine:
//   1. File extension patterns (catches .php, .php7, .yaml, .cfg, etc.)
//   2. Structural patterns (port numbers, brackets, slashes, wildcards)
//   3. Known exact slugs for common attack paths
//   4. Prefix rules (., _, :, [ etc.)

const spamFilePatterns = /\.(php\d?|png|ico|xml|txt|js|css|svg|jpg|jpeg|gif|webp|json|html?|asp|aspx|jsp|cgi|env|sql|bak|log|zip|tar|gz|git|htaccess|htpasswd|ds_store|gitignore|npmrc|dockerignore|yaml|yml|cfg|ini|conf|toml|sh|bash|bat|ps1|rb|py|pl|lua|map|woff2?|ttf|eot|swf|class|jar|war|pem|key|crt|vcl|config|credentials|backup|old|rar|tgz|md|rdb|tf|tfvars|tfstate|properties|lock)$/i

const spamStructuralPatterns = [
  /^\d+$/,                    // pure numbers: "1", "8080", etc.
  /^:\d+/,                    // port probes: ":27017", ":28017"
  /\[/,                       // bracket patterns: "[...catchAll]", "[[...optional]]"
  /\*/,                       // wildcard patterns: "*update.cgi*"
  /\.\./,                     // path traversal: "../etc/passwd"
  /^(upload|uploads|fileupload|file-upload|uploadfile)$/i,
  /^(import|export|migrate|migration|seed|seeder)$/i,
  /^(controlpanel|cpanel|webmail|plesk|directadmin)$/i,
  /^(package-updates|update|updates|upgrade)$/i,
  /^(alfa|alfanew|alfa-rex|shell|r57|c99|b374k)/i, // web shells
  /^(stripe\.yaml|stripe\.json|config\.|\.config)/i,
]

const spamExactSlugs = new Set([
  'wp-admin', 'wp-login', 'wp-content', 'wp-includes', 'administrator',
  'admin', 'admin_', 'phpmyadmin', 'cpanel', '.git', '.env', '.aws', 'config',
  'backup', 'db', 'database', 'mysql', 'phpinfo', 'info', 'test', 'debug',
  'shell', 'cmd', 'eval', 'exec', 'system', 'passwd', 'etc', 'proc',
  'boot', 'root', 'tmp', 'var', 'usr', 'bin', 'cgi-bin', 'scripts',
  'includes', 'vendor', 'node_modules', '.well-known', 'xmlrpc', 'wp-json',
  'api', 'robots', 'sitemap', 'favicon', 'apple-touch-icon',
  'apple-touch-icon-precomposed', 'browserconfig', 'crossdomain',
  'clientaccesspolicy', 'dashboard', 'login', 'logout', 'register',
  'signup', 'signin', 'auth', 'account', 'profile', 'settings', 'setup',
  'install', 'superadmin', 'management', 'secure',
  'getcmd', '_next', '1', 'feed', 'cookie',
  'chatgpt-user', 'anthropic-ai', 'claude-web', 'ccbot', 'gptbot',
  'version', 'license', 'changelog', 'readme', 'graphql',
  'jenkinsfile', 'access_log', 'error_log', 'pipfile',
])

const isSpamSlug = (s: string | null | undefined): boolean => {
  if (!s) return false
  const lower = s.toLowerCase()
  if (lower.startsWith('.') || lower.startsWith('_') || lower.startsWith(':')) return true
  if (spamFilePatterns.test(lower)) return true
  if (spamExactSlugs.has(lower)) return true
  for (const pattern of spamStructuralPatterns) {
    if (pattern.test(lower)) return true
  }
  return false
}

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

    // Step 1: Pre-compute ALL spam slugs from DB (exact + regex-matched).
    // This lets Prisma handle skip/take/count properly at the database level.
    const all404SlugGroups = await prisma.systemLog.groupBy({
      by: ['slug'],
      where: { logType: 'storefront_404' },
      _count: { id: true }
    })

    const allSpamSlugs: string[] = []
    let totalSpam404s = 0

    for (const group of all404SlugGroups) {
      if (group.slug && isSpamSlug(group.slug)) {
        allSpamSlugs.push(group.slug)
        totalSpam404s += group._count.id
      }
    }

    // Step 2: Build where clause with user filters
    const where: any = {}
    
    if (logType) {
      where.logType = logType
    }
    
    if (severity) {
      where.severity = severity
    }
    
    if (slug) {
      where.slug = { contains: slug, mode: 'insensitive' }
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

    // Step 3: Exclude spam 404 slugs — fully at the Prisma level
    const mainWhere = {
      ...where,
      NOT: {
        AND: [
          { logType: 'storefront_404' },
          { slug: { in: allSpamSlugs } }
        ]
      }
    }

    // Step 4: Fetch logs + count with proper Prisma pagination
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where: mainWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      prisma.systemLog.count({ where: mainWhere })
    ])

    // Step 5: Summary stats (with spam excluded)
    const [rawTotalLogs, rawErrorLogs, warningLogs, infoLogs, totalStorefront404s] = await Promise.all([
      prisma.systemLog.count({}),
      prisma.systemLog.count({ where: { severity: 'error' } }),
      prisma.systemLog.count({ where: { severity: 'warning' } }),
      prisma.systemLog.count({ where: { severity: 'info' } }),
      prisma.systemLog.count({ where: { logType: 'storefront_404' } }),
    ])

    const totalLogs = rawTotalLogs - totalSpam404s
    const errorLogs = rawErrorLogs - totalSpam404s
    const storefront404s = totalStorefront404s - totalSpam404s

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
      twilioMessageSentCount, twilioMessageErrorCount,
      productCreatedCount, productUpdatedCount
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
      prisma.systemLog.count({ where: { logType: 'twilio_message_error' } }),
      prisma.systemLog.count({ where: { logType: 'product_created' } }),
      prisma.systemLog.count({ where: { logType: 'product_updated' } })
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

    // Get service request-related stats (SERVICES form submissions)
    const [serviceRequestCreatedCount, serviceRequestErrorCount] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'service_request_created' } }),
      prisma.systemLog.count({ where: { logType: 'service_request_error' } })
    ])

    // Get storefront-related stats
    const [storefrontSuccessCount, storefrontErrorCount] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'storefront_success' } }),
      prisma.systemLog.count({ where: { logType: 'storefront_error' } })
    ])

    // Top active stores (last 7 days) — uses the same spam filter
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const allSlugsByLogs = await prisma.systemLog.groupBy({
      by: ['slug'],
      where: {
        slug: { not: null },
        createdAt: { gte: sevenDaysAgo }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50
    })
    
    const topSlugsByLogs = allSlugsByLogs
      .filter(item => {
        if (!item.slug) return false
        return !isSpamSlug(item.slug)
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

    const stepCompletions: Record<number, number> = {}
    const stepErrors: Record<number, number> = {}
    let totalOnboardingCompleted = 0
    let totalOnboardingErrors = 0

    for (const log of onboardingLogs) {
      const meta = log.metadata as any
      const step = meta?.step as number

      if (log.logType === 'onboarding_completed') {
        totalOnboardingCompleted++
        // Store Ready is step 11; completion is logged as onboarding_completed, not onboarding_step_completed
        stepCompletions[11] = (stepCompletions[11] || 0) + 1
      } else if (log.logType === 'onboarding_step_completed' && step) {
        stepCompletions[step] = (stepCompletions[step] || 0) + 1
      } else if (log.logType === 'onboarding_step_error' && step) {
        stepErrors[step] = (stepErrors[step] || 0) + 1
        totalOnboardingErrors++
      }
    }

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

    // Get logs by day (last 7 days) — exclude scanner/bot traffic same as main list
    const logsByDayWhere = {
      createdAt: { gte: sevenDaysAgo },
      NOT: {
        AND: [
          { logType: 'storefront_404' },
          { slug: { in: allSpamSlugs } }
        ]
      }
    }
    const recentLogs = await prisma.systemLog.findMany({
      where: logsByDayWhere,
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    
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
        total,
        totalPages: Math.ceil(total / limit)
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
        serviceRequestStats: {
          created: serviceRequestCreatedCount,
          errors: serviceRequestErrorCount,
          total: serviceRequestCreatedCount + serviceRequestErrorCount
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
        productStats: {
          created: productCreatedCount,
          updated: productUpdatedCount,
          total: productCreatedCount + productUpdatedCount
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
