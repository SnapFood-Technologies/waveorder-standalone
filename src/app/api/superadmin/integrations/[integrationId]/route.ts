// src/app/api/superadmin/integrations/[integrationId]/route.ts
/**
 * SuperAdmin API for managing a single integration.
 * GET    - Get integration details with connected businesses and recent logs
 * PUT    - Update integration settings
 * DELETE - Delete an integration
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ===========================================
// GET - Integration detail with connections and logs
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params

    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { logs: true },
        },
      },
    })

    if (!integration) {
      return NextResponse.json({ message: 'Integration not found' }, { status: 404 })
    }

    // Find connected businesses by checking externalIds JSON field
    const allBusinesses = await prisma.business.findMany({
      where: {
        externalIds: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        isActive: true,
        externalIds: true,
        createdAt: true,
      },
    })

    // Filter businesses that have this integration's slug in their externalIds
    const connectedBusinesses = allBusinesses
      .filter((biz) => {
        if (!biz.externalIds || typeof biz.externalIds !== 'object') return false
        const ids = biz.externalIds as Record<string, string>
        return ids[integration.slug] !== undefined
      })
      .map((biz) => {
        const ids = biz.externalIds as Record<string, string>
        return {
          id: biz.id,
          name: biz.name,
          slug: biz.slug,
          businessType: biz.businessType,
          isActive: biz.isActive,
          externalId: ids[integration.slug],
          createdAt: biz.createdAt,
        }
      })

    // API call stats for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const apiCalls30d = await prisma.integrationLog.count({
      where: {
        integrationId,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    return NextResponse.json({
      integration: {
        ...integration,
        connectedBusinesses,
        apiCalls30d,
        totalLogs: integration._count.logs,
      },
    })
  } catch (error) {
    console.error('Error fetching integration:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// ===========================================
// PUT - Update integration
// ===========================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params
    const data = await request.json()

    // Verify integration exists
    const existing = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Integration not found' }, { status: 404 })
    }

    // Build update data from allowed fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive)
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl?.trim() || null
    if (data.webhookUrl !== undefined) updateData.webhookUrl = data.webhookUrl?.trim() || null
    if (data.config !== undefined) updateData.config = data.config

    // Slug updates require uniqueness check
    if (data.slug !== undefined && data.slug !== existing.slug) {
      const slug = data.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '')

      const duplicateSlug = await prisma.integration.findUnique({
        where: { slug },
      })

      if (duplicateSlug) {
        return NextResponse.json(
          { message: `An integration with slug "${slug}" already exists` },
          { status: 409 }
        )
      }

      updateData.slug = slug
    }

    const updated = await prisma.integration.update({
      where: { id: integrationId },
      data: updateData,
    })

    return NextResponse.json({ integration: updated })
  } catch (error) {
    console.error('Error updating integration:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

// ===========================================
// DELETE - Delete integration
// ===========================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params

    // Verify integration exists
    const existing = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Integration not found' }, { status: 404 })
    }

    // Delete integration (cascading deletes logs)
    await prisma.integration.delete({
      where: { id: integrationId },
    })

    return NextResponse.json({ message: 'Integration deleted successfully' })
  } catch (error) {
    console.error('Error deleting integration:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
