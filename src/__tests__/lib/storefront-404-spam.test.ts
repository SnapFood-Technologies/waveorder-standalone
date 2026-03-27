import { describe, it, expect } from 'vitest'
import { isSpamSlug, SPAM_PROBE_EXACT_SLUGS } from '@/lib/storefront-404-spam'

describe('isSpamSlug', () => {
  it('treats reported scanner slugs as spam', () => {
    for (const slug of [
      'laravel',
      'nginx_status',
      'node_info',
      'php',
      'src',
      'backend',
      'maintenance.flag',
      '/.git/config',
      'aws-codecommit',
      'balancer-manager',
      'aWs-cOdEcOmMiT',
    ]) {
      expect(isSpamSlug(slug), slug).toBe(true)
    }
  })

  it('does not flag normal store slugs', () => {
    expect(isSpamSlug('naia-studio')).toBe(false)
    expect(isSpamSlug('swarovski')).toBe(false)
    expect(isSpamSlug('my-coffee-shop')).toBe(false)
  })

  it('exports probe list for documentation', () => {
    expect(SPAM_PROBE_EXACT_SLUGS.length).toBeGreaterThan(10)
    expect(SPAM_PROBE_EXACT_SLUGS).toContain('laravel')
  })
})
