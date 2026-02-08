// src/lib/api-auth.ts
/**
 * API Authentication utilities for Business Plan API access
 * Handles API key generation, validation, and rate limiting
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// ===========================================
// Types
// ===========================================
export interface ApiKeyData {
  id: string
  businessId: string
  name: string
  scopes: string[]
}

export interface ApiAuthResult {
  success: boolean
  data?: ApiKeyData
  error?: string
  statusCode?: number
}

// ===========================================
// Constants
// ===========================================
const API_KEY_PREFIX = 'wo_live_'
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 60 // 60 requests per minute for Business plan

// In-memory rate limiting (for single instance, use Redis for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

// ===========================================
// API Key Generation
// ===========================================

/**
 * Generate a new API key
 * Returns the plain key (show once to user) and its hash (store in DB)
 */
export function generateApiKey(): { plainKey: string; keyHash: string; keyPreview: string } {
  // Generate 32 random bytes (256 bits of entropy)
  const randomBytes = crypto.randomBytes(32)
  const keyBody = randomBytes.toString('base64url')
  
  // Full key with prefix
  const plainKey = `${API_KEY_PREFIX}${keyBody}`
  
  // Hash for storage
  const keyHash = hashApiKey(plainKey)
  
  // Preview (last 4 chars)
  const keyPreview = `...${plainKey.slice(-4)}`
  
  return { plainKey, keyHash, keyPreview }
}

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(plainKey: string): string {
  return crypto.createHash('sha256').update(plainKey).digest('hex')
}

// ===========================================
// API Key Validation
// ===========================================

/**
 * Extract API key from request headers
 * Supports: Authorization: Bearer wo_live_xxx or X-API-Key: wo_live_xxx
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.slice(7)
    if (key.startsWith(API_KEY_PREFIX)) {
      return key
    }
  }
  
  // Check X-API-Key header
  const xApiKey = request.headers.get('x-api-key')
  if (xApiKey?.startsWith(API_KEY_PREFIX)) {
    return xApiKey
  }
  
  return null
}

/**
 * Validate API key and return business data
 */
export async function validateApiKey(plainKey: string): Promise<ApiAuthResult> {
  try {
    const keyHash = hashApiKey(plainKey)
    
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        business: {
          select: {
            id: true,
            subscriptionPlan: true,
            isActive: true
          }
        }
      }
    })
    
    if (!apiKey) {
      return {
        success: false,
        error: 'Invalid or expired API key',
        statusCode: 401
      }
    }
    
    // Check if business is active and has Business plan
    if (!apiKey.business.isActive) {
      return {
        success: false,
        error: 'Business account is inactive',
        statusCode: 403
      }
    }
    
    if (apiKey.business.subscriptionPlan !== 'BUSINESS') {
      return {
        success: false,
        error: 'API access requires Business plan',
        statusCode: 403
      }
    }
    
    // Update last used timestamp and request count (async, don't await)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        requestCount: { increment: 1 }
      }
    }).catch(console.error)
    
    return {
      success: true,
      data: {
        id: apiKey.id,
        businessId: apiKey.businessId,
        name: apiKey.name,
        scopes: apiKey.scopes
      }
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500
    }
  }
}

// ===========================================
// Rate Limiting
// ===========================================

/**
 * Check and apply rate limit
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(keyId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitStore.get(keyId)
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupRateLimitStore()
  }
  
  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(keyId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW }
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    // Rate limited
    return { allowed: false, remaining: 0, resetIn: record.resetAt - now }
  }
  
  // Increment count
  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: record.resetAt - now }
}

function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

// ===========================================
// Scope Checking
// ===========================================

/**
 * Check if API key has required scope
 */
export function hasScope(keyScopes: string[], requiredScope: string): boolean {
  // Check exact match
  if (keyScopes.includes(requiredScope)) {
    return true
  }
  
  // Check wildcard (e.g., "products:*" allows "products:read")
  const [resource] = requiredScope.split(':')
  if (keyScopes.includes(`${resource}:*`)) {
    return true
  }
  
  // Check full access
  if (keyScopes.includes('*')) {
    return true
  }
  
  return false
}

// ===========================================
// Main Auth Middleware
// ===========================================

/**
 * Authenticate API request
 * Use this in API v1 routes
 */
export async function authenticateApiRequest(
  request: NextRequest,
  requiredScope?: string
): Promise<{ auth: ApiKeyData } | NextResponse> {
  // Extract API key
  const apiKey = extractApiKey(request)
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API key. Use Authorization: Bearer wo_live_xxx or X-API-Key header.' },
      { status: 401 }
    )
  }
  
  // Validate API key
  const validation = await validateApiKey(apiKey)
  
  if (!validation.success || !validation.data) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.statusCode || 401 }
    )
  }
  
  // Check rate limit
  const rateLimit = checkRateLimit(validation.data.id)
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString()
        }
      }
    )
  }
  
  // Check scope if required
  if (requiredScope && !hasScope(validation.data.scopes, requiredScope)) {
    return NextResponse.json(
      { error: `Missing required scope: ${requiredScope}` },
      { status: 403 }
    )
  }
  
  // Return authenticated data
  return { auth: validation.data }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  keyId: string
): NextResponse {
  const rateLimit = checkRateLimit(keyId)
  
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetIn / 1000).toString())
  
  return response
}

// ===========================================
// Available Scopes
// ===========================================
export const AVAILABLE_SCOPES = [
  { id: 'products:read', name: 'Read Products', description: 'View products and inventory' },
  { id: 'products:write', name: 'Write Products', description: 'Create, update, delete products' },
  { id: 'orders:read', name: 'Read Orders', description: 'View orders and order history' },
  { id: 'categories:read', name: 'Read Categories', description: 'View categories' },
  { id: 'categories:write', name: 'Write Categories', description: 'Create, update, delete categories' },
] as const

export const DEFAULT_SCOPES = ['products:read', 'orders:read', 'categories:read']
