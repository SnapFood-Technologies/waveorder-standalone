import { describe, it, expect } from 'vitest'
import { mergeSessionsAndOrphansForPagination } from '@/lib/superadmin-ai-chat-history-pagination'

describe('mergeSessionsAndOrphansForPagination', () => {
  it('sorts sessions and orphans by last activity (newest first)', () => {
    const d1 = new Date('2026-03-01T10:00:00Z')
    const d2 = new Date('2026-03-09T15:00:00Z')
    const d3 = new Date('2026-03-05T12:00:00Z')
    const merged = mergeSessionsAndOrphansForPagination(
      [
        { sessionId: 's-a', lastAt: d1 },
        { sessionId: 's-b', lastAt: d2 },
      ],
      [{ id: 'm1', createdAt: d3 }]
    )
    expect(merged.map((x) => x.kind)).toEqual(['session', 'orphan', 'session'])
    expect(merged[0]).toMatchObject({ kind: 'session', sessionId: 's-b' })
  })
})
