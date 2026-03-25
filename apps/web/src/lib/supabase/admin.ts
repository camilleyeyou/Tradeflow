import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// NEVER import this outside of (admin)/ route group files
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
