/**
 * Domain Validation Utilities
 * 
 * Validates and sanitizes custom domain inputs for WaveOrder storefronts.
 */

import { prisma } from '@/lib/prisma'

// System domains that cannot be used as custom domains
const SYSTEM_DOMAINS = [
  'waveorder.app',
  'www.waveorder.app',
  'api.waveorder.app',
  'admin.waveorder.app',
  'app.waveorder.app',
  'localhost',
  'vercel.app',
  'netlify.app',
  'herokuapp.com',
  'azurewebsites.net'
]

// Blocked TLDs that should not be allowed
const BLOCKED_TLDS = [
  '.local',
  '.internal',
  '.localhost',
  '.test',
  '.example',
  '.invalid'
]

// Maximum domain length per DNS specification
const MAX_DOMAIN_LENGTH = 253

// Valid domain format regex (supports subdomains)
const DOMAIN_REGEX = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/

/**
 * Normalize a domain string by removing protocol, www, trailing slashes, and port
 * @param domain - Raw domain input
 * @returns Normalized domain string
 */
export function normalizeDomain(domain: string): string {
  if (!domain) return ''
  
  let normalized = domain.toLowerCase().trim()
  
  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '')
  
  // Remove trailing slashes and paths
  normalized = normalized.split('/')[0]
  
  // Remove port number
  normalized = normalized.split(':')[0]
  
  // Remove www prefix (we'll handle www separately)
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4)
  }
  
  return normalized
}

/**
 * Validate domain format
 * @param domain - Domain to validate (should be normalized first)
 * @returns Object with isValid flag and optional error message
 */
export function validateDomainFormat(domain: string): { isValid: boolean; error?: string } {
  if (!domain) {
    return { isValid: false, error: 'Domain is required' }
  }
  
  // Check length
  if (domain.length > MAX_DOMAIN_LENGTH) {
    return { isValid: false, error: `Domain exceeds maximum length of ${MAX_DOMAIN_LENGTH} characters` }
  }
  
  // Check for IP address (not allowed)
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipRegex.test(domain)) {
    return { isValid: false, error: 'IP addresses are not allowed. Please use a domain name.' }
  }
  
  // Check for blocked TLDs
  const hasBlockedTld = BLOCKED_TLDS.some(tld => domain.endsWith(tld))
  if (hasBlockedTld) {
    return { isValid: false, error: 'This domain extension is not allowed' }
  }
  
  // Check against system domains
  const isSystemDomain = SYSTEM_DOMAINS.some(sys => 
    domain === sys || domain.endsWith(`.${sys}`)
  )
  if (isSystemDomain) {
    return { isValid: false, error: 'System domains cannot be used as custom domains' }
  }
  
  // Validate format
  if (!DOMAIN_REGEX.test(domain)) {
    return { isValid: false, error: 'Invalid domain format. Example: shop.example.com' }
  }
  
  return { isValid: true }
}

/**
 * Check if a domain is available (not used by another business)
 * @param domain - Domain to check
 * @param excludeBusinessId - Business ID to exclude from check (for updates)
 * @returns Object with isAvailable flag and optional error message
 */
export async function isDomainAvailable(
  domain: string, 
  excludeBusinessId?: string
): Promise<{ isAvailable: boolean; error?: string }> {
  const normalizedDomain = normalizeDomain(domain)
  
  // First validate format
  const formatValidation = validateDomainFormat(normalizedDomain)
  if (!formatValidation.isValid) {
    return { isAvailable: false, error: formatValidation.error }
  }
  
  // Check if domain is already in use
  const existingBusiness = await prisma.business.findFirst({
    where: {
      customDomain: normalizedDomain,
      ...(excludeBusinessId ? { id: { not: excludeBusinessId } } : {})
    },
    select: { id: true, name: true }
  })
  
  if (existingBusiness) {
    return { 
      isAvailable: false, 
      error: 'This domain is already connected to another store' 
    }
  }
  
  return { isAvailable: true }
}

/**
 * Complete domain validation including format and availability
 * @param domain - Raw domain input
 * @param excludeBusinessId - Business ID to exclude from availability check
 * @returns Validation result with normalized domain if valid
 */
export async function validateDomain(
  domain: string,
  excludeBusinessId?: string
): Promise<{ 
  isValid: boolean
  normalizedDomain?: string
  error?: string 
}> {
  const normalizedDomain = normalizeDomain(domain)
  
  // Validate format
  const formatResult = validateDomainFormat(normalizedDomain)
  if (!formatResult.isValid) {
    return { isValid: false, error: formatResult.error }
  }
  
  // Check availability
  const availabilityResult = await isDomainAvailable(normalizedDomain, excludeBusinessId)
  if (!availabilityResult.isAvailable) {
    return { isValid: false, error: availabilityResult.error }
  }
  
  return { isValid: true, normalizedDomain }
}

/**
 * Generate a unique verification token for domain ownership
 * @returns Verification token string
 */
export function generateVerificationToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15)
  return `waveorder-verify-${randomPart}`
}

/**
 * Get the verification record name for a domain
 * @param domain - The custom domain
 * @returns TXT record name for verification
 */
export function getVerificationRecordName(domain: string): string {
  return `_waveorder-verification.${domain}`
}
