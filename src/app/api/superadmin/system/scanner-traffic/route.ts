import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    // Fetch all storefront_404 logs (we filter in JS since MongoDB regex is limited in Prisma)
    const allSpamLogs = await prisma.systemLog.findMany({
      where: {
        logType: 'storefront_404',
        ...dateFilter,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        ipAddress: true,
        userAgent: true,
        country: true,
        city: true,
        url: true,
        createdAt: true,
      }
    })

    // Filter to only spam entries
    const spamLogs = allSpamLogs.filter(log => isSpamSlug(log.slug))

    // Categorize spam
    const categorized = spamLogs.map(log => {
      const slug = (log.slug || '').toLowerCase()
      let cat = 'other'
      if (/^(wp-|wordpress|xmlrpc)/i.test(slug)) cat = 'wordpress'
      else if (/\.(php|asp|aspx|jsp|cgi)$/i.test(slug)) cat = 'server_probe'
      else if (/\.(env|git|aws|config|htaccess|htpasswd|ds_store|gitignore|npmrc|dockerignore)/i.test(slug) || slug.startsWith('.')) cat = 'config_file'
      else if (/\.(png|ico|jpg|jpeg|gif|webp|svg)$/i.test(slug) || slug.includes('apple-touch-icon') || slug === 'favicon' || slug === 'browserconfig') cat = 'asset_probe'
      else if (['phpmyadmin', 'cpanel', 'admin', 'administrator', 'dashboard', 'login', 'superadmin', 'management'].includes(slug)) cat = 'admin_panel'
      else if (['passwd', 'etc', 'proc', 'boot', 'root', 'tmp', 'var', 'usr', 'bin', 'shell', 'cmd', 'eval', 'exec', 'system'].includes(slug)) cat = 'path_traversal'
      return { ...log, category: cat, createdAt: log.createdAt.toISOString() }
    })

    // Apply category filter
    const filtered = category ? categorized.filter(l => l.category === category) : categorized

    // Stats
    const byCategoryMap: Record<string, number> = {}
    categorized.forEach(l => {
      byCategoryMap[l.category] = (byCategoryMap[l.category] || 0) + 1
    })

    // Top targeted slugs
    const slugCountMap: Record<string, number> = {}
    categorized.forEach(l => {
      if (l.slug) slugCountMap[l.slug] = (slugCountMap[l.slug] || 0) + 1
    })
    const topTargetedSlugs = Object.entries(slugCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([slug, count]) => ({ slug, count }))

    // Top source IPs
    const ipCountMap: Record<string, number> = {}
    categorized.forEach(l => {
      if (l.ipAddress) ipCountMap[l.ipAddress] = (ipCountMap[l.ipAddress] || 0) + 1
    })
    const topSourceIPs = Object.entries(ipCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([ip, count]) => ({ ip, count }))

    // Top source countries
    const countryCountMap: Record<string, number> = {}
    categorized.forEach(l => {
      const c = l.country || 'Unknown'
      countryCountMap[c] = (countryCountMap[c] || 0) + 1
    })
    const topCountries = Object.entries(countryCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }))

    // Daily trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentSpam = categorized.filter(l => new Date(l.createdAt) >= sevenDaysAgo)
    const dailyMap: Record<string, number> = {}
    recentSpam.forEach(l => {
      const day = l.createdAt.split('T')[0]
      dailyMap[day] = (dailyMap[day] || 0) + 1
    })
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Paginate
    const paginatedLogs = filtered.slice((page - 1) * limit, page * limit)

    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      },
      stats: {
        total: categorized.length,
        byCategory: Object.entries(byCategoryMap)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count),
        topTargetedSlugs,
        topSourceIPs,
        topCountries,
        dailyTrend,
      }
    })
  } catch (error) {
    console.error('Error fetching scanner traffic:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
