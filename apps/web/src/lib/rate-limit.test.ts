import { describe, it, expect } from 'vitest'
import { rateLimit, getClientIp } from './rate-limit'

describe('rateLimit', () => {
  it('allows requests up to the limit', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000).allowed).toBe(true)
    }
  })

  it('rejects the (limit+1)-th request within the window', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      rateLimit(key, 5, 60_000)
    }
    const result = rateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('slides the window so old entries are evicted', async () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 50)
    }
    expect(rateLimit(key, 3, 50).allowed).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(rateLimit(key, 3, 50).allowed).toBe(true)
  })
})

describe('getClientIp', () => {
  it('reads the first IP from x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIp(request)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.9.9.9' },
    })
    expect(getClientIp(request)).toBe('9.9.9.9')
  })

  it('falls back to "unknown" when no headers are present', () => {
    const request = new Request('http://localhost')
    expect(getClientIp(request)).toBe('unknown')
  })
})
