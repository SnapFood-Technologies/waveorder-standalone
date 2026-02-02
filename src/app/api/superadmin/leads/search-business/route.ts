// app/api/superadmin/leads/search-business/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const email = searchParams.get('email') || ''

    // If email provided, try to find exact match first
    if (email) {
      const exactMatch = await prisma.business.findFirst({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          createdAt: true
        }
      })

      if (exactMatch) {
        return NextResponse.json({ 
          businesses: [exactMatch],
          exactMatch: true
        })
      }
    }

    // Search by name, slug, or email
    if (query.length < 2) {
      return NextResponse.json({ businesses: [] })
    }

    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ businesses })

  } catch (error) {
    console.error('Error searching businesses:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
