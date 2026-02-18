# Custom Domain Implementation Plan

> **STATUS: COMPLETED (Feb 2026)**
> - Custom domain schema fields: DONE
> - Domain settings admin UI: DONE
> - Netlify API for adding/removing domains: DONE
> - DNS verification flow: DONE
>
> Remaining items moved to `docs/REMAINING_TODOS.md`

## Overview

Add custom domain support for businesses on PRO plan. Businesses configure DNS manually (CNAME), verify ownership via TXT record, domains are automatically added to Netlify via API, and SSL is auto-provisioned. Middleware detects custom domains and routes to correct storefront.

## Implementation Steps

### 1. Database Schema (Already Complete)

The `Business` model in `prisma/schema.prisma` already has:

- `customDomain` (String?) - stores the custom domain
- `domainStatus` (DomainStatus) - NONE, PENDING, ACTIVE, FAILED
- `subdomainEnabled` (Boolean) - future subdomain feature flag

### 2. Domain Validation & Utilities

#### Create `/src/lib/domain-validation.ts` (~100 lines)

Domain validation and sanitization utilities:

- `isValidDomain(domain)` - validates format, checks against system domains
- `normalizeDomain(domain)` - strips protocol, www, trailing slashes
- `isDomainAvailable(domain, businessId)` - checks uniqueness in database
- System domains blacklist: `waveorder.app`, `netlify.app`, `localhost`, `vercel.app`
- Blocked TLDs: `.local`, `.internal`, `.localhost`
- Length validation (max 253 chars)
- Regex validation for valid domain format

#### Create `/src/lib/domain-verification.ts` (~250 lines)

DNS verification utilities using Node.js native `dns.promises`:

- `generateVerificationToken()` - creates unique token like `waveorder-verify-abc123xyz`
- `verifyTXTRecord(domain, expectedToken)` - checks `_waveorder-verification.{domain}`
- `verifyCNAMERecord(domain, expectedTarget)` - checks CNAME points to Netlify
- `checkDNSPropagation(domain)` - returns propagation status
- Error handling for DNS lookup failures
- Timeout handling (5s max per lookup)

### 3. Netlify API Integration

#### Create `/src/lib/netlify.ts` (~150 lines)

**Critical automation component** - eliminates manual Netlify Dashboard work:

```typescript
const NETLIFY_API = 'https://api.netlify.com/api/v1'
const NETLIFY_TOKEN = process.env.NETLIFY_ACCESS_TOKEN
const SITE_ID = process.env.NETLIFY_SITE_ID

// Add domain to Netlify programmatically
async function addDomainToNetlify(domain: string)

// Remove domain from Netlify
async function removeDomainFromNetlify(domain: string)

// Check SSL certificate provisioning status
async function checkNetlifySSLStatus(domain: string)
// Returns: { sslStatus: 'pending'|'provisioning'|'issued', verified: boolean }

// List all domains on site
async function listNetlifyDomains()
```

**Environment Variables Required:**

```
NETLIFY_ACCESS_TOKEN=your_personal_access_token
NETLIFY_SITE_ID=your_site_id
NEXT_PUBLIC_APP_DOMAIN=waveorder.app
```

### 4. Backend API Routes

#### Create `/src/app/api/admin/stores/[businessId]/domain/route.ts` (~180 lines)

**GET** - Fetch current domain configuration:

```typescript
{
  customDomain: string | null,
  domainStatus: 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED',
  verificationToken: string | null,
  sslStatus: string | null,
  netlifyDomain: string // e.g., "your-site.netlify.app"
}
```

**POST** - Add/update custom domain:

1. Validate subscription is PRO
2. Normalize and validate domain format
3. Check domain availability (not used by other business)
4. Generate verification token
5. Save to DB with status PENDING
6. Return verification instructions

**DELETE** - Remove custom domain:

1. Remove from Netlify via API
2. Update DB: set `customDomain = null`, `domainStatus = NONE`
3. Clear verification token

**Error Messages:**

- `INVALID_FORMAT`: Invalid domain format
- `DOMAIN_IN_USE`: Already connected to another store
- `SYSTEM_DOMAIN`: Cannot use system domains
- `NOT_PRO_PLAN`: Upgrade required
- `NETLIFY_ERROR`: Failed to configure on Netlify

#### Create `/src/app/api/admin/stores/[businessId]/domain/verify/route.ts` (~120 lines)

**POST** - Manual verification trigger:

