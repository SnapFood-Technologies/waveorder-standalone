import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await params
    const data = await request.json()

    const existing = await prisma.superAdminNote.findUnique({ where: { id: noteId } })
    if (!existing) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.content !== undefined) updateData.content = data.content?.trim() || null
    if (data.type !== undefined) updateData.type = data.type
    if (data.category !== undefined) updateData.category = data.category
    if (data.isDone !== undefined) updateData.isDone = data.isDone
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    }

    const note = await prisma.superAdminNote.update({
      where: { id: noteId },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { noteId } = await params

    const existing = await prisma.superAdminNote.findUnique({ where: { id: noteId } })
    if (!existing) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 })
    }

    await prisma.superAdminNote.delete({ where: { id: noteId } })

    return NextResponse.json({ success: true, message: 'Note deleted' })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
