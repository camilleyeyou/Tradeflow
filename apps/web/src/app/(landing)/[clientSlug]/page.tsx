import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getTradeConfig } from '@/lib/trades'

export const revalidate = 3600

interface Props {
  params: Promise<{ clientSlug: string }>
}

export default async function ClientLandingRedirect({ params }: Props) {
  const { clientSlug } = await params

  // Fetch the client's trade so we redirect to the right default service
  // (hvac -> ac-repair, plumbing -> emergency-plumbing). Any failure (missing
  // env, client not found, query error) falls back to the hvac default so
  // this redirect never regresses to a broken page.
  let trade: string | undefined
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (url && key && !url.includes('<') && !url.includes('>')) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } })
      const { data: client } = await supabase
        .from('clients')
        .select('trade')
        .eq('slug', clientSlug)
        .eq('is_active', true)
        .single()
      trade = client?.trade as string | undefined
    } catch {
      trade = undefined
    }
  }

  redirect(`/${clientSlug}/${getTradeConfig(trade).defaultService}`)
}
