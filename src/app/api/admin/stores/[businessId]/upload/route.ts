// app/api/admin/stores/[businessId]/upload/route.ts - Updated to use Supabase
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { uploadBusinessImage } from '@/lib/businessStorage'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const formData = await request.formData()
    const file = formData.get('image') as File // Keep the existing 'image' field name
    const folder = formData.get('folder') as string || 'categories' // Default to categories
    const oldImageUrl = formData.get('oldImageUrl') as string | null

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

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
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    // Upload image to Supabase using your existing storage system
    const result = await uploadBusinessImage(
      file, 
      businessId, 
      folder as 'logo' | 'cover' | 'favicon' | 'ogImage' | 'categories' | 'products',
      oldImageUrl || undefined
    )

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      imageUrl: result.publicUrl, // Keep the existing field name for compatibility
      publicUrl: result.publicUrl, // Also provide the new field name
      filename: result.filename,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}