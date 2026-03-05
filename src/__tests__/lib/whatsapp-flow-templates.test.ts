import { describe, it, expect } from 'vitest'
import { getFlowTemplates } from '@/lib/whatsapp-flow-templates'

describe('getFlowTemplates', () => {
  it('returns templates with storeUrl and businessName interpolated', () => {
    const templates = getFlowTemplates('https://example.com/mystore', 'Test Cafe')
    expect(templates.length).toBeGreaterThan(0)

    const welcome = templates.find((t) => t.id === 'welcome')
    expect(welcome).toBeDefined()
    expect(welcome?.steps.some((s) => s.body?.includes('Test Cafe'))).toBe(true)
    expect(welcome?.steps.some((s) => s.url?.includes('https://example.com/mystore'))).toBe(true)
  })

  it('includes FAQ menu template with keywords', () => {
    const templates = getFlowTemplates('', 'Biz')
    const faq = templates.find((t) => t.id === 'faq-menu')
    expect(faq).toBeDefined()
    expect(faq?.trigger.type).toBe('keyword')
    expect(Array.isArray(faq?.trigger.keywords)).toBe(true)
  })
})
