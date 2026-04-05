/**
 * AI Store Assistant vs HolaOra embed: default mutex unless geo split is on with a non-empty country list.
 * Visitor ISO2 resolution matches country catalog (?cc / ?visitorCountry + cookie — see storefront-catalog-visitor).
 */

import { filterToCatalogCountryCodes } from '@/lib/catalog-country-options'

/** When true, API must enforce mutual exclusion between aiAssistantEnabled and holaoraStorefrontEmbedEnabled. */
export function aiHolaMutexEnforced(
  storefrontAiGeoSplitEnabled: boolean,
  aiAssistantVisitorCountryCodes: string[] | null | undefined
): boolean {
  if (!storefrontAiGeoSplitEnabled) return true
  return filterToCatalogCountryCodes(aiAssistantVisitorCountryCodes).length === 0
}

export type StorefrontChatPresentation = {
  showHolaEmbed: boolean
  showAiAssistant: boolean
  /** Move scroll-to-top FAB left when Hola is shown (avoids overlap with bottom-right chat). */
  scrollToTopLeft: boolean
}

export function computeStorefrontChatPresentation(params: {
  storefrontAiGeoSplitEnabled: boolean
  aiAssistantVisitorCountryCodes: string[] | null | undefined
  visitorCountryIso: string | null
  aiAssistantEnabled: boolean
  /** From GET /api/storefront/[slug] (entitled + embed on + account id). */
  showHolaOraEmbed: boolean
  holaoraAccountId: string | null | undefined
}): StorefrontChatPresentation {
  const codes = filterToCatalogCountryCodes(params.aiAssistantVisitorCountryCodes)
  const baseHola = Boolean(params.showHolaOraEmbed && params.holaoraAccountId)
  const baseAi = params.aiAssistantEnabled

  if (!params.storefrontAiGeoSplitEnabled || codes.length === 0) {
    return {
      showHolaEmbed: baseHola,
      showAiAssistant: baseAi && !baseHola,
      scrollToTopLeft: false,
    }
  }

  const v = params.visitorCountryIso?.toUpperCase().slice(0, 2) ?? null
  const inList = Boolean(v && codes.includes(v))

  if (inList) {
    return {
      showHolaEmbed: false,
      showAiAssistant: baseAi,
      scrollToTopLeft: false,
    }
  }

  return {
    showHolaEmbed: baseHola,
    showAiAssistant: false,
    scrollToTopLeft: baseHola,
  }
}
