// app/api/superadmin/leads/[leadId]/route.ts
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

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    // If convertedToId exists, fetch the business info
    let convertedBusiness = null
    if (lead.convertedToId) {
      convertedBusiness = await prisma.business.findUnique({
        where: { id: lead.convertedToId },
        select: {
          id: true,
          name: true,
          slug: true,
          subscriptionPlan: true,
          createdAt: true
        }
      })
    }

    return NextResponse.json({ 
      lead,
      convertedBusiness
    })

  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Get current lead state for activity logging
    const currentLead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!currentLead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    const activities: any[] = []

    // Track status change
    if (data.status && data.status !== currentLead.status) {
      updateData.status = data.status
      activities.push({
        leadId,
        type: 'STATUS_CHANGE',
        title: `Status changed to ${data.status}`,
        description: `Status changed from ${currentLead.status} to ${data.status}`,
        performedById: session.user.id,
        performedBy: session.user.name || session.user.email || 'Unknown'
      })
    }

    // Track team member assignment change
    if (data.teamMemberId !== undefined && data.teamMemberId !== currentLead.teamMemberId) {
      updateData.teamMemberId = data.teamMemberId || null
      updateData.assignedAt = data.teamMemberId ? new Date() : null
      
      if (data.teamMemberId) {
        const assignee = await prisma.teamMember.findUnique({
          where: { id: data.teamMemberId },
          select: { name: true, email: true }
        })
        activities.push({
          leadId,
          type: 'ASSIGNED',
          title: `Assigned to ${assignee?.name || assignee?.email || 'someone'}`,
          description: `Lead assigned to ${assignee?.name || assignee?.email}`,
          performedById: session.user.id,
          performedBy: session.user.name || session.user.email || 'Unknown'
        })
      } else {
        activities.push({
          leadId,
          type: 'ASSIGNED',
          title: 'Unassigned',
          description: 'Lead was unassigned',
          performedById: session.user.id,
          performedBy: session.user.name || session.user.email || 'Unknown'
        })
      }
    }
    
    // Track legacy user assignment change (backwards compatibility)
    if (data.assignedToId !== undefined && data.assignedToId !== currentLead.assignedToId) {
      updateData.assignedToId = data.assignedToId || null
      if (!data.teamMemberId) {
        updateData.assignedAt = data.assignedToId ? new Date() : null
      }
    }

    // Track contact
    if (data.lastContactedAt) {
      updateData.lastContactedAt = new Date(data.lastContactedAt)
      updateData.contactCount = { increment: 1 }
    }

    // Handle conversion
    if (data.status === 'WON' && data.convertedToId && !currentLead.convertedToId) {
      updateData.convertedAt = new Date()
      updateData.convertedToId = data.convertedToId
      updateData.conversionNotes = data.conversionNotes || null
    }

    // Update other fields
    const allowedFields = [
      'name', 'email', 'phone', 'company', 'country', 'source', 'sourceDetail',
      'referredBy', 'priority', 'score', 'businessType', 'estimatedValue',
      'expectedPlan', 'nextFollowUpAt', 'notes', 'tags'
    ]

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'nextFollowUpAt' && data[field]) {
          updateData[field] = new Date(data[field])
        } else {
          updateData[field] = data[field]
        }
      }
    })

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create activities
    if (activities.length > 0) {
      await prisma.leadActivity.createMany({
        data: activities
      })
    }

    return NextResponse.json({ success: true, lead: updatedLead })

  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await params

    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 })
    }

    // Delete lead (activities will cascade)
    await prisma.lead.delete({
      where: { id: leadId }
    })

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' })

  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
