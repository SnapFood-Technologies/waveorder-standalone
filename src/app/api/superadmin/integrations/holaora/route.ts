/**
 * Single HolaOra platform integration row + businesses linked via holaoraAccountId.
 * Used by /superadmin/integrations/holaora.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseHolaOraConfig } from '@/lib/integration-config'
import { normalizeIntegrationKind } from '@/lib/integration-kind'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const integration = await prisma.integration.findFirst({
      where: { kind: 'HOLAORA' },
      include: {
        _count: { select: { logs: true } },
      },
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let apiCalls30d = 0
    if (integration) {
      apiCalls30d = await prisma.integrationLog.count({
        where: {
          integrationId: integration.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      })
    }

    const businessesWithAccount = await prisma.business.findMany({
      where: { holaoraAccountId: { not: null } },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        businessType: true,
        isActive: true,
        holaoraAccountId: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      take: 200,
    })

    const totalWithHolaAccount = await prisma.business.count({
      where: { holaoraAccountId: { not: null } },
    })

    let externalIdConnected = 0
    if (integration?.slug) {
      const all = await prisma.business.findMany({
        where: { externalIds: { not: null } },
        select: { externalIds: true },
      })
      for (const b of all) {
        if (b.externalIds && typeof b.externalIds === 'object') {
          const ids = b.externalIds as Record<string, string>
          if (ids[integration.slug] !== undefined) externalIdConnected++
        }
      }
    }

    const parsedConfig = integration
      ? parseHolaOraConfig(integration.config)
      : null

    return NextResponse.json({
      integration: integration
        ? {
            ...integration,
            kind: normalizeIntegrationKind(integration.kind),
            parsedConfig,
            apiCalls30d,
          }
        : null,
      businessesWithAccount,
      totalWithHolaAccount,
      externalIdConnectedViaSlug: integration ? externalIdConnected : 0,
    })
  } catch (error) {
    console.error('GET /api/superadmin/integrations/holaora:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
