import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getTradeConfig } from '@/lib/trades'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/get-started`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Guard: skip dynamic lookups if Supabase is not configured (local dev / CI)
  if (!url || !key || url.includes('<') || url.includes('>')) {
    return staticUrls
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } })

    const { data: clients } = await supabase
      .from('clients')
      .select('slug, trade')
      .eq('is_active', true)

    if (!clients || clients.length === 0) {
      return staticUrls
    }

    const landingUrls: MetadataRoute.Sitemap = clients.flatMap((client) =>
      getTradeConfig(client.trade as string).services.map((service) => ({
        url: `${base}/${client.slug as string}/${service.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    )

    return [...staticUrls, ...landingUrls]
  } catch {
    return staticUrls
  }
}
