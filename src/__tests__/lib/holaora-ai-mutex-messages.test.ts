import { describe, expect, it } from 'vitest'
import {
  HO_MUTEX_ERR_BOTH_ON,
  HO_MUTEX_ERR_ENABLE_AI,
  HO_MUTEX_ERR_ENABLE_HOLA_EMBED,
} from '@/lib/holaora-ai-mutex-messages'

describe('holaora-ai-mutex-messages', () => {
  it('exports non-empty API error strings', () => {
    expect(HO_MUTEX_ERR_ENABLE_AI.length).toBeGreaterThan(20)
    expect(HO_MUTEX_ERR_ENABLE_HOLA_EMBED.length).toBeGreaterThan(20)
    expect(HO_MUTEX_ERR_BOTH_ON.length).toBeGreaterThan(20)
  })
})
