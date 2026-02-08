// src/app/api/admin/stores/[businessId]/api-keys/route.ts
/**
 * Admin API: Manage API keys for a business
 * GET - List all API keys
 * POST - Create new API key
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApiKey, DEFAULT_SCOPES, AVAILABLE_SCOPES } from '@/lib/api-auth'

// ===========================================
// GET - List API Keys
// ===========================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to this business
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id
      }
    })

    if (!businessUser && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check business has Business plan
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { subscriptionPlan: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.subscriptionPlan !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'API access requires Business plan' },
        { status: 403 }
      )
    }

    // Fetch API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        keyPreview: true,
        scopes: true,
        lastUsedAt: true,
        requestCount: true,
        expiresAt: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      apiKeys,
      availableScopes: AVAILABLE_SCOPES
    })

  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// ===========================================
// POST - Create New API Key
// ===========================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = await params

    // Verify user has access to this business (owner only for creating keys)
    const businessUser = await prisma.businessUser.findFirst({
      where: {
        businessId,
        userId: session.user.id,
        role: 'OWNER'
      }
    })

    if (!businessUser && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only owners can create API keys' }, { status: 403 })
    }

    // Check business has Business plan
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { subscriptionPlan: true, name: true }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    if (business.subscriptionPlan !== 'BUSINESS') {
      return NextResponse.json(
        { error: 'API access requires Business plan' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, scopes } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      )
    }

    // Validate scopes
    const validScopeIds: string[] = AVAILABLE_SCOPES.map(s => s.id)
    const selectedScopes = scopes && Array.isArray(scopes) && scopes.length > 0
      ? scopes.filter((s: string) => validScopeIds.includes(s))
      : DEFAULT_SCOPES

    // Check key limit (max 5 keys per business)
    const existingCount = await prisma.apiKey.count({
      where: { businessId, isActive: true }
    })

    if (existingCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 active API keys allowed. Revoke an existing key first.' },
        { status: 400 }
      )
    }

    // Generate API key
    const { plainKey, keyHash, keyPreview } = generateApiKey()

    // Create API key record
    const apiKey = await prisma.apiKey.create({
      data: {
        businessId,
        name: name.trim(),
        keyHash,
        keyPreview,
        scopes: selectedScopes
      },
      select: {
        id: true,
        name: true,
        keyPreview: true,
        scopes: true,
        createdAt: true
      }
    })

    // Return the plain key ONLY on creation (never stored, never returned again)
    return NextResponse.json({
      message: 'API key created successfully. Save this key now — it won\'t be shown again.',
      apiKey: {
        ...apiKey,
        key: plainKey // Only returned once!
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}
