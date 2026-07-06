import { describe, it, expect, beforeAll } from 'vitest'
import { encryptToken, decryptToken } from './crypto'

beforeAll(() => {
  // 32-byte (64 hex char) test key
  process.env.GHL_TOKEN_ENC_KEY = 'a'.repeat(64)
})

describe('crypto token encryption', () => {
  it('round-trips plaintext through encrypt/decrypt', () => {
    const plaintext = 'pit-abc123-super-secret-token'
    const encrypted = encryptToken(plaintext)
    expect(decryptToken(encrypted)).toBe(plaintext)
  })

  it('produces iv:authTag:ciphertext hex-encoded segments', () => {
    const encrypted = encryptToken('some-token')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(part).toMatch(/^[0-9a-f]+$/)
    }
  })

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const a = encryptToken('same-value')
    const b = encryptToken('same-value')
    expect(a).not.toBe(b)
  })
})
