/**
 * Encrypts HolaOra web portal passwords for SuperAdmin-only storage (AES-256-GCM).
 * Requires env HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY — 32-byte value, base64-encoded
 * (generate: openssl rand -base64 32).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 16
const TAG_LEN = 16
const KEY_LEN = 32

function getKeyBuffer(): Buffer {
  const raw = process.env.HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY?.trim()
  if (!raw) {
    throw new Error('HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY is not configured')
  }
  try {
    const b = Buffer.from(raw, 'base64')
    if (b.length === KEY_LEN) return b
  } catch {
    /* fall through */
  }
  return scryptSync(raw, 'waveorder-holaora-portal', KEY_LEN)
}

/** Returns base64(iv || tag || ciphertext) */
export function encryptHolaPortalPassword(plain: string): string {
  if (!plain) throw new Error('Password cannot be empty')
  const key = getKeyBuffer()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptHolaPortalPassword(stored: string): string {
  if (!stored) throw new Error('No encrypted password stored')
  const key = getKeyBuffer()
  const buf = Buffer.from(stored, 'base64')
  if (buf.length < IV_LEN + TAG_LEN + 1) throw new Error('Invalid ciphertext')
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const data = buf.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function isHolaPortalCryptoConfigured(): boolean {
  return Boolean(process.env.HOLAORA_PORTAL_CREDENTIALS_ENCRYPTION_KEY?.trim())
}
