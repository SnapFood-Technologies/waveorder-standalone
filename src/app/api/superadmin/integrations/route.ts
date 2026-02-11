// src/app/api/superadmin/integrations/route.ts
/**
 * SuperAdmin API for managing platform integrations.
 * GET  - List all integrations with stats
 * POST - Create a new integration
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateIntegrationKey } from '@/lib/integration-auth'

// ===========================================
// GET - List all integrations
// ===========================================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, active, inactive

    // Build filter conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    // Fetch integrations with log counts
    const integrations = await prisma.integration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    })

    // Calculate connected businesses per integration by querying businesses with externalIds
    const allBusinesses = await prisma.business.findMany({
      where: {
        externalIds: { not: null },
      },
      select: {
        id: true,
        externalIds: true,
      },
    })

    // Count connected businesses per integration slug
    const connectedCounts: Record<string, number> = {}
    for (const biz of allBusinesses) {
      if (biz.externalIds && typeof biz.externalIds === 'object') {
        const ids = biz.externalIds as Record<string, string>
        for (const slug of Object.keys(ids)) {
          connectedCounts[slug] = (connectedCounts[slug] || 0) + 1
        }
      }
    }

    // Get API call counts for last 30 days per integration
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentLogs = await prisma.integrationLog.groupBy({
      by: ['integrationId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    })

    const recentLogCounts: Record<string, number> = {}
    for (const log of recentLogs) {
      recentLogCounts[log.integrationId] = log._count.id
    }

    // Enrich integrations with stats
    const enrichedIntegrations = integrations.map((integration) => ({
      ...integration,
      connectedBusinesses: connectedCounts[integration.slug] || 0,
      apiCalls30d: recentLogCounts[integration.id] || 0,
      totalLogs: integration._count.logs,
    }))

    // Overall stats
    const stats = {
      total: integrations.length,
      active: integrations.filter((i) => i.isActive).length,
      totalConnectedBusinesses: Object.values(connectedCounts).reduce((sum, c) => sum + c, 0),
      totalApiCalls30d: Object.values(recentLogCounts).reduce((sum, c) => sum + c, 0),
    }

    return NextResponse.json({
      integrations: enrichedIntegrations,
      stats,
    })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// ===========================================
// POST - Create a new integration
// ===========================================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { message: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Sanitize slug: lowercase, alphanumeric + hyphens only
    const slug = data.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')

    if (!slug) {
      return NextResponse.json(
        { message: 'Invalid slug. Use lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existing = await prisma.integration.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        { message: `An integration with slug "${slug}" already exists` },
        { status: 409 }
      )
    }

    // Generate API key
    const { plainKey, keyHash, keyPreview } = generateIntegrationKey()

    // Create integration
    const integration = await prisma.integration.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        apiKey: keyHash,
        apiKeyPreview: keyPreview,
        isActive: true,
        logoUrl: data.logoUrl?.trim() || null,
        webhookUrl: data.webhookUrl?.trim() || null,
        config: data.config || null,
      },
    })

    return NextResponse.json({
      integration,
      // Return the plain API key only once -- it cannot be retrieved again
      apiKey: plainKey,
      message: 'Integration created successfully. Save the API key -- it will not be shown again.',
    })
  } catch (error) {
    console.error('Error creating integration:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
