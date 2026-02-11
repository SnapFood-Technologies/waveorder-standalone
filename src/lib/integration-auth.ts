// src/lib/integration-auth.ts
/**
 * Authentication utilities for platform integrations (ChowTap, VenueBoost, etc.)
 * Handles integration API key generation, validation, rate limiting, and logging.
 * 
 * Integration keys use the `wo_int_` prefix to distinguish from business API keys (`wo_live_`).
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logSystemEvent } from '@/lib/systemLog'
import crypto from 'crypto'

// ===========================================
// Types
// ===========================================
export interface IntegrationAuthData {
  integrationId: string
  integrationSlug: string
  integrationName: string
}

export interface IntegrationAuthResult {
  success: boolean
  data?: IntegrationAuthData
  error?: string
  statusCode?: number
}

// ===========================================
// Constants
// ===========================================
const INTEGRATION_KEY_PREFIX = 'wo_int_'
const DEFAULT_RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const DEFAULT_RATE_LIMIT_MAX = 60 // 60 requests per minute

// In-memory rate limiting (for single instance, use Redis for multi-instance)
const integrationRateLimitStore = new Map<string, { count: number; resetAt: number }>()

// ===========================================
// API Key Generation
// ===========================================

/**
 * Generate a new integration API key.
 * Returns the plain key (show once to admin) and its hash (store in DB).
 */
export function generateIntegrationKey(): { plainKey: string; keyHash: string; keyPreview: string } {
  const randomBytes = crypto.randomBytes(32)
  const keyBody = randomBytes.toString('base64url')

  const plainKey = `${INTEGRATION_KEY_PREFIX}${keyBody}`
  const keyHash = hashIntegrationKey(plainKey)
  const keyPreview = `...${plainKey.slice(-4)}`

  return { plainKey, keyHash, keyPreview }
}

/**
 * Hash an integration key for storage/comparison using SHA-256.
 */
export function hashIntegrationKey(plainKey: string): string {
  return crypto.createHash('sha256').update(plainKey).digest('hex')
}

// ===========================================
// API Key Extraction
// ===========================================

/**
 * Extract integration API key from request headers.
 * Supports: Authorization: Bearer wo_int_xxx or X-API-Key: wo_int_xxx
 */
export function extractIntegrationKey(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7)
    if (key.startsWith(INTEGRATION_KEY_PREFIX)) {
      return key
    }
  }

  // Check X-API-Key header
  const xApiKey = request.headers.get('x-api-key')
  if (xApiKey?.startsWith(INTEGRATION_KEY_PREFIX)) {
    return xApiKey
  }

  return null
}

// ===========================================
// API Key Validation
// ===========================================

/**
 * Validate an integration API key against the database.
 * Checks that the key exists, the integration is active, and returns integration data.
 */
export async function validateIntegrationKey(plainKey: string): Promise<IntegrationAuthResult> {
  try {
    const keyHash = hashIntegrationKey(plainKey)

    const integration = await prisma.integration.findFirst({
      where: {
        apiKey: keyHash,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    })

    if (!integration) {
      return {
        success: false,
        error: 'Invalid or inactive integration API key',
        statusCode: 401,
      }
    }

    return {
      success: true,
      data: {
        integrationId: integration.id,
        integrationSlug: integration.slug,
        integrationName: integration.name,
      },
    }
  } catch (error) {
    console.error('Integration key validation error:', error)
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500,
    }
  }
}

// ===========================================
// Rate Limiting
// ===========================================

/**
 * Check and apply rate limit for an integration.
 * Rate limit can be customized per integration via config.rateLimit JSON field.
 */
export function checkIntegrationRateLimit(
  integrationId: string,
  maxRequests: number = DEFAULT_RATE_LIMIT_MAX
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = integrationRateLimitStore.get(integrationId)

  // Periodic cleanup of stale entries
  if (Math.random() < 0.01) {
    cleanupIntegrationRateLimitStore()
  }

  if (!record || now > record.resetAt) {
    integrationRateLimitStore.set(integrationId, { count: 1, resetAt: now + DEFAULT_RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: maxRequests - 1, resetIn: DEFAULT_RATE_LIMIT_WINDOW }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetAt - now }
}

function cleanupIntegrationRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of integrationRateLimitStore.entries()) {
    if (now > record.resetAt) {
      integrationRateLimitStore.delete(key)
    }
  }
}

// ===========================================
// Logging
// ===========================================

/**
 * Log an API call made by an integration.
 * Fire-and-forget: errors are caught and logged to console, not thrown.
 */
export async function logIntegrationCall(params: {
  integrationId: string
  businessId?: string | null
  endpoint: string
  method: string
  statusCode: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseBody?: any
  ipAddress?: string | null
  duration?: number | null
  error?: string | null
}): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        integrationId: params.integrationId,
        businessId: params.businessId || undefined,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        requestBody: params.requestBody ?? undefined,
        responseBody: params.responseBody ?? undefined,
        ipAddress: params.ipAddress || undefined,
        duration: params.duration || undefined,
        error: params.error || undefined,
      },
    })
    // Also log to system logs for SuperAdmin visibility
    logSystemEvent({
      logType: 'integration_api_call',
      severity: params.statusCode >= 400 ? 'error' : 'info',
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.statusCode,
      url: params.endpoint,
      ipAddress: params.ipAddress || undefined,
      errorMessage: params.error || `Integration API call: ${params.method} ${params.endpoint}`,
      metadata: {
        integrationId: params.integrationId,
        businessId: params.businessId || undefined,
        duration: params.duration || undefined
      }
    })
  } catch (err) {
    console.error('Failed to log integration call:', err)
  }
}

// ===========================================
// Main Auth Middleware
// ===========================================

/**
 * Authenticate an incoming integration API request.
 * Validates the API key, checks rate limits, and returns integration data.
 * 
 * Usage in route handlers:
 * ```
 * const authResult = await authenticateIntegrationRequest(request)
 * if (authResult instanceof NextResponse) return authResult
 * const { integration } = authResult
 * ```
 */
export async function authenticateIntegrationRequest(
  request: NextRequest
): Promise<{ integration: IntegrationAuthData } | NextResponse> {
  // Extract integration key from headers
  const apiKey = extractIntegrationKey(request)

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing integration API key. Use Authorization: Bearer wo_int_xxx or X-API-Key header.' },
      { status: 401 }
    )
  }

  // Validate the key
  const validation = await validateIntegrationKey(apiKey)

  if (!validation.success || !validation.data) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.statusCode || 401 }
    )
  }

  // Fetch integration config for custom rate limits
  let rateLimit = DEFAULT_RATE_LIMIT_MAX
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: validation.data.integrationId },
      select: { config: true },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = integration?.config as any
    if (config?.rateLimit && typeof config.rateLimit === 'number') {
      rateLimit = config.rateLimit
    }
  } catch {
    // Use default rate limit on error
  }

  // Check rate limit
  const rateLimitResult = checkIntegrationRateLimit(validation.data.integrationId, rateLimit)

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.', retryAfter: Math.ceil(rateLimitResult.resetIn / 1000) },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
          'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
        },
      }
    )
  }

  return { integration: validation.data }
}
