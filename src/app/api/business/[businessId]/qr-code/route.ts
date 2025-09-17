// app/api/business/[businessId]/qr-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: { slug: true, name: true }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const storeUrl = `https://waveorder.com/${business.slug}`
    
    // Generate QR code URL using a service like qr-server.com
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`

    return NextResponse.json({
      storeUrl,
      qrCodeUrl,
      businessName: business.name
    })
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
