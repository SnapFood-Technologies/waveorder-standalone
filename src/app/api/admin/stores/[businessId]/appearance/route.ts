// src/app/api/admin/stores/[businessId]/appearance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const appearanceSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  fontFamily: z.string().min(1, 'Font family is required'),
  whatsappButtonColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  mobileCartStyle: z.enum(['bar', 'badge']),
  cartBadgeColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  featuredBadgeColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  coverBackgroundSize: z.string().optional(),
  coverBackgroundPosition: z.string().optional(),
  coverHeight: z.string().optional(),
  logoPadding: z.string().optional(),
  logoObjectFit: z.string().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    // Check permissions for write operation
    if (!access.isImpersonating) {
      const businessUser = await prisma.businessUser.findFirst({
        where: {
          userId: access.session.user.id,
          businessId: businessId,
          role: { in: ['OWNER', 'MANAGER'] }
        }
      })

      if (!businessUser) {
        return NextResponse.json(
          { error: 'Insufficient permissions - requires OWNER or MANAGER role' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const validatedData = appearanceSchema.parse(body)

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        primaryColor: validatedData.primaryColor,
        secondaryColor: validatedData.secondaryColor,
        fontFamily: validatedData.fontFamily,
        whatsappButtonColor: validatedData.whatsappButtonColor,
        mobileCartStyle: validatedData.mobileCartStyle,
        cartBadgeColor: validatedData.cartBadgeColor,
        featuredBadgeColor: validatedData.featuredBadgeColor,
        coverBackgroundSize: validatedData.coverBackgroundSize || null,
        coverBackgroundPosition: validatedData.coverBackgroundPosition || null,
        coverHeight: validatedData.coverHeight || null,
        logoPadding: validatedData.logoPadding || null,
        logoObjectFit: validatedData.logoObjectFit || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        slug: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        whatsappButtonColor: true,
        mobileCartStyle: true,
        cartBadgeColor: true,
        featuredBadgeColor: true,
        coverBackgroundSize: true,
        coverBackgroundPosition: true,
        coverHeight: true,
        logoPadding: true,
        logoObjectFit: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Appearance settings updated successfully',
      business: updatedBusiness
    })

  } catch (error) {
    console.error('Error updating appearance settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          // @ts-ignore
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update appearance settings' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        businessType: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        whatsappButtonColor: true,
        mobileCartStyle: true,
        cartBadgeColor: true,
        featuredBadgeColor: true,
        coverBackgroundSize: true,
        coverBackgroundPosition: true,
        coverHeight: true,
        logoPadding: true,
        logoObjectFit: true,
        currency: true,
        language: true,
        description: true,
        logo: true,
        coverImage: true,
        deliveryEnabled: true,
        pickupEnabled: true,
        dineInEnabled: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, business })

  } catch (error) {
    console.error('Error fetching appearance settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appearance settings' },
      { status: 500 }
    )
  }
}