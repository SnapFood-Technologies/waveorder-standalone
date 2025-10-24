import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get SuperAdmin settings
    const settings = await prisma.superAdminSettings.findFirst({
      where: { userId: session.user.id },
      select: {
        supportTeamName: true,
        primaryEmail: true,
        supportEmail: true,
        supportPhone: true,
        supportWebsite: true
      }
    })

    return NextResponse.json({
      success: true,
      settings: settings || {
        supportTeamName: 'WaveOrder Support Team',
        primaryEmail: session.user.email,
        supportEmail: 'support@waveorder.app',
        supportPhone: null,
        supportWebsite: null
      }
    })

  } catch (error) {
    console.error('Error fetching SuperAdmin settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
