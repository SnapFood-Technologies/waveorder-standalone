// app/api/setup/check-slug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json()

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { available: false, message: 'Slug must be at least 3 characters' },
        { status: 400 }
      )
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { slug }
    })

    return NextResponse.json({ available: !existingBusiness })
  } catch (error) {
    console.error('Check slug error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}