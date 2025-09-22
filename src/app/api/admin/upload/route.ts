// app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadBusinessImage } from '@/lib/businessStorage'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const businessId = formData.get('businessId') as string

    if (!file || !folder || !businessId) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
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
      },
      select: {
        id: true,
        logo: true,
        coverImage: true,
        favicon: true,
        ogImage: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found or access denied' }, { status: 404 })
    }

    // Validate folder type
    const validFolders = ['logo', 'cover', 'favicon', 'ogImage'] as const
    if (!validFolders.includes(folder as any)) {
      return NextResponse.json({ message: 'Invalid folder type' }, { status: 400 })
    }

    // Get old image URL for cleanup
    const oldImageUrl = folder === 'logo' ? business.logo :
                       folder === 'cover' ? business.coverImage :
                       folder === 'favicon' ? business.favicon :
                       folder === 'ogImage' ? business.ogImage : null

    // Upload image to Supabase
    const result = await uploadBusinessImage(
      file, 
      businessId, 
      folder as 'logo' | 'cover' | 'favicon' | 'ogImage',
      oldImageUrl || undefined
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