// app/api/setup/clear-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function POST(request: NextRequest) {
  try {
    const { setupToken } = await request.json()
    
    if (!setupToken) {
      return NextResponse.json({ message: 'Setup token is required' }, { status: 400 })
    }

    // Find and clear the setup token
    const user = await prisma.user.findFirst({
      where: {
        setupToken: setupToken
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Invalid setup token' }, { status: 404 })
    }

    // Clear the setup token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        setupToken: null,
        setupExpiry: null
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Clear setup token error:', error)
    return NextResponse.json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}