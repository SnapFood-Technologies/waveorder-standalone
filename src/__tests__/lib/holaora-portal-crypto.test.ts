import { describe, expect, it, beforeAll } from 'vitest'

describe('holaora-portal-crypto', () => {
  beforeAll(() => {
    process.env.HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64')
  })

  it('round-trips encrypt and decrypt', async () => {
    const { encryptHolaPortalPassword, decryptHolaPortalPassword } = await import(
      '@/lib/holaora-portal-crypto'
    )
    const plain = 'my-secret-hola-password'
    const enc = encryptHolaPortalPassword(plain)
    expect(enc).not.toContain(plain)
    expect(decryptHolaPortalPassword(enc)).toBe(plain)
  })

  it('uses random IV so ciphertext differs each time', async () => {
    const { encryptHolaPortalPassword } = await import('@/lib/holaora-portal-crypto')
    const a = encryptHolaPortalPassword('same')
    const b = encryptHolaPortalPassword('same')
    expect(a).not.toBe(b)
  })
})
