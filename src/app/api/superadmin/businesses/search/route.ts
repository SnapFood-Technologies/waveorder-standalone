import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Lightweight search - ONLY id, name, slug. 1 query.
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ businesses: [] }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q') || ''

  if (!search || search.length < 2) {
    return NextResponse.json({ businesses: [] })
  }

  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      slug: true
    },
    take: 20,
    orderBy: { name: 'asc' }
  })

  return NextResponse.json({ businesses })
}
