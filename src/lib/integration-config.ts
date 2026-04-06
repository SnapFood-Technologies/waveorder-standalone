/**
 * Validates Integration.config per Integration.kind (see docs/HOLAORA_IMPLEMENTATION_SPEC.md).
 */
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import type { IntegrationKind } from '@/lib/integration-kind'

/** All scope ids used by /api/v1 routes (partner keys may grant a subset). */
export const ALL_V1_API_SCOPES = [
  'products:read',
  'products:write',
  'orders:read',
  'categories:read',
  'categories:write',
  'services:read',
  'services:write',
  'appointments:read',
  'appointments:write',
] as const

export type V1ApiScope = (typeof ALL_V1_API_SCOPES)[number]

/** Hola chat on waveorder.app (marketing site) — SuperAdmin modal; public homepage loads embed only. */
export const waveorderMarketingSiteSchema = z.object({
  embedEnabled: z.boolean().default(false),
  embedKind: z.enum(['SCRIPT', 'IFRAME']).default('SCRIPT'),
  workspaceId: z.string().max(128).nullable().optional(),
  primaryColor: z.string().max(64).nullable().optional(),
  position: z.string().max(64).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  greeting: z.string().max(500).nullable().optional(),
  /** Script: data-launcher-icon (Hola preset id, e.g. heart) */
  launcherIcon: z.string().max(64).nullable().optional(),
  /** Script: data-suggestions-enabled */
  suggestionsEnabled: z.boolean().default(false),
  /** Script: data-suggestions — JSON array of suggestion strings */
  suggestions: z.array(z.string().max(200)).max(30).optional(),
  iframeWidth: z.number().int().min(200).max(1200).nullable().optional(),
  iframeHeight: z.number().int().min(200).max(1200).nullable().optional(),
  /** Support: Hola web app login email (optional). */
  portalEmail: z.string().max(320).nullable().optional(),
  /** AES-GCM ciphertext from encryptHolaPortalPassword (optional). */
  portalPasswordEnc: z.string().max(6000).nullable().optional(),
})

export type WaveorderMarketingSiteConfig = z.infer<typeof waveorderMarketingSiteSchema>

export const holaOraConfigSchema = z.object({
  holaOraBaseUrl: z
    .string()
    .min(1, 'Provisioning base URL is required')
    .url('Must be a valid URL (https://…)'),
  entitlementStripePriceIds: z.array(z.string().min(1)).default([]),
  defaultV1Scopes: z
    .array(z.string())
    .min(1, 'Select at least one Public API (v1) scope for HolaOra'),
  documentedV1Paths: z.array(z.string().min(1)).optional().default([]),
  rateLimitPerMinute: z.number().int().positive().max(100_000).optional(),
  setupNotes: z.string().max(8000).optional(),
  waveorderMarketingSite: waveorderMarketingSiteSchema.optional(),
})

export type HolaOraIntegrationConfig = z.infer<typeof holaOraConfigSchema>

function scopesAreValid(scopes: string[]): boolean {
  const allowed = new Set<string>(ALL_V1_API_SCOPES)
  return scopes.every((s) => allowed.has(s))
}

/**
 * Parse and validate body.config for create/update. Returns JSON-safe object for Prisma.
 */
export function normalizeIntegrationConfig(
  kind: IntegrationKind,
  config: unknown
):
  | { ok: true; value: Prisma.InputJsonValue | undefined }
  | { ok: false; error: string } {
  if (kind === 'HOLAORA') {
    const parsed = holaOraConfigSchema.safeParse(config)
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg = Object.entries(first)
        .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
        .join('; ')
      return {
        ok: false,
        error: msg || parsed.error.message || 'Invalid HolaOra configuration',
      }
    }
    if (!scopesAreValid(parsed.data.defaultV1Scopes)) {
      return {
        ok: false,
        error: `defaultV1Scopes must only include: ${ALL_V1_API_SCOPES.join(', ')}`,
      }
    }
    return { ok: true, value: parsed.data as unknown as Prisma.InputJsonValue }
  }

  if (config == null || config === '') {
    return { ok: true, value: undefined }
  }
  if (typeof config === 'object' && !Array.isArray(config)) {
    return { ok: true, value: config as Prisma.InputJsonValue }
  }
  return {
    ok: false,
    error: 'For generic integrations, config must be a JSON object or empty',
  }
}

export function parseHolaOraConfig(
  config: unknown
): HolaOraIntegrationConfig | null {
  const parsed = holaOraConfigSchema.safeParse(config)
  if (!parsed.success || !scopesAreValid(parsed.data.defaultV1Scopes)) {
    return null
  }
  return parsed.data
}
