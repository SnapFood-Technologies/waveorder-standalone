/**
 * WaveOrder Flows - Use cases by business type for SuperAdmin adoption messaging
 */

export type BusinessTypeKey =
  | 'RESTAURANT'
  | 'CAFE'
  | 'RETAIL'
  | 'GROCERY'
  | 'SALON'
  | 'SERVICES'
  | 'OTHER'

export interface FlowUseCase {
  title: string
  description: string
}

export const FLOWS_USE_CASES_BY_TYPE: Record<BusinessTypeKey, FlowUseCase[]> = {
  RESTAURANT: [
    {
      title: 'Welcome & menu link',
      description:
        'Auto-send a welcome message with your menu link when customers first message. Reduces friction and speeds up orders.',
    },
    {
      title: 'Outside hours reply',
      description:
        "When closed, automatically reply with your opening hours and a link to order for later. Keeps customers informed.",
    },
    {
      title: 'Keyword triggers',
      description:
        "Trigger flows on keywords like 'menu', 'delivery', 'hours'. Customers get instant answers without waiting.",
    },
    {
      title: 'Daily specials',
      description:
        'Use keyword flows to share today\'s specials when customers ask "what\'s new" or "specials".',
    },
  ],
  CAFE: [
    {
      title: 'Welcome & order link',
      description:
        'Greet customers and send your order link instantly. Perfect for grab-and-go and pre-orders.',
    },
    {
      title: 'Outside hours',
      description:
        'Reply when closed with opening hours and a link to pre-order for pickup.',
    },
    {
      title: 'Keyword triggers',
      description:
        "Keywords like 'menu', 'coffee', 'hours' trigger instant automated replies.",
    },
    {
      title: 'Loyalty & promotions',
      description:
        'Use flows to share promotions or loyalty info when customers ask about offers.',
    },
  ],
  RETAIL: [
    {
      title: 'Welcome & catalog',
      description:
        'Send a welcome message with your store link when customers first contact you. Drives traffic to your catalog.',
    },
    {
      title: 'Outside hours',
      description:
        'Reply when closed with opening hours and a link to browse. Customers can prepare their order.',
    },
    {
      title: 'Keyword triggers',
      description:
        "Keywords like 'catalog', 'delivery', 'prices' trigger instant responses with relevant info.",
    },
    {
      title: 'New arrivals & sales',
      description:
        'Use keyword flows to highlight new products or ongoing sales when customers ask.',
    },
  ],
  GROCERY: [
    {
      title: 'Welcome & order link',
      description:
        'Greet customers and send your order link. Ideal for weekly shopping and delivery orders.',
    },
    {
      title: 'Outside hours',
      description:
        'Reply when closed with delivery hours and a link to place orders for next delivery.',
    },
    {
      title: 'Keyword triggers',
      description:
        "Keywords like 'order', 'delivery', 'minimum' trigger instant answers.",
    },
    {
      title: 'Delivery zones & fees',
      description:
        'Use flows to explain delivery areas and fees when customers ask.',
    },
  ],
  SALON: [
    {
      title: 'Welcome & booking link',
      description:
        'Send a welcome message with your booking link when clients first message. Makes booking effortless.',
    },
    {
      title: 'Outside hours',
      description:
        'Reply when closed with opening hours and a link to book online. Reduces no-shows with reminders.',
    },
    {
      title: 'Keyword triggers',
      description:
        "Keywords like 'book', 'appointment', 'services', 'prices' trigger instant replies.",
    },
    {
      title: 'Service info',
      description:
        'Use flows to share service menus, pricing, or special offers when clients ask.',
    },
  ],
  SERVICES: [
    {
      title: 'Welcome & request link',
      description:
        'Greet potential clients and send your request/quote form link. Captures leads 24/7.',
    },
    {
      title: 'Outside hours',
      description:
        'Reply when unavailable with your response time and a link to submit a request.',
    },
    {
      title: 'Keyword triggers',
      description:
        "Keywords like 'quote', 'services', 'contact' trigger instant responses.",
    },
    {
      title: 'Service areas & process',
      description:
        'Use flows to explain your service areas, process, or typical response time.',
    },
  ],
  OTHER: [
    {
      title: 'Welcome message',
      description:
        'Auto-send a welcome message with your store or contact link when customers first message.',
    },
    {
      title: 'Outside hours',
      description:
        'Reply when closed with your hours and a link. Keeps customers informed.',
    },
    {
      title: 'Keyword triggers',
      description:
        'Set up keyword-triggered flows for common questions. Instant answers, less manual work.',
    },
    {
      title: 'Custom automation',
      description:
        'Create flows tailored to your business. Welcome, away, and keyword flows adapt to any use case.',
    },
  ],
}

export function getUseCasesForBusinessType(
  businessType: string
): FlowUseCase[] {
  const key = businessType?.toUpperCase() as BusinessTypeKey
  if (key && key in FLOWS_USE_CASES_BY_TYPE) {
    return FLOWS_USE_CASES_BY_TYPE[key]
  }
  return FLOWS_USE_CASES_BY_TYPE.OTHER
}
