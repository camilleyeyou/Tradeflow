// Server-only: imports node:crypto, never bundle to client
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH_BYTES = 12

function getKey(): Buffer {
  const hex = process.env.GHL_TOKEN_ENC_KEY
  const key = hex ? Buffer.from(hex, 'hex') : Buffer.alloc(0)
  if (!hex || key.length !== 32) {
    throw new Error('GHL_TOKEN_ENC_KEY missing or not 32 bytes (64 hex chars)')
  }
  return key
}

/**
 * Encrypts plaintext using AES-256-GCM, keyed on GHL_TOKEN_ENC_KEY.
 * Returns a string of the form `iv:authTag:ciphertext` (hex-encoded segments).
 */
export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

/**
 * Decrypts a payload produced by encryptToken(). Reverses the `iv:authTag:ciphertext` format.
 */
export function decryptToken(payload: string): string {
  const key = getKey()
  const [ivHex, authTagHex, ciphertextHex] = payload.split(':')
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted token payload')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}
