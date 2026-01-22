import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET - List all anomalies for a business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // OPEN, RESOLVED, IGNORED
    const type = searchParams.get('type') // ZERO_PRICE_PRODUCT, etc.

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true }
    })

    if (!business) {
      return NextResponse.json(
        { message: 'Business not found' },
        { status: 404 }
      )
    }

    // Build query
    const where: any = { businessId }
    if (status) where.status = status
    if (type) where.type = type

    // Fetch anomalies
    const anomalies = await prisma.anomaly.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // OPEN first
        { severity: 'desc' }, // CRITICAL first
        { detectedAt: 'desc' } // Most recent first
      ]
    })

    // Count by status
    const statusCounts = await prisma.anomaly.groupBy({
      by: ['status'],
      where: { businessId },
      _count: true
    })

    const counts = {
      total: anomalies.length,
      open: statusCounts.find(s => s.status === 'OPEN')?._count || 0,
      resolved: statusCounts.find(s => s.status === 'RESOLVED')?._count || 0,
      ignored: statusCounts.find(s => s.status === 'IGNORED')?._count || 0
    }

    return NextResponse.json({ anomalies, counts })
  } catch (error: any) {
    console.error('Error fetching anomalies:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update anomaly status (resolve/ignore)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { businessId } = await params
    const body = await request.json()
    const { anomalyId, status } = body

    if (!anomalyId || !status) {
      return NextResponse.json(
        { message: 'Anomaly ID and status are required' },
        { status: 400 }
      )
    }

    if (!['OPEN', 'RESOLVED', 'IGNORED'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update anomaly
    const updateData: any = { 
      status,
      lastChecked: new Date()
    }
    
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
      updateData.resolvedBy = session.user.id
    }

    const anomaly = await prisma.anomaly.update({
      where: {
        id: anomalyId,
        businessId // Ensure anomaly belongs to this business
      },
      data: updateData
    })

    return NextResponse.json({ anomaly })
  } catch (error: any) {
    console.error('Error updating anomaly:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
