import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

// Landing pages are public but fetch client data server-side using the service
// role key so RLS doesn't block reads. The key never reaches the browser.
function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
import { SERVICE_TYPES } from '@/lib/validations/lead'
import LeadForm from '@/components/lead-form'

const GOLD = '#D4AF37'

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
      className="w-5 h-5"
      style={{ color: GOLD }}
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
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5 text-slate-700"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" />
    </svg>
  )
}

export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Guard: skip static generation if Supabase is not configured (local dev / CI)
  if (!url || !key || url.includes('<') || url.includes('>')) {
    return []
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

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

  const supabase = createServerClient()

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
  const serviceAreaText = Array.isArray(client.service_area_zips)
    ? (client.service_area_zips as string[]).join(' · ')
    : (client.service_area_zips as string)

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO + FORM (above the fold) */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        {/* Subtle gold radial glow + bottom fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,175,55,0.08), transparent)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,1))' }}
          aria-hidden="true"
        />

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-12 md:pt-14 md:pb-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* LEFT — Pitch + phone CTA */}
          <div>
            {/* Trust pill */}
            <div
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full mb-6"
              style={{
                color: GOLD,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.18)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: GOLD }}
                aria-hidden="true"
              />
              Same-day service · Available 7 days
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-[1.08] tracking-tight mb-4">
              {serviceLabel} in{' '}
              <span style={{ color: GOLD }}>{client.city as string}</span>
            </h1>

            <p className="text-base md:text-lg text-white/70 mb-8 max-w-md">
              Licensed &amp; insured technicians with {client.business_name as string}. Most
              repairs done same day.
            </p>

            {/* Click-to-call — primary CTA above fold */}
            <a
              href={`tel:${client.phone as string}`}
              className="group inline-flex items-center gap-3 font-bold text-lg md:text-xl py-4 px-7 rounded-xl text-slate-900 transition-all hover:brightness-105 active:brightness-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              style={{
                background: GOLD,
                boxShadow: '0 8px 32px rgba(212,175,55,0.35)',
                ['--tw-ring-color' as string]: GOLD,
              }}
              aria-label={`Call ${client.business_name as string} at ${formattedPhone}`}
            >
              <PhoneIcon />
              <span>Call {formattedPhone}</span>
            </a>

            {/* Trust strip */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
              <span className="inline-flex items-center gap-1">
                <StarIcon /> <StarIcon /> <StarIcon /> <StarIcon /> <StarIcon />
                <span className="ml-1.5 text-white/80">4.9 from 100+ reviews</span>
              </span>
              <span className="hidden md:inline text-white/30">·</span>
              <span className="text-white/70">Licensed &amp; insured</span>
            </div>

            {serviceAreaText && (
              <p className="mt-4 text-xs text-white/40">
                Serving: {serviceAreaText}
              </p>
            )}
          </div>

          {/* RIGHT — Lead form card */}
          <div className="relative lg:sticky lg:top-6">
            <div
              className="absolute -inset-3 rounded-2xl pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.18), transparent 70%)',
              }}
              aria-hidden="true"
            />
            <div
              className="relative bg-white rounded-xl p-6 md:p-7"
              style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                borderTop: `3px solid ${GOLD}`,
              }}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Get a free quote
              </h2>
              <p className="text-sm text-slate-600 mb-5">
                We&apos;ll call you back within 5 minutes.
              </p>
              <LeadForm clientId={client.id as string} serviceType={service} />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST DETAILS */}
      <section className="px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(212,175,55,0.12)' }}
              >
                <ShieldCheckIcon />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Licensed &amp; insured</h3>
              <p className="text-sm text-slate-600">
                {client.business_name as string} &mdash; fully credentialed local technicians.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(212,175,55,0.12)' }}
              >
                <PhoneIcon />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">5-minute callback</h3>
              <p className="text-sm text-slate-600">
                A real person calls you back fast &mdash; no phone trees.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(212,175,55,0.12)' }}
              >
                <span className="font-bold" style={{ color: GOLD }}>4.9</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">100+ reviews</h3>
              <p className="text-sm text-slate-600">
                Trusted by homeowners across {client.city as string}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
