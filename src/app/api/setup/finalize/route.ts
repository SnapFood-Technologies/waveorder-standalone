// app/api/setup/finalize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await request.json()

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        setupWizardCompleted: true,
        onboardingCompleted: true,
        onboardingStep: 12
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    return NextResponse.json({
      success: true,
      business,
      redirectTo: `/admin/stores/${business.id}/dashboard`
    })

  } catch (error) {
    console.error('Finalize setup error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
