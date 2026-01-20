// app/api/admin/stores/[businessId]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { PrismaClient } from '@prisma/client'
import { uploadBusinessImage } from '@/lib/businessStorage'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const folder = formData.get('folder') as string || 'categories'
    const oldImageUrl = formData.get('oldImageUrl') as string | null
    const crop = formData.get('crop') as string | null

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    const result = await uploadBusinessImage(
      file, 
      businessId, 
      folder as 'logo' | 'cover' | 'favicon' | 'ogImage' | 'categories' | 'products',
      oldImageUrl || undefined,
      folder === 'cover' ? { crop: crop !== 'false' } : undefined
    )

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      imageUrl: result.publicUrl,
      publicUrl: result.publicUrl,
      filename: result.filename,
      message: 'Image uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}