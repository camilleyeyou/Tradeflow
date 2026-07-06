'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  getStartedSchema,
  HEARD_FROM_OPTIONS,
  type GetStartedFormValues,
} from '@/lib/validations/get-started'

const GOLD = '#D4AF37'

const CONTACT_MAILTO =
  'mailto:hello@tradeflow-technologies.com?cc=contact@tradeflow-technologies.com&subject=Tradeflow%20%E2%80%94%20Free%20trial%20inquiry'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function GetStartedPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Honeypot (SPAM-01): kept outside react-hook-form so it is never wired to
  // a visible/labeled field; bots that auto-fill all inputs will populate it.
  const [honeypot, setHoneypot] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GetStartedFormValues>({
    resolver: zodResolver(getStartedSchema),
    mode: 'onBlur',
    defaultValues: {
      full_name: '',
      company_name: '',
      phone: '',
      email: '',
      service_area: '',
      heard_from: undefined as unknown as GetStartedFormValues['heard_from'],
    },
  })

  const onSubmit = async (values: GetStartedFormValues) => {
    setStatus('submitting')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/get-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, company_website: honeypot }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Something went wrong. Please try again.')
      }
      setStatus('success')
      reset()
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'General Sans', system-ui, sans-serif" }}
    >
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/4 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <img src="/logo-icon.svg" alt="" width={40} height={40} className="shrink-0" />
            <span
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "'Gambetta', Georgia, serif" }}
            >
              Trade<span style={{ color: GOLD }}>flow</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-[13px] text-white/70 hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Sign in &rarr;
          </Link>
        </div>
      </nav>

      {/* ─── HERO + FORM ─── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 20%, #0d0d0d, #000)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(212,175,55,0.02), transparent)' }}
        />

        <div className="relative max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-6"
              style={{
                color: GOLD,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.18)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
              Now onboarding Chicagoland HVAC
            </div>
            <h1
              className="text-[clamp(34px,5vw,52px)] font-semibold leading-[1.08] tracking-tight mb-4"
              style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.03em' }}
            >
              Claim your <span style={{ color: GOLD }}>free trial</span>
            </h1>
            <p className="text-white/45 text-[15px] leading-relaxed max-w-md mx-auto">
              Tell us about your business. We&apos;ll reach out within one business day to get
              your ads, landing page, and lead automation live.
            </p>
            <p className="mt-4 text-white/25 text-[12px] tracking-wide">
              2-week free trial &middot; $200 in ad spend on us &middot; No contracts
            </p>
          </div>

          {status === 'success' ? (
            <SuccessCard onReset={() => setStatus('idle')} />
          ) : (
            <>
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Honeypot (SPAM-01): hidden from real users, not a
                  react-hook-form field — bots that blindly fill every input
                  will trip this. */}
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    aria-invalid={!!errors.full_name || undefined}
                    {...register('full_name')}
                    className={inputClass(!!errors.full_name)}
                  />
                </Field>

                <Field
                  label="Company name"
                  htmlFor="company_name"
                  error={errors.company_name?.message}
                >
                  <input
                    id="company_name"
                    type="text"
                    autoComplete="organization"
                    placeholder="Smith HVAC"
                    aria-invalid={!!errors.company_name || undefined}
                    {...register('company_name')}
                    className={inputClass(!!errors.company_name)}
                  />
                </Field>

                <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(312) 555-0100"
                    aria-invalid={!!errors.phone || undefined}
                    {...register('phone')}
                    className={inputClass(!!errors.phone)}
                  />
                </Field>

                <Field label="Email address" htmlFor="email" error={errors.email?.message}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="jane@smithhvac.com"
                    aria-invalid={!!errors.email || undefined}
                    {...register('email')}
                    className={inputClass(!!errors.email)}
                  />
                </Field>

                <Field
                  label="Primary service area / zip"
                  htmlFor="service_area"
                  error={errors.service_area?.message}
                >
                  <input
                    id="service_area"
                    type="text"
                    autoComplete="postal-code"
                    placeholder="Naperville or 60540"
                    aria-invalid={!!errors.service_area || undefined}
                    {...register('service_area')}
                    className={inputClass(!!errors.service_area)}
                  />
                </Field>

                <Field
                  label="How did you hear about us?"
                  htmlFor="heard_from"
                  error={errors.heard_from?.message}
                >
                  <select
                    id="heard_from"
                    aria-invalid={!!errors.heard_from || undefined}
                    defaultValue=""
                    {...register('heard_from')}
                    className={`${inputClass(!!errors.heard_from)} appearance-none bg-no-repeat bg-[length:14px] bg-[right_14px_center] pr-10`}
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'><path d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%23ffffff80' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
                    }}
                  >
                    <option value="" disabled>
                      Select one
                    </option>
                    {HEARD_FROM_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-black text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {status === 'error' && errorMessage && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg px-4 py-3 text-[13px]"
                  style={{
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#fca5a5',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-white/30 text-[12px]">
                  By submitting, you agree to be contacted about Tradeflow.
                </p>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="inline-flex items-center justify-center gap-2 font-bold text-[15px] py-3.5 px-8 rounded-xl transition-all hover:brightness-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    background: GOLD,
                    color: '#000',
                    boxShadow: '0 0 40px rgba(212,175,55,0.25)',
                  }}
                >
                  {status === 'submitting' ? (
                    <>
                      <Spinner /> Sending&hellip;
                    </>
                  ) : (
                    <>Get started &rarr;</>
                  )}
                </button>
              </div>
            </form>
            <p className="mt-5 text-center text-[13px] text-white/30">
              Prefer email?{' '}
              <a
                href={CONTACT_MAILTO}
                className="text-white/60 underline underline-offset-4 decoration-white/20 hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Email us directly &rarr;
              </a>
            </p>
            </>
          )}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/4 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/20">
          <Link
            href="/"
            className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{ fontFamily: "'Gambetta', Georgia, serif" }}
          >
            <img src="/logo-icon.svg" alt="" width={40} height={40} className="shrink-0" />
            <span>
              Trade<span style={{ color: GOLD }}>flow</span>
            </span>
          </Link>
          <span>AI-powered lead generation for HVAC contractors</span>
          <span className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-white/60 hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-white/60 hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Terms
            </Link>
            <Link
              href="/login"
              className="text-white/60 hover:text-white transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Contractor login
            </Link>
          </span>
        </div>
      </footer>
    </div>
  )
}

