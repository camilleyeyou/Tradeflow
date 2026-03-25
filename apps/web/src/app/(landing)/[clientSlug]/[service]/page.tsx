import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { SERVICE_TYPES } from '@/lib/validations/lead'
import LeadForm from '@/components/lead-form'

const SERVICE_LABELS: Record<string, string> = {
  'ac-repair': 'AC Repair',
  'furnace-repair': 'Furnace Repair',
  'installation': 'HVAC Installation',
  'maintenance': 'HVAC Maintenance',
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^1/, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-yellow-400"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-green-600"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V12.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export async function generateStaticParams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: clients } = await supabase
    .from('clients')
    .select('slug')
    .eq('is_active', true)

  if (!clients || clients.length === 0) {
    return []
  }

  return clients.flatMap((client) =>
    SERVICE_TYPES.map((service) => ({
      clientSlug: client.slug as string,
      service,
    }))
  )
}

interface Props {
  params: Promise<{ clientSlug: string; service: string }>
}

export default async function LandingPage({ params }: Props) {
  const { clientSlug, service } = await params

  if (!SERVICE_TYPES.includes(service as (typeof SERVICE_TYPES)[number])) {
    notFound()
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: client } = await supabase
    .from('clients')
    .select('id, business_name, phone, city, service_area_zips, slug')
    .eq('slug', clientSlug)
    .eq('is_active', true)
    .single()

  if (!client) {
    notFound()
  }

  const serviceLabel = SERVICE_LABELS[service] ?? service
  const formattedPhone = formatPhone(client.phone as string)

  return (
    <main className="min-h-screen bg-white">
      {/* HERO SECTION (above the fold) */}
      <section className="bg-blue-900 text-white px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {serviceLabel} in {client.city as string}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-blue-100">
            Licensed &amp; insured HVAC professionals. Fast, reliable service.
          </p>
          {/* Click-to-call button (LAND-04) */}
          <a
            href={`tel:${client.phone as string}`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl mb-8 transition-colors"
          >
            Call Now: {formattedPhone}
          </a>
        </div>
      </section>

      {/* LEAD FORM (above the fold on mobile — rendered inline) */}
      <section className="px-4 py-8 -mt-8 relative z-10">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 border">
          <h2 className="text-xl font-bold text-center mb-4">Get a Free Quote</h2>
          <LeadForm clientId={client.id as string} serviceType={service} />
        </div>
      </section>

      {/* TRUST SIGNALS (below the fold — LAND-05) */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          {/* Review stars */}
          <div className="flex items-center justify-center gap-1 mb-6">
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <StarIcon />
            <span className="ml-2 text-gray-600 font-medium">4.9/5 from 100+ reviews</span>
          </div>

          {/* License badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <ShieldCheckIcon />
            <span className="text-gray-700 font-medium">
              Licensed &amp; Insured &mdash; {client.business_name as string}
            </span>
          </div>

          {/* Service area neighborhoods */}
          <div className="text-center">
            <h3 className="font-semibold mb-2 text-gray-800">Serving</h3>
            <p className="text-gray-600">
              {Array.isArray(client.service_area_zips)
                ? (client.service_area_zips as string[]).join(', ')
                : (client.service_area_zips as string)}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
