/**
 * Pre-built flow templates for WaveOrder Flows
 * Client-safe (no server deps)
 */

interface TemplateStep {
  type: string
  body?: string
  mediaUrl?: string
  url?: string
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  message?: string
}

export interface FlowTemplate {
  id: string
  name: string
  type: 'welcome' | 'away' | 'keyword' | 'button_reply'
  trigger: {
    type: 'first_message' | 'keyword' | 'button_click' | 'any_message'
    keywords?: string[]
    buttonPayload?: string
    businessHoursOnly?: boolean
    outsideHoursOnly?: boolean
  }
  steps: TemplateStep[]
}

export function getFlowTemplates(storeUrl: string, businessName: string): FlowTemplate[] {
  return [
    {
      id: 'welcome',
      name: 'Welcome',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nBrowse our catalog and place your order easily.` },
        { type: 'send_url', body: 'Order now:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! Thanks for your message. We're currently closed. Our hours are 09:00–22:00 (local time). We'll reply as soon as we're back!" }
      ]
    },
    {
      id: 'faq-menu',
      name: 'FAQ - Menu / Catalog',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['menu', 'catalog', 'menuu', 'price', 'prices'] },
      steps: [
        { type: 'send_text', body: `Here's our catalog. Browse and order anytime!` },
        { type: 'send_url', body: 'View menu:', url: storeUrl }
      ]
    },
    {
      id: 'order-redirect',
      name: 'Order Redirect',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [
        { type: 'send_url', body: 'Order now:', url: storeUrl }
      ]
    },
    {
      id: 'location',
      name: 'Location Reply',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'directions'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    }
  ]
}