/* ─── Subcomponents ─── */

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[12px] font-medium text-white/60 uppercase tracking-[0.08em]"
      >
        {label}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-[12px] text-red-400 mt-0.5">
          {error}
        </span>
      )}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/25',
    'bg-white/[0.03] transition-colors',
    'focus:outline-none focus:bg-white/[0.05] focus:ring-2 focus:ring-[#D4AF37]/50',
    hasError ? 'border border-red-400/40' : 'border border-white/10 hover:border-white/20',
  ].join(' ')
}

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SuccessCard({ onReset }: { onReset: () => void }) {
  return (
    <div
      className="rounded-2xl p-8 sm:p-10 text-center"
      style={{
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.25)',
        boxShadow: '0 0 60px rgba(212,175,55,0.06)',
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke={GOLD}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2
        className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3"
        style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}
      >
        You&apos;re on the list.
      </h2>
      <p className="text-white/50 text-[15px] leading-relaxed max-w-md mx-auto">
        Thanks for reaching out. A real person from Tradeflow will be in touch within one
        business day to walk through next steps and get your free trial set up.
      </p>
      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="text-[13px] text-white/60 hover:text-white/90 transition-colors py-3 px-5 rounded-xl border border-white/10 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          &larr; Back to home
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="text-[13px] text-white/60 hover:text-white/90 transition-colors py-3 px-5 rounded-xl border border-white/10 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Submit another response
        </button>
      </div>
    </div>
  )
}
