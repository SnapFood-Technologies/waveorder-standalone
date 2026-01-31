// src/app/api/admin/stores/[businessId]/user-role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if SuperAdmin is impersonating
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json({ role: 'OWNER' }) // SuperAdmin has full access when impersonating
    }

    // Get user's role for this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        userId: session.user.id,
        businessId
      },
      select: {
        role: true
      }
    })

    if (!businessUser) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ role: businessUser.role })

  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
