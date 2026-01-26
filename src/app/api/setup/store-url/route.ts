// app/api/setup/store-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ message: 'Business ID required' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        slug: true,
        name: true
      }
    })

    if (!business) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    const storeUrl = `https://waveorder.app/${business.slug}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(storeUrl)}`

    return NextResponse.json({
      storeUrl,
      qrCodeUrl,
      businessName: business.name,
      slug: business.slug
    })

  } catch (error) {
    console.error('Get store URL error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
