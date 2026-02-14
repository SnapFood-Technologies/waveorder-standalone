import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all enabled pages for storefront (for modal/footer)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        legalPagesEnabled: true,
        legalPagesCtaEnabled: true,
        legalPagesCtaText: true,
      },
    })

    if (!business || !business.legalPagesEnabled) {
      return NextResponse.json({ pages: [], ctaEnabled: false, ctaText: null })
    }

    // Get all enabled pages
    const pages = await prisma.storePage.findMany({
      where: {
        businessId: business.id,
        isEnabled: true,
      },
      select: {
        slug: true,
        title: true,
        showInFooter: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      pages,
      ctaEnabled: business.legalPagesCtaEnabled || false,
      ctaText: business.legalPagesCtaText || 'Privacy & Policies',
    })
  } catch (error) {
    console.error('Error fetching storefront pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}
