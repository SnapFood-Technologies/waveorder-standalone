/**
 * Pure helpers for SuperAdmin external sync notification emails (no Resend / Prisma).
 */

export function formatExternalSyncEmailSubject(
  businessName: string,
  syncName: string,
  status: 'success' | 'failed' | 'partial'
): string {
  const statusPhrase =
    status === 'success'
      ? 'completed'
      : status === 'partial'
        ? 'completed with errors'
        : 'failed'
  return `External sync ${statusPhrase} – ${businessName} – ${syncName}`
}
