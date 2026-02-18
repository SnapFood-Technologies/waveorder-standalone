# Custom Domain Implementation - Final Refinements & Clarifications

> **STATUS: COMPLETED (Feb 2026)**
> - Domain schema (domainVerificationToken): DONE
> - Domain settings UI: DONE
> - Netlify API integration for adding domains: DONE
>
> Remaining items moved to `docs/REMAINING_TODOS.md`

## Critical Fixes Required

### 1. Database Schema Addition

**Problem:** Your plan mentions generating verification tokens, but the schema doesn't store them.

**Fix:** Add this field to your Prisma schema:

```prisma
model Business {
  // ... existing fields
  customDomain               String?
  domainStatus               DomainStatus @default(NONE)
  domainVerificationToken    String?
  subdomainEnabled           Boolean      @default(false)
}
```

Run: `npx prisma db push`

---

### 2. Prisma Client in Middleware

**Problem:** Your middleware code uses `await prisma.business.findFirst()` but doesn't import Prisma.

**Fix:** Add this to the top of `/src/middleware.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Create global instance to avoid multiple connections
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export async function middleware(request: NextRequest) {
  // ... rest of your middleware code
}
```

**Performance Enhancement (Optional):** Consider caching business lookups in Redis/Upstash to avoid database queries on every request:

```typescript
// With caching (recommended for production)
const cacheKey = `domain:${baseDomain}`
let business = await redis.get(cacheKey)

if (!business) {
  business = await prisma.business.findFirst({
    where: { customDomain: baseDomain, domainStatus: 'ACTIVE' }
  })
  await redis.setex(cacheKey, 300, JSON.stringify(business)) // 5 min cache
}
```

---

### 3. Netlify Scheduled Function Setup

**Problem:** The plan mentions a background job but doesn't show how to set it up in Netlify.

**Fix:** Create `/netlify/functions/check-ssl-status.ts`:

```typescript
import { schedule } from '@netlify/functions'
import { PrismaClient } from '@prisma/client'
import { checkNetlifySSLStatus } from '../../src/lib/netlify'
import { notifyDomainActive, notifyDomainFailed } from '../../src/lib/notifications/domain-notifications'

const prisma = new PrismaClient()

const handler = schedule('*/5 * * * *', async () => {
  console.log('Checking SSL status for pending domains...')
  
  const pendingDomains = await prisma.business.findMany({
    where: {
      domainStatus: 'PENDING',
      customDomain: { not: null }
    },
    select: {
      id: true,
      customDomain: true
    }
  })
  
  for (const business of pendingDomains) {
    if (!business.customDomain) continue
    
    try {
      const status = await checkNetlifySSLStatus(business.customDomain)
      
      if (status.sslStatus === 'issued' && status.verified) {
        await prisma.business.update({
          where: { id: business.id },
          data: { domainStatus: 'ACTIVE' }
        })
        
        await notifyDomainActive(business.id)
        console.log(`✓ Domain activated: ${business.customDomain}`)
        
      } else if (status.sslStatus === 'failed') {
        await prisma.business.update({
          where: { id: business.id },
          data: { domainStatus: 'FAILED' }
        })
        
        await notifyDomainFailed(business.id, 'SSL provisioning failed')
        console.log(`✗ Domain failed: ${business.customDomain}`)
      }
    } catch (error) {
      console.error(`Error checking ${business.customDomain}:`, error)
    }
  }
  
  await prisma.$disconnect()
  
  return {
    statusCode: 200,
    body: JSON.stringify({ checked: pendingDomains.length })
  }
})

export { handler }
```

**Update `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Install Required Package:**

```bash
npm install @netlify/functions
```

---

### 4. WWW Redirect Handling

**Problem:** Your plan doesn't handle www vs non-www redirects.

**Fix:** Add to `/src/lib/domain-validation.ts`:

```typescript
export function getCanonicalDomain(domain: string): string {
  // Remove www. prefix to get canonical domain
  return domain.replace(/^www\./, '')
}

