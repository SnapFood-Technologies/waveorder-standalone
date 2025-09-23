// src/app/api/admin/stores/[businessId]/appearance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for appearance settings
const appearanceSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  fontFamily: z.string().min(1, 'Font family is required'),
  whatsappButtonColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  mobileCartStyle: z.enum(['bar', 'badge']),
  cartBadgeColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format'),
  featuredBadgeColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format')
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { businessId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId,
        role: {
          in: ['OWNER', 'MANAGER']
        }
      }
    })

    if (!businessUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = appearanceSchema.parse(body)

    // Update business appearance settings
    const updatedBusiness = await prisma.business.update({
      where: {
        id: businessId
      },
      data: {
        primaryColor: validatedData.primaryColor,
        secondaryColor: validatedData.secondaryColor,
        fontFamily: validatedData.fontFamily,
        whatsappButtonColor: validatedData.whatsappButtonColor,
        mobileCartStyle: validatedData.mobileCartStyle,
        cartBadgeColor: validatedData.cartBadgeColor,
        featuredBadgeColor: validatedData.featuredBadgeColor,
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
    const session = await getServerSession(authOptions)
    const { businessId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId: businessId
      }
    })

    if (!businessUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get business appearance settings
    const business = await prisma.business.findUnique({
      where: {
        id: businessId
      },
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
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      business
    })

  } catch (error) {
    console.error('Error fetching appearance settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appearance settings' },
      { status: 500 }
    )
  }
}