/**
 * Pre-built flow templates for WaveOrder Flows
 * Business-type-specific templates for Restaurant, Retail, Salon, Services, etc.
 * Client-safe (no server deps)
 */

import type { BusinessTypeKey } from './whatsapp-flows-use-cases'

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
  description: string
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

/** Templates by business type. Keys match BusinessTypeKey. */
const TEMPLATES_BY_TYPE: Record<BusinessTypeKey, (storeUrl: string, businessName: string) => FlowTemplate[]> = {
  RESTAURANT: (storeUrl, businessName) => [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Auto-send a welcome message with your menu link when customers first message.',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nBrowse our menu and place your order easily.` },
        { type: 'send_url', body: 'View menu & order:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      description: 'Reply when closed with opening hours and a link to order for later.',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! Thanks for your message. We're currently closed. Our hours are 09:00–22:00 (local time). We'll reply as soon as we're back!" }
      ]
    },
    {
      id: 'faq-menu',
      name: 'FAQ - Menu',
      description: 'Trigger on keywords like menu, delivery, hours. Sends your menu link instantly.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['menu', 'menuu', 'delivery', 'hours', 'price', 'prices'] },
      steps: [
        { type: 'send_text', body: `Here's our menu. Browse and order anytime!` },
        { type: 'send_url', body: 'View menu:', url: storeUrl }
      ]
    },
    {
      id: 'order-redirect',
      name: 'Order Redirect',
      description: 'When a customer clicks your order button, send them straight to your ordering page.',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [{ type: 'send_url', body: 'Order now:', url: storeUrl }]
    },
    {
      id: 'location',
      name: 'Location Reply',
      description: 'Reply with your address when customers ask for location or directions.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'directions'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    },
    {
      id: 'daily-specials',
      name: 'Daily Specials',
      description: 'Share today\'s specials when customers ask "what\'s new" or "specials".',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['specials', 'what\'s new', 'today'] },
      steps: [
        { type: 'send_text', body: "Check out today's specials! Update this message with your daily offers." },
        { type: 'send_url', body: 'Order now:', url: storeUrl }
      ]
    }
  ],
  CAFE: (storeUrl, businessName) => [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Greet customers and send your order link instantly. Perfect for grab-and-go.',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nOrder your coffee and treats easily.` },
        { type: 'send_url', body: 'Order now:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      description: 'Reply when closed with opening hours and a link to pre-order for pickup.',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! We're closed right now. Our hours are 07:00–18:00. Pre-order for pickup when we open!" }
      ]
    },
    {
      id: 'faq-menu',
      name: 'FAQ - Menu / Coffee',
      description: 'Keywords like menu, coffee, hours trigger instant automated replies.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['menu', 'coffee', 'hours', 'price', 'prices'] },
      steps: [
        { type: 'send_text', body: `Here's our menu. Order anytime!` },
        { type: 'send_url', body: 'View menu:', url: storeUrl }
      ]
    },
    {
      id: 'order-redirect',
      name: 'Order Redirect',
      description: 'Send customers to your order page when they click the order button.',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [{ type: 'send_url', body: 'Order now:', url: storeUrl }]
    },
    {
      id: 'location',
      name: 'Location Reply',
      description: 'Share your address when customers ask where you are.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'directions'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    },
    {
      id: 'promotions',
      name: 'Promotions',
      description: 'Share promotions or loyalty info when customers ask about offers.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['promo', 'promotion', 'offer', 'loyalty', 'discount'] },
      steps: [
        { type: 'send_text', body: "Here are our current offers! Update with your promotions." },
        { type: 'send_url', body: 'Order now:', url: storeUrl }
      ]
    }
  ],
  RETAIL: (storeUrl, businessName) => [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Send a welcome message with your store link when customers first contact you.',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nBrowse our catalog and shop easily.` },
        { type: 'send_url', body: 'Shop now:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      description: 'Reply when closed with opening hours and a link to browse.',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! We're closed. Our hours are 10:00–20:00. Browse our catalog and we'll reply when we're back!" }
      ]
    },
    {
      id: 'faq-catalog',
      name: 'FAQ - Catalog',
      description: 'Keywords like catalog, delivery, prices trigger instant responses.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['catalog', 'catalogue', 'products', 'delivery', 'prices', 'price'] },
      steps: [
        { type: 'send_text', body: `Here's our catalog. Browse and order anytime!` },
        { type: 'send_url', body: 'View catalog:', url: storeUrl }
      ]
    },
    {
      id: 'order-redirect',
      name: 'Order Redirect',
      description: 'Send customers to your store when they click the order button.',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [{ type: 'send_url', body: 'Shop now:', url: storeUrl }]
    },
    {
      id: 'location',
      name: 'Location Reply',
      description: 'Share your store address when customers ask for location.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'directions'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    },
    {
      id: 'new-arrivals',
      name: 'New Arrivals',
      description: 'Highlight new products or sales when customers ask.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['new', 'arrivals', 'sale', 'sales', 'discount'] },
      steps: [
        { type: 'send_text', body: "Check out our latest arrivals and deals!" },
        { type: 'send_url', body: 'Shop now:', url: storeUrl }
      ]
    }
  ],
  GROCERY: (storeUrl, businessName) => [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Greet customers and send your order link. Ideal for weekly shopping.',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nOrder your groceries for delivery or pickup.` },
        { type: 'send_url', body: 'Order now:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      description: 'Reply when closed with delivery hours and a link to place orders.',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! We're closed. Our delivery hours are 08:00–20:00. Place your order for next delivery!" }
      ]
    },
    {
      id: 'faq-order',
      name: 'FAQ - Order & Delivery',
      description: 'Keywords like order, delivery, minimum trigger instant answers.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['order', 'delivery', 'minimum', 'hours', 'price'] },
      steps: [
        { type: 'send_text', body: `Here's how to order. Browse and place your order anytime!` },
        { type: 'send_url', body: 'Order now:', url: storeUrl }
      ]
    },
    {
      id: 'order-redirect',
      name: 'Order Redirect',
      description: 'Send customers to your order page when they click the order button.',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [{ type: 'send_url', body: 'Order now:', url: storeUrl }]
    },
    {
      id: 'location',
      name: 'Location Reply',
      description: 'Share your address or delivery zones when customers ask.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'delivery area', 'zone'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    }
  ],
  SALON: (storeUrl, businessName) => [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Send a welcome message with your booking link when clients first message.',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nBook your appointment easily online.` },
        { type: 'send_url', body: 'Book now:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      description: 'Reply when closed with opening hours and a link to book online.',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! We're closed. Our hours are 09:00–19:00. Book online and we'll confirm when we're back!" }
      ]
    },
    {
      id: 'faq-book',
      name: 'FAQ - Book & Services',
      description: 'Keywords like book, appointment, services, prices trigger instant replies.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['book', 'booking', 'appointment', 'services', 'prices', 'price'] },
      steps: [
        { type: 'send_text', body: `Here are our services. Book your appointment anytime!` },
        { type: 'send_url', body: 'Book now:', url: storeUrl }
      ]
    },
    {
      id: 'booking-redirect',
      name: 'Booking Redirect',
      description: 'Send clients to your booking page when they click the book button.',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [{ type: 'send_url', body: 'Book now:', url: storeUrl }]
    },
    {
      id: 'location',
      name: 'Location Reply',
      description: 'Share your salon address when clients ask for directions.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'directions'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    },
    {
      id: 'service-info',
      name: 'Service Info',
      description: 'Share service menus, pricing, or special offers when clients ask.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['services', 'treatment', 'offer', 'special'] },
      steps: [
        { type: 'send_text', body: "Here's our service menu. Update with your offerings." },
        { type: 'send_url', body: 'Book now:', url: storeUrl }
      ]
    }
  ],
  SERVICES: (storeUrl, businessName) => [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Greet potential clients and send your request/quote form link.',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nSubmit a request or get a quote easily.` },
        { type: 'send_url', body: 'Get a quote:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      description: 'Reply when unavailable with your response time and a link to submit a request.',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! We're unavailable right now. Submit your request and we'll respond within 24 hours." }
      ]
    },
    {
      id: 'faq-quote',
      name: 'FAQ - Quote & Services',
      description: 'Keywords like quote, services, contact trigger instant responses.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['quote', 'quotation', 'services', 'contact', 'price', 'prices'] },
      steps: [
        { type: 'send_text', body: `Here's how to get a quote. Submit your request anytime!` },
        { type: 'send_url', body: 'Request a quote:', url: storeUrl }
      ]
    },
    {
      id: 'request-redirect',
      name: 'Request Redirect',
      description: 'Send clients to your request form when they click the CTA button.',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [{ type: 'send_url', body: 'Submit request:', url: storeUrl }]
    },
    {
      id: 'location',
      name: 'Location Reply',
      description: 'Share your service area or office address when clients ask.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'area', 'directions'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    },
    {
      id: 'services',
      name: 'Services',
      description: 'Explain your service areas, process, or typical response time.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['process', 'how', 'response', 'service area'] },
      steps: [
        { type: 'send_text', body: "Here's our process. Update with your service details." },
        { type: 'send_url', body: 'Submit request:', url: storeUrl }
      ]
    }
  ],
  OTHER: (storeUrl, businessName) => [
    {
      id: 'welcome',
      name: 'Welcome',
      description: 'Auto-send a welcome message with your store or contact link when customers first message.',
      type: 'welcome',
      trigger: { type: 'first_message', businessHoursOnly: true },
      steps: [
        { type: 'send_text', body: `👋 Welcome to ${businessName}!\n\nBrowse our catalog and place your order easily.` },
        { type: 'send_url', body: 'View catalog:', url: storeUrl }
      ]
    },
    {
      id: 'away',
      name: 'Away',
      description: 'Reply when closed with your hours and a link. Keeps customers informed.',
      type: 'away',
      trigger: { type: 'any_message', outsideHoursOnly: true },
      steps: [
        { type: 'send_text', body: "Hi! Thanks for your message. We're currently closed. Our hours are 09:00–22:00. We'll reply as soon as we're back!" }
      ]
    },
    {
      id: 'faq-catalog',
      name: 'FAQ - Menu / Catalog',
      description: 'Set up keyword-triggered flows for common questions. Instant answers.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['menu', 'catalog', 'price', 'prices', 'hours'] },
      steps: [
        { type: 'send_text', body: `Here's our catalog. Browse and order anytime!` },
        { type: 'send_url', body: 'View catalog:', url: storeUrl }
      ]
    },
    {
      id: 'order-redirect',
      name: 'Order Redirect',
      description: 'Send customers to your store when they click the order button.',
      type: 'button_reply',
      trigger: { type: 'button_click', buttonPayload: 'order' },
      steps: [{ type: 'send_url', body: 'Order now:', url: storeUrl }]
    },
    {
      id: 'location',
      name: 'Location Reply',
      description: 'Reply with your address when customers ask for location.',
      type: 'keyword',
      trigger: { type: 'keyword', keywords: ['location', 'address', 'where', 'directions'] },
      steps: [
        { type: 'send_location', body: 'Find us here:', name: businessName, address: 'Update with your address' }
      ]
    }
  ]
}

/**
 * Returns flow templates tailored to the business type.
 * Falls back to OTHER if businessType is unknown.
 */
export function getFlowTemplates(
  storeUrl: string,
  businessName: string,
  businessType?: string | null
): FlowTemplate[] {
  const key = (businessType?.toUpperCase() || 'OTHER') as BusinessTypeKey
  const fn = TEMPLATES_BY_TYPE[key] ?? TEMPLATES_BY_TYPE.OTHER
  return fn(storeUrl, businessName)
}
