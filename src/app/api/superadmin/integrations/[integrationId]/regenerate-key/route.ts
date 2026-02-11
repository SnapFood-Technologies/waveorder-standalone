// src/app/api/superadmin/integrations/[integrationId]/regenerate-key/route.ts
/**
 * Regenerate the API key for an integration.
 * The old key is invalidated immediately and a new one is generated.
 * The plain key is returned only once -- it cannot be retrieved again.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateIntegrationKey } from '@/lib/integration-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { integrationId } = await params

    // Verify integration exists
    const existing = await prisma.integration.findUnique({
      where: { id: integrationId },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Integration not found' }, { status: 404 })
    }

    // Generate new API key
    const { plainKey, keyHash, keyPreview } = generateIntegrationKey()

    // Update integration with new key (invalidates old key immediately)
    const updated = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        apiKey: keyHash,
        apiKeyPreview: keyPreview,
      },
    })

    return NextResponse.json({
      integration: updated,
      apiKey: plainKey,
      message: 'API key regenerated. Save the new key -- it will not be shown again.',
    })
  } catch (error) {
    console.error('Error regenerating integration key:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
