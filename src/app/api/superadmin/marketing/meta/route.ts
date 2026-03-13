// api/superadmin/marketing/meta/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List businesses with Meta Pixel and Commerce Manager status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all' // all | pixel | catalog

    const where: any = {
      isActive: true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (filter === 'pixel') {
      where.metaPixelEnabled = true
    } else if (filter === 'catalog') {
      where.metaCatalogExportEnabled = true
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        businessType: true,
        metaPixelEnabled: true,
        metaPixelId: true,
        metaCatalogExportEnabled: true,
        metaCatalogLastExportedAt: true
      }
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveorder.app'

    const items = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      businessType: b.businessType,
      storefrontUrl: `${baseUrl}/${b.slug}`,
      metaPixel: {
        enabled: b.metaPixelEnabled || false,
        used: !!(b.metaPixelEnabled && b.metaPixelId && b.metaPixelId.trim())
      },
      commerceManager: {
        enabled: b.metaCatalogExportEnabled || false,
        used: !!(b.metaCatalogExportEnabled && b.metaCatalogLastExportedAt)
      }
    }))

    return NextResponse.json({ businesses: items })
  } catch (error) {
    console.error('SuperAdmin Meta list error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch Meta businesses' },
      { status: 500 }
    )
  }
}
