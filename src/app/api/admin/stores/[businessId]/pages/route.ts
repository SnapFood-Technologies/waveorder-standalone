import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Predefined page slugs
export const PREDEFINED_PAGES = [
  { slug: 'privacy-policy', title: 'Privacy Policy', pageType: 'PRIVACY_POLICY' },
  { slug: 'terms-of-use', title: 'Terms of Use', pageType: 'TERMS' },
  { slug: 'payment-methods', title: 'Payment Methods', pageType: 'PAYMENT' },
  { slug: 'cancellation-return', title: 'Cancellation and Return Policy', pageType: 'CANCELLATION' },
  { slug: 'shipping-policy', title: 'Shipping Policy', pageType: 'SHIPPING' },
  { slug: 'refund-policy', title: 'Refund Policy', pageType: 'REFUND' },
]

// GET - List all pages for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    })

    if (!businessUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { legalPagesEnabled: true },
    })

    if (!business?.legalPagesEnabled) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 })
    }

    // Get all pages
    const pages = await prisma.storePage.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    // Get predefined pages that don't exist yet
    const existingSlugs = new Set(pages.map(p => p.slug))
    const predefinedPages = PREDEFINED_PAGES
      .filter(p => !existingSlugs.has(p.slug))
      .map(p => ({
        id: null,
        slug: p.slug,
        title: p.title,
        content: '',
        isEnabled: false,
        showInFooter: true,
        sortOrder: 0,
        pageType: p.pageType,
        noIndex: false,
        createdAt: null,
        updatedAt: null,
      }))

    return NextResponse.json({
      pages: [...pages, ...predefinedPages],
    })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

// POST - Create a new page
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    })

    if (!businessUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if feature is enabled
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { legalPagesEnabled: true },
    })

    if (!business?.legalPagesEnabled) {
      return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 })
    }

    const body = await request.json()
    const { slug, title, content, isEnabled, showInFooter, sortOrder, pageType } = body

    // Validate slug
    if (!slug || !title) {
      return NextResponse.json(
        { error: 'Slug and title are required' },
        { status: 400 }
      )
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase alphanumeric with hyphens only' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.storePage.findUnique({
      where: {
        businessId_slug: {
          businessId,
          slug,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 400 }
      )
    }

    // Create page
    const page = await prisma.storePage.create({
      data: {
        businessId,
        slug,
        title,
        content: content || '',
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        showInFooter: showInFooter !== undefined ? showInFooter : true,
        sortOrder: sortOrder || 0,
        pageType: pageType || 'CUSTOM',
        noIndex: noIndex !== undefined ? noIndex : false,
      },
    })

    return NextResponse.json({ page }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating page:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    )
  }
}
