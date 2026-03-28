/**
 * Build ordered list of "conversations" for SuperAdmin AI chat history pagination.
 * One row per distinct sessionId; messages with null sessionId count as one conversation each.
 */
export type SessionOrOrphan =
  | { kind: 'session'; sessionId: string; lastAt: Date }
  | { kind: 'orphan'; messageId: string; lastAt: Date }

export function mergeSessionsAndOrphansForPagination(
  sessionRows: { sessionId: string; lastAt: Date }[],
  orphanMeta: { id: string; createdAt: Date }[]
): SessionOrOrphan[] {
  const sessionEntries: SessionOrOrphan[] = sessionRows.map((s) => ({
    kind: 'session',
    sessionId: s.sessionId,
    lastAt: s.lastAt,
  }))

  const orphanEntries: SessionOrOrphan[] = orphanMeta.map((m) => ({
    kind: 'orphan',
    messageId: m.id,
    lastAt: m.createdAt,
  }))

  return [...sessionEntries, ...orphanEntries].sort(
    (a, b) => b.lastAt.getTime() - a.lastAt.getTime()
  )
}
