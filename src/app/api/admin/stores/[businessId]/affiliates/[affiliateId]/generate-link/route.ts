// src/app/api/admin/stores/[businessId]/affiliates/[affiliateId]/generate-link/route.ts
// Generate affiliate tracking link
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkBusinessAccess } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string; affiliateId: string }> }
) {
  try {
    const { businessId, affiliateId } = await params

    const access = await checkBusinessAccess(businessId)
    
    if (!access.authorized) {
      return NextResponse.json({ message: access.error }, { status: access.status })
    }

    const affiliate = await prisma.affiliate.findFirst({
      where: {
        id: affiliateId,
        businessId
      },
      include: {
        business: {
          select: {
            slug: true
          }
        }
      }
    })

    if (!affiliate) {
      return NextResponse.json({ message: 'Affiliate not found' }, { status: 404 })
    }

    // Generate affiliate link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://waveorder.app'
    const trackingLink = `${baseUrl}/${affiliate.business.slug}?utm_source=affiliate&utm_campaign=${affiliate.trackingCode}&utm_medium=referral`

    return NextResponse.json({
      link: trackingLink,
      trackingCode: affiliate.trackingCode,
      affiliateName: affiliate.name
    })

  } catch (error) {
    console.error('Error generating affiliate link:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
