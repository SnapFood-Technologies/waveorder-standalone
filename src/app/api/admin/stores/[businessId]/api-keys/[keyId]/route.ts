// src/app/api/admin/stores/[businessId]/api-keys/[keyId]/route.ts
/**
 * Admin API: Manage individual API key
 * DELETE - Revoke an API key
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
  { params }: { params: Promise<{ businessId: string; keyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId, keyId } = await params

    // Verify user has access to this business (owner only for revoking keys)
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: 'OWNER'
      }
    })

    if (!businessUser && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only owners can revoke API keys' }, { status: 403 })
    }

    // Verify the API key belongs to this business
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        businessId
      }
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Soft delete - mark as inactive instead of deleting
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