export function needsWWWRedirect(requestedDomain: string, canonicalDomain: string): boolean {
  return requestedDomain !== canonicalDomain && requestedDomain === `www.${canonicalDomain}`
}
```

**Update middleware to handle redirects:**

```typescript
// In middleware.ts, after finding business
if (business) {
  const canonical = getCanonicalDomain(business.customDomain!)
  
  // Redirect www to non-www
  if (baseDomain === `www.${canonical}`) {
    const url = request.nextUrl.clone()
    url.host = canonical
    return NextResponse.redirect(url, 301)
  }
  
  // Continue with rewrite...
  const url = request.nextUrl.clone()
  url.pathname = `/${business.slug}${pathname}`
  return NextResponse.rewrite(url)
}
```

---

### 5. Environment Variable Validation

**Problem:** No validation to catch missing env vars early.

**Fix:** Create `/src/lib/env-validation.ts`:

```typescript
export function validateDomainEnvVars() {
  const required = [
    'NETLIFY_ACCESS_TOKEN',
    'NETLIFY_SITE_ID',
    'NEXT_PUBLIC_APP_DOMAIN'
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables for custom domains: ${missing.join(', ')}`
    )
  }
}
```

**Call this at the top of your domain API routes:**

```typescript
// In /api/admin/stores/[businessId]/domain/route.ts
import { validateDomainEnvVars } from '@/lib/env-validation'

export async function GET(request: NextRequest) {
  validateDomainEnvVars() // Will throw if misconfigured
  // ... rest of your code
}
```

---

### 6. Reusable DNS Instructions Component

**Problem:** Your UI component will have lots of repetitive DNS instruction code.

**Fix:** Create `/src/components/admin/domain/DNSInstructions.tsx`:

```typescript
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface DNSInstructionsProps {
  domain: string
  verificationToken: string
  netlifyDomain: string
}

export default function DNSInstructions({ 
  domain, 
  verificationToken, 
  netlifyDomain 
}: DNSInstructionsProps) {
  const [copiedTXT, setCopiedTXT] = useState(false)
  const [copiedCNAME, setCopiedCNAME] = useState(false)

  const copyToClipboard = (text: string, type: 'txt' | 'cname') => {
    navigator.clipboard.writeText(text)
    if (type === 'txt') {
      setCopiedTXT(true)
      setTimeout(() => setCopiedTXT(false), 2000)
    } else {
      setCopiedCNAME(true)
      setTimeout(() => setCopiedCNAME(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* TXT Record */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Step 1: Add TXT Record (Verification)
        </h3>
        <div className="bg-white rounded border border-gray-200 p-3 font-mono text-sm space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Type:</span> <strong>TXT</strong>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Name:</span>{' '}
              <strong>_waveorder-verification.{domain}</strong>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Value:</span>{' '}
              <strong className="break-all">{verificationToken}</strong>
            </div>
            <button
              onClick={() => copyToClipboard(verificationToken, 'txt')}
              className="ml-2 p-2 hover:bg-gray-100 rounded transition-colors"
              title="Copy to clipboard"
            >
              {copiedTXT ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CNAME Record */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h3 className="font-semibold text-teal-900 mb-2">
          Step 2: Add CNAME Record (Routing)
        </h3>
        <div className="bg-white rounded border border-gray-200 p-3 font-mono text-sm space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Type:</span> <strong>CNAME</strong>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Name:</span> <strong>{domain}</strong>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">Value:</span>{' '}
              <strong>{netlifyDomain}</strong>
            </div>
            <button
              onClick={() => copyToClipboard(netlifyDomain, 'cname')}
              className="ml-2 p-2 hover:bg-gray-100 rounded transition-colors"
              title="Copy to clipboard"
            >
              {copiedCNAME ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="text-sm text-gray-600">
        <p>
          <strong>Note:</strong> DNS changes can take 5 minutes to 48 hours to
          propagate. Most providers update within 15-30 minutes.
        </p>
      </div>
    </div>
  )
}
```

**Use in your main component:**

```typescript
import DNSInstructions from './DNSInstructions'

// Inside DomainManagement.tsx
{domainStatus === 'PENDING' && verificationToken && (
  <DNSInstructions
    domain={customDomain}
    verificationToken={verificationToken}
    netlifyDomain={`${process.env.NEXT_PUBLIC_NETLIFY_SITE_NAME}.netlify.app`}
  />
)}
```

---

### 7. Domain Status Indicator Component

**Problem:** Status display logic will be repeated in UI.

**Fix:** Create `/src/components/admin/domain/DomainStatusIndicator.tsx`:

```typescript
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'

interface DomainStatusIndicatorProps {
  status: 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED'
  sslStatus?: 'pending' | 'provisioning' | 'issued' | 'failed'
}

export default function DomainStatusIndicator({ 
  status, 
  sslStatus 
}: DomainStatusIndicatorProps) {
  if (status === 'ACTIVE') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Active</span>
      </div>
    )
  }

  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        <div>
          <span className="font-medium">Provisioning SSL...</span>
          {sslStatus && (
            <p className="text-xs text-gray-600 mt-0.5">Status: {sslStatus}</p>
          )}
        </div>
      </div>
    )
  }

  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="w-5 h-5" />
        <span className="font-medium">Setup Failed</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <Clock className="w-5 h-5" />
      <span className="font-medium">Not Configured</span>
    </div>
  )
}
```

---

### 8. Rate Limiting Implementation

**Problem:** Plan mentions rate limiting but doesn't show implementation.

**Fix:** Create `/src/lib/rate-limit.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

// Simple in-memory rate limiting (use Redis in production)
const verificationAttempts = new Map<string, number[]>()

export async function checkDomainVerificationLimit(
  businessId: string
): Promise<RateLimitResult> {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const maxAttempts = 5
  
  // Get existing attempts
  const attempts = verificationAttempts.get(businessId) || []
  
  // Filter to only recent attempts
  const recentAttempts = attempts.filter(time => time > oneHourAgo)
  
  // Update map
  verificationAttempts.set(businessId, recentAttempts)
  
  const allowed = recentAttempts.length < maxAttempts
  const resetAt = new Date(Math.min(...recentAttempts) + 60 * 60 * 1000)
  
  return {
    allowed,
    remaining: Math.max(0, maxAttempts - recentAttempts.length),
    resetAt
  }
}

export function recordVerificationAttempt(businessId: string): void {
  const attempts = verificationAttempts.get(businessId) || []
  attempts.push(Date.now())
  verificationAttempts.set(businessId, attempts)
}
```

**Use in your verify endpoint:**

```typescript
// In /api/admin/stores/[businessId]/domain/verify/route.ts
import { checkDomainVerificationLimit, recordVerificationAttempt } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const { businessId } = params
  
  // Check rate limit
  const rateLimit = await checkDomainVerificationLimit(businessId)
  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: 'TOO_MANY_ATTEMPTS',
      message: `Too many verification attempts. Try again after ${rateLimit.resetAt.toLocaleTimeString()}`,
      resetAt: rateLimit.resetAt
    }, { status: 429 })
  }
  
  // Record this attempt
  recordVerificationAttempt(businessId)
  
  // ... rest of verification logic
}
```

---

### 9. Additional Environment Variables

**Add to `.env.example`:**

```env
# Existing variables
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Custom Domain Configuration (ADD THESE)
NETLIFY_ACCESS_TOKEN=nfp_xxxxxxxxxxxxx
NETLIFY_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_APP_DOMAIN=waveorder.app
NEXT_PUBLIC_NETLIFY_SITE_NAME=your-site

# Optional: Redis for caching (recommended for production)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
```

---

### 10. Package.json Script Additions

**Add these helpful scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "migrate:domains": "tsx scripts/migrate-existing-domains.ts",
    "test:domain": "tsx scripts/test-domain-verification.ts"
  },
  "dependencies": {
    "@netlify/functions": "^2.0.0"
  }
}
```

---

## Summary of Changes to Original Plan

1. **Added:** `domainVerificationToken` field to database schema
2. **Fixed:** Prisma client import in middleware
3. **Added:** Netlify scheduled function setup (complete code)
4. **Added:** WWW redirect handling logic
5. **Added:** Environment variable validation
6. **Added:** Reusable DNS instructions component
7. **Added:** Domain status indicator component
8. **Added:** Rate limiting implementation
9. **Clarified:** Additional environment variables needed
10. **Added:** Helpful npm scripts

## Files Added Beyond Original Plan

- `/src/lib/env-validation.ts` (30 lines)
- `/src/lib/rate-limit.ts` (50 lines)
- `/src/components/admin/domain/DNSInstructions.tsx` (120 lines)
- `/src/components/admin/domain/DomainStatusIndicator.tsx` (60 lines)
- `/netlify/functions/check-ssl-status.ts` (60 lines)

**Total Additional Code:** ~320 lines across 5 files

These are essential refinements that make the original plan functional and production-ready.