// app/api/setup/check-slug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function POST(request: NextRequest) {
  try {
    const { slug, setupToken } = await request.json()

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { available: false, message: 'Slug must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Get current user's business ID
    let currentBusinessId = null
    
    // Try session first
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { 
          businesses: { 
            include: { business: true } 
          } 
        }
      })
      currentBusinessId = user?.businesses?.[0]?.business?.id
    }
    
    // If no session, try setup token
    if (!currentBusinessId && setupToken) {
      const user = await prisma.user.findFirst({
        where: { 
          setupToken: setupToken,
          setupExpiry: { gt: new Date() }
        },
        include: { 
          businesses: { 
            include: { business: true } 
          } 
        }
      })
      currentBusinessId = user?.businesses?.[0]?.business?.id
    }

    const existingBusiness = await prisma.business.findUnique({
      where: { slug }
    })

    // Available if no business exists OR it's the current user's business
    const available = !existingBusiness || existingBusiness.id === currentBusinessId

    return NextResponse.json({ available })
  } catch (error) {
    console.error('Check slug error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}