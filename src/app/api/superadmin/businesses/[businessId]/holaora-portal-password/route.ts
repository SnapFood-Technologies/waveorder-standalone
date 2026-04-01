import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptHolaPortalPassword, isHolaPortalCryptoConfigured } from '@/lib/holaora-portal-crypto'

/**
 * SuperAdmin only: decrypt and return saved HolaOra portal password (for support / eye reveal in hub).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!isHolaPortalCryptoConfigured()) {
      return NextResponse.json(
        { message: 'Server encryption key not configured (HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY).' },
        { status: 503 }
      )
    }

    const { businessId } = await params
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { holaoraPortalPasswordEnc: true },
    })
    if (!business?.holaoraPortalPasswordEnc) {
      return NextResponse.json({ message: 'No saved password for this business' }, { status: 404 })
    }

    try {
      const password = decryptHolaPortalPassword(business.holaoraPortalPasswordEnc)
      return NextResponse.json({ password })
    } catch {
      return NextResponse.json({ message: 'Could not decrypt stored password (wrong key?)' }, { status: 500 })
    }
  } catch (error) {
    console.error('GET holaora-portal-password:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
