/**
 * In-memory sliding-window rate limiter.
 *
 * NOTE: This is best-effort, per-serverless-instance rate limiting. It keeps
 * hit timestamps in a module-level Map that does not persist or sync across
 * separate serverless/Edge instances (e.g. Vercel Fluid compute may spin up
 * multiple instances for the same route). It is NOT a global/distributed
 * limiter — a determined attacker rotating IPs or hitting different instances
 * can exceed the intended cap. This is acceptable for basic bot deterrence
 * per Phase 6 CONTEXT (SPAM-01); a shared store (e.g. Redis/Upstash) would be
 * required for a hard guarantee.
 */

const hits = new Map<string, number[]>()

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const cutoff = now - windowMs
  const existing = hits.get(key) ?? []
  const recent = existing.filter((timestamp) => timestamp > cutoff)

  if (recent.length >= limit) {
    hits.set(key, recent)
    return { allowed: false, remaining: 0 }
  }

  recent.push(now)
  hits.set(key, recent)
  return { allowed: true, remaining: limit - recent.length }
}

/**
 * Best-effort client IP extraction for rate-limiting purposes.
 * Prefers x-forwarded-for (first entry), falls back to x-real-ip, then
 * 'unknown' if neither header is present (e.g. local dev).
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}
