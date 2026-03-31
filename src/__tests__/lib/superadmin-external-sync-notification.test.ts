import { describe, it, expect } from 'vitest'
import { formatExternalSyncEmailSubject } from '@/lib/superadmin-external-sync-email-format'

describe('formatExternalSyncEmailSubject', () => {
  it('uses completed / completed with errors / failed phrases', () => {
    expect(
      formatExternalSyncEmailSubject('Neps Shop', 'ByBest', 'success')
    ).toBe('External sync completed – Neps Shop – ByBest')
    expect(
      formatExternalSyncEmailSubject('Neps Shop', 'ByBest', 'partial')
    ).toBe('External sync completed with errors – Neps Shop – ByBest')
    expect(
      formatExternalSyncEmailSubject('Neps Shop', 'ByBest', 'failed')
    ).toBe('External sync failed – Neps Shop – ByBest')
  })
})
