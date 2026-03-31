/**
 * Platform integration kinds (SuperAdmin → Integration model).
 */
export const INTEGRATION_KINDS = ['GENERIC', 'HOLAORA'] as const

export type IntegrationKind = (typeof INTEGRATION_KINDS)[number]

export function isIntegrationKind(v: string): v is IntegrationKind {
  return (INTEGRATION_KINDS as readonly string[]).includes(v)
}

export function normalizeIntegrationKind(v: unknown): IntegrationKind {
  if (typeof v === 'string' && isIntegrationKind(v)) return v
  return 'GENERIC'
}
