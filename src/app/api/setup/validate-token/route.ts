// app/api/setup/validate-token/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { message: 'Setup token is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordSetupToken: token,
        passwordSetupExpiry: { gt: new Date() }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired setup token' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: user.name
    })
  } catch (error) {
    console.error('Error validating setup token:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}