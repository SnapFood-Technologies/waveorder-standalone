// src/app/api/superadmin/api-keys/[keyId]/route.ts
/**
 * SuperAdmin API: Manage individual API key
 * DELETE - Revoke an API key (SuperAdmin override)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ===========================================
// DELETE - Revoke API Key
// ===========================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { keyId } = await params

    // Verify the API key exists
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId }
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Soft delete - mark as inactive
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false }
    })

    return NextResponse.json({
      message: 'API key revoked successfully'
    })

  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
