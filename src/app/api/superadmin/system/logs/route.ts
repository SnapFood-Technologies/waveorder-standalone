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

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
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
      prisma.systemLog.count({ where })
    ])

    // Get summary statistics
    const [totalLogs, errorLogs, warningLogs, infoLogs, storefront404s] = await Promise.all([
      prisma.systemLog.count({}),
      prisma.systemLog.count({ where: { severity: 'error' } }),
      prisma.systemLog.count({ where: { severity: 'warning' } }),
      prisma.systemLog.count({ where: { severity: 'info' } }),
      prisma.systemLog.count({ where: { logType: 'storefront_404' } })
    ])

    // Get log type distribution for analytics
    const logTypeDistribution = await prisma.systemLog.groupBy({
      by: ['logType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    })

    // Get order-related stats
    const [orderCreatedCount, orderErrorCount] = await Promise.all([
      prisma.systemLog.count({ where: { logType: 'order_created' } }),
      prisma.systemLog.count({ where: { logType: 'order_error' } })
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
          count: item._count.id
        })),
        orderStats: {
          created: orderCreatedCount,
          errors: orderErrorCount,
          total: orderCreatedCount + orderErrorCount
        },
        storefrontStats: {
          success: storefrontSuccessCount,
          errors: storefrontErrorCount,
          notFound: storefront404s,
          total: storefrontSuccessCount + storefrontErrorCount + storefront404s
        },
        topSlugsByLogs: topSlugsByLogs.map(item => ({
          slug: item.slug,
          count: item._count.id
        })),
        logsByDay: logsByDay,
        onboardingStats
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
