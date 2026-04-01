import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { holaOraConfigSchema } from '@/lib/integration-config'
import { decryptHolaPortalPassword, isHolaPortalCryptoConfigured } from '@/lib/holaora-portal-crypto'

/** SuperAdmin: decrypt Hola portal password stored on WaveOrder marketing site config. */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!isHolaPortalCryptoConfigured()) {
      return NextResponse.json({ message: 'Encryption key not configured' }, { status: 503 })
    }

    const integration = await prisma.integration.findFirst({ where: { kind: 'HOLAORA' } })
    if (!integration?.config) {
      return NextResponse.json({ message: 'No config' }, { status: 404 })
    }

    const parsed = holaOraConfigSchema.safeParse(integration.config)
    const enc = parsed.success ? parsed.data.waveorderMarketingSite?.portalPasswordEnc : null
    if (!enc) {
      return NextResponse.json({ message: 'No saved password' }, { status: 404 })
    }

    try {
      const password = decryptHolaPortalPassword(enc)
      return NextResponse.json({ password })
    } catch {
      return NextResponse.json({ message: 'Decrypt failed' }, { status: 500 })
    }
  } catch (e) {
    console.error('GET waveorder-website reveal-password', e)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
