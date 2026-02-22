import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function generateFingerprint(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const ua = request.headers.get('user-agent') || 'unknown'
  return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 32)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params

    const item = await prisma.roadmapItem.findUnique({
      where: { id: itemId, isPublic: true }
    })

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 })
    }

    const fingerprint = generateFingerprint(request)

    const existingVote = await prisma.roadmapVote.findUnique({
      where: {
        roadmapItemId_fingerprint: {
          roadmapItemId: itemId,
          fingerprint,
        }
      }
    })

    if (existingVote) {
      await prisma.$transaction([
        prisma.roadmapVote.delete({ where: { id: existingVote.id } }),
        prisma.roadmapItem.update({
          where: { id: itemId },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ])

      return NextResponse.json({ voted: false, upvoteCount: item.upvoteCount - 1 })
    }

    let email: string | null = null
    try {
      const body = await request.json()
      email = body.email || null
    } catch {
      // No body is fine
    }

    await prisma.$transaction([
      prisma.roadmapVote.create({
        data: {
          roadmapItemId: itemId,
          fingerprint,
          email,
        }
      }),
      prisma.roadmapItem.update({
        where: { id: itemId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ voted: true, upvoteCount: item.upvoteCount + 1 })
  } catch (error) {
    console.error('Error voting on roadmap item:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