1. Check subscription is PRO
2. Verify TXT record: `_waveorder-verification.{domain}` contains token
3. Verify CNAME record: `{domain}` points to Netlify domain
4. If both pass:

   - Call `addDomainToNetlify(domain)` via Netlify API
   - Update `domainStatus` to PENDING (waiting for SSL)
   - Return success with SSL provisioning message

5. If failed:

   - Return specific error (TXT_RECORD_MISSING, CNAME_INCORRECT, etc.)
   - Keep status as PENDING

6. Background job will change to ACTIVE once SSL is issued

**Specific Error Responses:**

- `DNS_NOT_CONFIGURED`: No DNS records found
- `TXT_RECORD_MISSING`: Verification record not found
- `CNAME_INCORRECT`: CNAME not pointing to Netlify
- `SSL_PROVISIONING`: Domain added, waiting for SSL (not an error)

#### Create `/src/app/api/admin/stores/[businessId]/domain/status/route.ts` (~80 lines)

**GET** - Real-time domain status:

1. Fetch business domain config
2. If domain exists, check Netlify SSL status via API
3. Return comprehensive status:
```typescript
{
  domain: string,
  status: 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED',
  dnsConfigured: boolean,
  txtRecordValid: boolean,
  cnameRecordValid: boolean,
  sslStatus: 'pending' | 'provisioning' | 'issued' | 'failed',
  lastChecked: timestamp
}
```


### 5. Background Jobs for SSL Monitoring

#### Create `/src/lib/jobs/check-ssl-status.ts` (~100 lines)

Background job to monitor SSL provisioning (Netlify can take 5-60 minutes):

- Query businesses with `domainStatus = PENDING`
- For each, call `checkNetlifySSLStatus(domain)`
- If SSL status is `issued` and DNS verified → update to ACTIVE
- If SSL status is `failed` → update to FAILED
- Send email notification on status change
- Run every 5 minutes via cron or Netlify scheduled function

Can be implemented as:

- Netlify Scheduled Function (recommended)
- External cron service (EasyCron, cron-job.org)
- Self-hosted cron if on VPS

### 6. Notification System

#### Create `/src/lib/notifications/domain-notifications.ts` (~80 lines)

Email notifications for domain events:

- `notifyDomainActive(businessId)` - domain successfully activated
- `notifyDomainFailed(businessId, reason)` - verification/SSL failed
- `notifyDomainRemoved(businessId)` - domain disconnected

Uses existing email service (`/src/lib/email.ts`) with templates:

- **Subject:** "✓ Your custom domain is now active"
- **Subject:** "⚠️ Custom domain setup failed"

### 7. Middleware Enhancement

Update `/src/middleware.ts` (~40 lines added):

**Enhanced logic for custom domain detection:**

```typescript
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl
  
  // Extract base domain (remove port for local dev)
  const baseDomain = hostname.split(':')[0]
  
  // Skip admin routes, API routes, and static files
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // Check if this is the main app domain
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost'
  
  if (baseDomain === appDomain || baseDomain === 'localhost') {
    return NextResponse.next() // Regular slug routing
  }
  
  // Custom domain - lookup business
  const business = await prisma.business.findFirst({
    where: {
      customDomain: baseDomain,
      domainStatus: 'ACTIVE'
    },
    select: { id: true, slug: true }
  })
  
  if (business) {
    // Rewrite to storefront
    const url = request.nextUrl.clone()
    url.pathname = `/${business.slug}${pathname}`
    return NextResponse.rewrite(url)
  }
  
  return new NextResponse('Domain not configured', { status: 404 })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

**Performance considerations:**

- Cache business lookups (Redis or in-memory for 5 min)
- Index `customDomain` field in MongoDB for fast lookups

### 8. Admin UI - Domain Management

#### Create `/src/app/admin/stores/[businessId]/domains/page.tsx` (~15 lines)

Server component wrapper that renders client component.

#### Create `/src/components/admin/domain/DomainManagement.tsx` (~500 lines)

Comprehensive UI with 5 sections:

**1. Subscription Gate (if FREE plan):**

- Locked icon with upgrade prompt
- "Custom domains are available on PRO plan"
- Link to billing page

**2. Domain Setup Section:**

- Input field for domain entry
- Real-time validation feedback
- "Save Domain" button
- Shows normalized domain preview

**3. Verification Instructions Section (after saving):**

- Step-by-step DNS configuration guide
- Copy-to-clipboard for verification token
- Two DNS records needed:
  ```
  Type: TXT
  Name: _waveorder-verification.yourdomain.com
  Value: waveorder-verify-{token}
  
  Type: CNAME  
  Name: yourdomain.com (or www)
  Value: your-site.netlify.app
  ```

- "Verify DNS" button with loading states
- Visual checklist: TXT ✓, CNAME ✓, SSL (pending)

**4. Active Domain Section:**

- Green checkmark with "Domain Active"
- SSL certificate status indicator
- "Visit Store" button → opens custom domain
- "Remove Domain" button with confirmation modal
- Last verified timestamp

**5. Troubleshooting Section:**

- Collapsible panel with common issues
- DNS propagation checker (external link)
- Link to documentation
- Support contact info

**Real-time Status Updates:**

- Poll `/api/admin/stores/[businessId]/domain/status` every 30s when PENDING
- Show progress: DNS → SSL Provisioning → Active
- Toast notifications for status changes

### 9. Storefront Updates for Custom Domains

#### Update `/src/app/(site)/[slug]/page.tsx` (~10 lines)

In `generateMetadata()`:

```typescript
// Fetch business to check for custom domain
const business = await prisma.business.findUnique({
  where: { slug },
  select: { customDomain: true, domainStatus: true }
})

