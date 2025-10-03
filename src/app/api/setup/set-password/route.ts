// app/api/setup/set-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordSetupToken: token,
        passwordSetupExpiry: { gt: new Date() }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired setup token' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordSetupToken: null,
        passwordSetupExpiry: null,
        emailVerified: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password created successfully'
    })
  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}