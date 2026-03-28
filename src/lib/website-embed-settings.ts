/**
 * Persisted embed tool state (Admin → Marketing → Embedded).
 */
export type WebsiteEmbedSettingsJson = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  buttonLabel?: string
  bgColor?: string
  textColor?: string
  rounded?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const DEFAULT_WEBSITE_EMBED_SETTINGS: Required<
  Pick<
    WebsiteEmbedSettingsJson,
    | 'utmSource'
    | 'utmMedium'
    | 'utmCampaign'
    | 'buttonLabel'
    | 'bgColor'
    | 'textColor'
    | 'rounded'
    | 'size'
  >
> = {
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
  buttonLabel: 'Order online',
  bgColor: '#0d9488',
  textColor: '#ffffff',
  rounded: true,
  size: 'md',
}

function clampStr(s: unknown, max: number): string {
  if (typeof s !== 'string') return ''
  return s.slice(0, max)
}

export function mergeWebsiteEmbedSettings(stored: unknown): typeof DEFAULT_WEBSITE_EMBED_SETTINGS {
  const d = DEFAULT_WEBSITE_EMBED_SETTINGS
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    return { ...d }
  }
  const o = stored as Record<string, unknown>
  const sizeRaw = o.size
  const size =
    sizeRaw === 'sm' || sizeRaw === 'md' || sizeRaw === 'lg' ? sizeRaw : d.size
  return {
    utmSource: clampStr(o.utmSource, 256),
    utmMedium: clampStr(o.utmMedium, 256),
    utmCampaign: clampStr(o.utmCampaign, 256),
    buttonLabel: clampStr(o.buttonLabel, 128) || d.buttonLabel,
    bgColor: clampStr(o.bgColor, 64) || d.bgColor,
    textColor: clampStr(o.textColor, 64) || d.textColor,
    rounded: typeof o.rounded === 'boolean' ? o.rounded : d.rounded,
    size,
  }
}

export function sanitizeWebsiteEmbedSettingsForSave(
  input: unknown
): WebsiteEmbedSettingsJson {
  return mergeWebsiteEmbedSettings(input)
}
