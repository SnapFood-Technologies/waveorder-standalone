// src/app/api/user/cancel-email-change/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pendingEmail: null,
        emailChangeToken: null,
        emailChangeExpiry: null
      }
    })

    return NextResponse.json({
      message: 'Email change cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling email change:', error)
    return NextResponse.json(
      { error: 'Failed to cancel email change' },
      { status: 500 }
    )
  }
}