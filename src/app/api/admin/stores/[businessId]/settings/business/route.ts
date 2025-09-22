// app/api/admin/stores/[businessId]/settings/business/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to business
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        businessType: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        coverImage: true,
        currency: true,
        timezone: true,
        language: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        seoTitleAl: true,
        seoDescriptionAl: true,
        seoKeywordsAl: true,
        isTemporarilyClosed: true,
        closureReason: true,
        closureMessage: true,
        closureStartDate: true,
        closureEndDate: true,
        isIndexable: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ business })

  } catch (error) {
    console.error('Error fetching business settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const data = await request.json()

    // Verify user has access to business
    const existingBusiness = await prisma.business.findFirst({
      where: {
        id: businessId,
        users: {
          some: {
            user: {
              email: session.user.email
            }
          }
        }
      }
    })

    if (!existingBusiness) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Validate required fields
    if (!data.name?.trim()) {
      return NextResponse.json({ message: 'Business name is required' }, { status: 400 })
    }

    if (!data.slug?.trim()) {
      return NextResponse.json({ message: 'Store URL is required' }, { status: 400 })
    }

    if (!data.address?.trim()) {
      return NextResponse.json({ message: 'Business address is required' }, { status: 400 })
    }

    // Check slug uniqueness if changed
    if (data.slug !== existingBusiness.slug) {
      const slugExists = await prisma.business.findFirst({
        where: {
          slug: data.slug,
          id: { not: businessId }
        }
      })

      if (slugExists) {
        return NextResponse.json({ message: 'Store URL is already taken' }, { status: 400 })
      }
    }

    // Update business
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name.trim(),
        slug: data.slug.trim().toLowerCase(),
        description: data.description?.trim() || null,
        businessType: data.businessType,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        website: data.website?.trim() || null,
        logo: data.logo || null,
        coverImage: data.coverImage || null,
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
        seoTitle: data.seoTitle?.trim() || null,
        seoDescription: data.seoDescription?.trim() || null,
        seoKeywords: data.seoKeywords?.trim() || null,
        seoTitleAl: data.seoTitleAl?.trim() || null,
        seoDescriptionAl: data.seoDescriptionAl?.trim() || null,
        seoKeywordsAl: data.seoKeywordsAl?.trim() || null,
        isTemporarilyClosed: data.isTemporarilyClosed || false,
        closureReason: data.isTemporarilyClosed ? (data.closureReason?.trim() || null) : null,
        closureMessage: data.isTemporarilyClosed ? (data.closureMessage?.trim() || null) : null,
        closureStartDate: data.isTemporarilyClosed && data.closureStartDate 
          ? new Date(data.closureStartDate) : null,
        closureEndDate: data.isTemporarilyClosed && data.closureEndDate 
          ? new Date(data.closureEndDate) : null,
        isIndexable: data.isIndexable !== undefined ? data.isIndexable : true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        businessType: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        coverImage: true,
        currency: true,
        timezone: true,
        language: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        seoTitleAl: true,
        seoDescriptionAl: true,
        seoKeywordsAl: true,
        isTemporarilyClosed: true,
        closureReason: true,
        closureMessage: true,
        closureStartDate: true,
        closureEndDate: true,
        isIndexable: true
      }
    })

    return NextResponse.json({ business: updatedBusiness })

  } catch (error) {
    console.error('Error updating business settings:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}