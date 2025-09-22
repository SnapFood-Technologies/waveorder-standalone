// app/api/admin/stores/[businessId]/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { authOptions } from '@/lib/auth'

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
      const file = formData.get('image') as File
  
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
  
      // In a real implementation, you would upload to a cloud storage service
      // For now, we'll simulate a successful upload
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      const imageUrl = `/uploads/${businessId}/${fileName}`
  
      // TODO: Implement actual file upload to your storage solution
      // Examples: AWS S3, Cloudinary, Vercel Blob, etc.
      
      return NextResponse.json({ 
        imageUrl,
        message: 'Image uploaded successfully'
      })
  
    } catch (error) {
      console.error('Error uploading image:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
  }