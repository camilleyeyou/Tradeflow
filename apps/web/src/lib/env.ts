import { z } from 'zod'

// Vars without which the app cannot serve any traffic at all — these are the
// only ones allowed to crash server boot.
const coreEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

// Service-tier vars. Every feature that depends on one of these no-ops at its
// own call site when the var is unset (pre-launch deploys intentionally run
// without third-party keys), so their absence must never crash boot — a
// missing RESEND_API_KEY taking down the dashboard is exactly the failure
// mode this tier exists to prevent.
const SERVICE_ENV_VARS = ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'] as const

export function validateEnv(): void {
  const parsed = coreEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
    throw new Error(
      `[env] Missing or invalid required environment variables: ${missing}`
    )
  }

  const missingService = SERVICE_ENV_VARS.filter((k) => !process.env[k])
  if (missingService.length > 0) {
    console.warn(
      `[env] Service env vars not set: ${missingService.join(', ')} — dependent features are disabled until configured`
    )
  }
}