// Use custom domain in canonical URL if active
const canonicalUrl = business?.domainStatus === 'ACTIVE' && business.customDomain
  ? `https://${business.customDomain}`
  : `https://waveorder.app/${slug}`
```

Update structured data, Open Graph URLs, Twitter cards to use custom domain when active.

#### Update `/src/app/api/storefront/[slug]/route.ts` (~15 lines)

Support lookup by custom domain (for middleware rewrite):

```typescript
const business = await prisma.business.findFirst({
  where: {
    OR: [
      { slug },
      { customDomain: slug, domainStatus: 'ACTIVE' } // Support middleware rewrites
    ]
  }
})
```

### 10. Netlify Configuration

#### Create `netlify.toml` at project root

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

**Netlify Setup Steps (one-time):**

1. Generate Personal Access Token in Netlify → User Settings → Applications
2. Add to environment variables
3. Domains will be added programmatically via API

### 11. Admin Sidebar Update

`/src/components/admin/layout/AdminSidebar.tsx` - Already has navigation item:

- Lines 181-185: "Domain Management" with Globe icon
- Only visible for PRO plan users
- No changes needed ✓

### 12. Security & Validation

**Rate Limiting:**

- Max 5 verification attempts per hour per business
- Max 3 domain changes per day per business

**Domain Validation Checks:**

- Valid domain format (regex)
- Not a system domain
- Not already in use
- Not on blocklist
- Length ≤ 253 chars
- No IP addresses allowed

**Security Headers:**

- CORS properly configured
- CSRF protection on domain endpoints
- Authentication required (PRO plan verified)

### 13. Migration & Utilities

#### Create `/scripts/migrate-existing-domains.ts` (~50 lines)

Reset any domains in bad state:

```typescript
// Reset PENDING/FAILED domains older than 48 hours
await prisma.business.updateMany({
  where: {
    domainStatus: { in: ['PENDING', 'FAILED'] },
    updatedAt: { lt: twoDaysAgo }
  },
  data: {
    domainStatus: 'NONE',
    customDomain: null
  }
})
```

Run before deployment or as maintenance script.

### 14. Documentation

#### Create `/docs/custom-domain-setup.md`

Complete user guide with:

- Prerequisites (PRO plan, domain ownership)
- Step-by-step setup instructions
- Screenshots for popular DNS providers:
  - Cloudflare
  - Namecheap
  - GoDaddy
  - Google Domains
- DNS propagation timeline (5 min - 48 hours)
- SSL provisioning timeline (5-60 min)
- Troubleshooting section
- FAQ (apex vs www, multiple domains, etc.)

## Key Files Summary

**New Files (12 total):**

- `/src/lib/domain-validation.ts` (100 lines)
- `/src/lib/domain-verification.ts` (250 lines)
- `/src/lib/netlify.ts` (150 lines) **← Critical for automation**
- `/src/lib/notifications/domain-notifications.ts` (80 lines)
- `/src/lib/jobs/check-ssl-status.ts` (100 lines)
- `/src/app/api/admin/stores/[businessId]/domain/route.ts` (180 lines)
- `/src/app/api/admin/stores/[businessId]/domain/verify/route.ts` (120 lines)
- `/src/app/api/admin/stores/[businessId]/domain/status/route.ts` (80 lines)
- `/src/app/admin/stores/[businessId]/domains/page.tsx` (15 lines)
- `/src/components/admin/domain/DomainManagement.tsx` (500 lines)
- `/scripts/migrate-existing-domains.ts` (50 lines)
- `netlify.toml` (30 lines)
- `/docs/custom-domain-setup.md` (documentation)

**Modified Files (4 total):**

- `/src/middleware.ts` (+40 lines) - Custom domain routing
- `/src/app/(site)/[slug]/page.tsx` (+10 lines) - Canonical URLs
- `/src/app/api/storefront/[slug]/route.ts` (+15 lines) - Domain lookup
- `package.json` - No new dependencies needed (using native `dns.promises`)

**Environment Variables:**

```env
NETLIFY_ACCESS_TOKEN=nfp_xxxxxxxxxxxxx
NETLIFY_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_APP_DOMAIN=waveorder.app
```

## Technical Flow (Detailed)

1. **Business owner (PRO plan)** navigates to Domain Management
2. **Enters custom domain** → `store.example.com`
3. **Frontend validates** format and availability
4. **POST /api/.../domain** → Saves domain, generates token, status = PENDING
5. **UI displays** DNS instructions with verification token
6. **Business owner** adds DNS records at their provider:

   - TXT: `_waveorder-verification.store.example.com` = `waveorder-verify-abc123`
   - CNAME: `store.example.com` = `your-site.netlify.app`

7. **Business owner** clicks "Verify DNS"
8. **POST /api/.../domain/verify**:

   - Checks TXT record (DNS lookup)
   - Checks CNAME record (DNS lookup)
   - If valid → calls Netlify API to add domain
   - Netlify begins SSL provisioning

9. **Background job** (every 5 min) checks SSL status via Netlify API
10. **When SSL issued** → Updates status to ACTIVE, sends email notification
11. **Customer visits** `store.example.com`
12. **Middleware** detects custom domain, rewrites to `/{slug}` internally
13. **Storefront renders** with custom domain in metadata/canonical URLs

## Testing Checklist

**Domain Configuration:**

- [ ] Apex domain (example.com) setup
- [ ] Subdomain (store.example.com) setup
- [ ] www vs non-www handling
- [ ] Domain normalization (strip protocols, trailing slashes)

**Validation & Security:**

- [ ] Prevent duplicate domains across businesses
- [ ] Prevent system domains (waveorder.app, netlify.app)
- [ ] Invalid domain format rejected
- [ ] Rate limiting on verification attempts
- [ ] PRO plan requirement enforced

**DNS & SSL:**

- [ ] TXT record verification success
- [ ] TXT record missing (graceful error)
- [ ] CNAME record verification success
- [ ] CNAME record missing/incorrect (graceful error)
- [ ] DNS propagation delay handling
- [ ] SSL provisioning status tracking
- [ ] SSL certificate activation
- [ ] SSL provisioning failure handling

**Netlify API:**

- [ ] Domain added to Netlify successfully
- [ ] Domain removed from Netlify successfully
- [ ] SSL status checked correctly
- [ ] API rate limiting handled
- [ ] API errors handled gracefully

**Routing & Performance:**

- [ ] Middleware routes custom domain to correct storefront
- [ ] Storefront still works on slug-based URL
- [ ] Middleware performance (< 50ms overhead)
- [ ] Multiple concurrent requests to custom domain
- [ ] 404 for inactive/unconfigured custom domains

**SEO & Metadata:**

- [ ] Canonical URL uses custom domain when active
- [ ] Open Graph URLs use custom domain
- [ ] Structured data uses custom domain
- [ ] Sitemap includes custom domain URL
- [ ] robots.txt accessible on custom domain

**UI/UX:**

- [ ] FREE plan shows upgrade prompt
- [ ] PRO plan can access domain settings
- [ ] Real-time status updates work
- [ ] Copy-to-clipboard for verification token
- [ ] Success notifications displayed
- [ ] Error messages are clear and actionable
- [ ] Domain removal confirmation modal
- [ ] Email notifications sent correctly

**Edge Cases:**

- [ ] Domain removal while SSL provisioning
- [ ] Changing domain while one is active
- [ ] Multiple domains trying same domain (race condition)
- [ ] Very long domain names (max 253 chars)
- [ ] Unicode/IDN domains
- [ ] Subdomain depth (test.store.example.com)