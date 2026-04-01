import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runSuperadminHolaProvisionSync } from '@/lib/holaora-provisioning'

const bodySchema = z.object({
  bundleType: z.enum(['FREE', 'PAID']),
})

/**
 * SuperAdmin: record bundle tier + trigger provision path (stub / future Hola HTTP).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ message: 'bundleType FREE | PAID required' }, { status: 400 })
    }

    const exists = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ message: 'Business not found' }, { status: 404 })
    }

    await runSuperadminHolaProvisionSync(businessId, parsed.data.bundleType)

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        holaoraProvisionBundleType: true,
        holaoraProvisioningStatus: true,
        holaoraAccountId: true,
        holaoraEntitled: true,
      },
    })

    return NextResponse.json({ success: true, business })
  } catch (error) {
    console.error('POST holaora-sync:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
