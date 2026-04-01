import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Same scope as /superadmin/businesses default (active, non-test); then Hola subsets. */
const FILTERS = ['active', 'hola_linked', 'hola_entitled'] as const
type Filter = (typeof FILTERS)[number]

function parseFilter(v: string | null): Filter {
  if (v && FILTERS.includes(v as Filter)) return v as Filter
  return 'active'
}

/**
 * Paginated business directory for HolaOra SuperAdmin hub (search + filter).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const filter = parseFilter(searchParams.get('filter'))
    const take = Math.min(Math.max(Number(searchParams.get('take')) || 25, 1), 100)
    const skip = Math.max(Number(searchParams.get('skip')) || 0, 0)

    const andParts: object[] = [
      { NOT: { testMode: true } },
      { isActive: true },
    ]

    if (filter === 'hola_linked') {
      andParts.push({ holaoraAccountId: { not: null } })
    }
    if (filter === 'hola_entitled') {
      andParts.push({ holaoraEntitled: true })
    }

    if (search) {
      andParts.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      })
    }

    const where = { AND: andParts }

    const [rows, total] = await Promise.all([
      prisma.business.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          businessType: true,
          isActive: true,
          holaoraAccountId: true,
          holaoraEntitled: true,
          holaoraEntitlementSource: true,
          holaoraProvisionBundleType: true,
          holaoraProvisioningStatus: true,
          holaoraSuperAdminForceOff: true,
          holaoraStorefrontEmbedEnabled: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        take,
        skip,
      }),
      prisma.business.count({ where }),
    ])

    return NextResponse.json({
      rows,
      total,
      take,
      skip,
    })
  } catch (error) {
    console.error('GET holaora/directory:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
