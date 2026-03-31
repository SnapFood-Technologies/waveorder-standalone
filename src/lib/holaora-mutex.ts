/**
 * AI Store Assistant and HolaOra storefront embed cannot both be on for a business.
 * Apply these rules whenever either flag is written via API.
 */
export type AiHolaPatch = {
  aiAssistantEnabled?: boolean
  holaoraStorefrontEmbedEnabled?: boolean
}

/**
 * Returns patch fields with mutex applied (embed on → AI off; AI on → embed off).
 */
export function applyAiHolaMutex(patch: AiHolaPatch): AiHolaPatch {
  const out: AiHolaPatch = { ...patch }
  if (out.holaoraStorefrontEmbedEnabled === true) {
    out.aiAssistantEnabled = false
  }
  if (out.aiAssistantEnabled === true) {
    out.holaoraStorefrontEmbedEnabled = false
  }
  return out
}
