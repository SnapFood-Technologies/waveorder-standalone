// src/app/api/user/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activities = await prisma.loginActivity.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        loginAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        device: true,
        browser: true,
        location: true,
        ipAddress: true,
        loginAt: true
      }
    })

    return NextResponse.json({
      recentLogins: activities.map(activity => ({
        id: activity.id,
        device: activity.device,
        browser: activity.browser,
        location: activity.location,
        ipAddress: activity.ipAddress,
        loginAt: activity.loginAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}