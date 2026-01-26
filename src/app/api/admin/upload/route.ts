// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'
import { uploadBusinessImage } from '@/lib/businessStorage'


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const businessId = formData.get('businessId') as string
    const crop = formData.get('crop') as string | null

    if (!file || !folder || !businessId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const validFolders = ['logo', 'cover', 'favicon', 'ogImage'] as const
    if (!validFolders.includes(folder as any)) {
      return NextResponse.json({ message: 'Invalid folder type' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        logo: true,
        coverImage: true,
        favicon: true,
        ogImage: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const oldImageUrl = folder === 'logo' ? business.logo :
                       folder === 'cover' ? business.coverImage :
                       folder === 'favicon' ? business.favicon :
                       folder === 'ogImage' ? business.ogImage : null

    const result = await uploadBusinessImage(
      file, 
      businessId, 
      folder as 'logo' | 'cover' | 'favicon' | 'ogImage',
      oldImageUrl || undefined,
      folder === 'cover' ? { crop: crop !== 'false' } : undefined
    )

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      publicUrl: result.publicUrl,
      filename: result.filename
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}