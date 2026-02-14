import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, pageId } = await params

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

    const page = await prisma.storePage.findFirst({
      where: {
        id: pageId,
        businessId,
      },
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

// PUT - Update page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, pageId } = await params

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

    const body = await request.json()
    const { slug, title, content, isEnabled, showInFooter, sortOrder, pageType, noIndex } = body

    // Check if page exists
    const existing = await prisma.storePage.findFirst({
      where: {
        id: pageId,
        businessId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // If slug is being changed, validate it
    if (slug && slug !== existing.slug) {
      const slugRegex = /^[a-z0-9-]+$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json(
          { error: 'Slug must be lowercase alphanumeric with hyphens only' },
          { status: 400 }
        )
      }

      // Check if new slug already exists
      const slugExists = await prisma.storePage.findUnique({
        where: {
          businessId_slug: {
            businessId,
            slug,
          },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Page with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update page
    const page = await prisma.storePage.update({
      where: { id: pageId },
      data: {
        ...(slug && { slug }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(showInFooter !== undefined && { showInFooter }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(pageType !== undefined && { pageType }),
        ...(noIndex !== undefined && { noIndex }),
      },
    })

    return NextResponse.json({ page })
  } catch (error: any) {
    console.error('Error updating page:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Page with this slug already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    )
  }
}

// DELETE - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, pageId } = await params

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

    // Check if page exists
    const existing = await prisma.storePage.findFirst({
      where: {
        id: pageId,
        businessId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Don't allow deleting predefined pages (they can be disabled instead)
    if (existing.pageType && existing.pageType !== 'CUSTOM') {
      return NextResponse.json(
        { error: 'Predefined pages cannot be deleted. Disable them instead.' },
        { status: 400 }
      )
    }

    await prisma.storePage.delete({
      where: { id: pageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    )
  }
}
