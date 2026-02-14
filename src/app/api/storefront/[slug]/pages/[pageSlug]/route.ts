import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get single page content for storefront
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; pageSlug: string }> }
) {
  try {
    const { slug, pageSlug } = await params

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        legalPagesEnabled: true,
      },
    })

    if (!business || !business.legalPagesEnabled) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const page = await prisma.storePage.findFirst({
      where: {
        businessId: business.id,
        slug: pageSlug,
        isEnabled: true,
      },
      select: {
        slug: true,
        title: true,
        content: true,
        pageType: true,
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({
      page: {
        ...page,
        businessName: business.name,
      },
    })
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}
