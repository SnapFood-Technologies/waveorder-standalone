// app/api/superadmin/leads/[leadId]/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await params

    const activities = await prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await params
    const data = await request.json()

    // Validate lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    // Validate required fields
    if (!data.type || !data.title) {
      return NextResponse.json(
        { message: 'Type and title are required' },
        { status: 400 }
      )
    }

    // Create activity
    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        type: data.type,
        title: data.title,
        description: data.description || null,
        performedById: session.user.id,
        performedBy: session.user.name || session.user.email || 'Unknown',
        metadata: data.metadata || null
      }
    })

    // Update lead's lastContactedAt if it's a contact activity
    const contactActivities = ['EMAIL_SENT', 'EMAIL_RECEIVED', 'CALL', 'MEETING', 'DEMO']
    if (contactActivities.includes(data.type)) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          lastContactedAt: new Date(),
          contactCount: { increment: 1 }
        }
      })
    }

    // Update nextFollowUpAt if provided
    if (data.nextFollowUpAt) {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          nextFollowUpAt: new Date(data.nextFollowUpAt)
        }
      })
    }

    return NextResponse.json(
      { success: true, activity },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
