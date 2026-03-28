import { describe, it, expect } from 'vitest'
import { LOG_TYPES_SKIP_BOT_PRIVATE_IP_FILTER } from '@/lib/systemLog'

describe('LOG_TYPES_SKIP_BOT_PRIVATE_IP_FILTER', () => {
  it('includes client metric log types that must bypass bot / private-IP filters', () => {
    expect(LOG_TYPES_SKIP_BOT_PRIVATE_IP_FILTER).toContain('storefront_order_whatsapp_redirect')
    expect(LOG_TYPES_SKIP_BOT_PRIVATE_IP_FILTER).toContain('website_embed_copy')
    expect(LOG_TYPES_SKIP_BOT_PRIVATE_IP_FILTER.length).toBe(2)
  })
})
