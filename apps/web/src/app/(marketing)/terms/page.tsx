import type { Metadata } from 'next'
import Link from 'next/link'

const GOLD = '#D4AF37'

export const metadata: Metadata = {
  title: 'Terms of Service | Tradeflow',
  description: 'The terms governing use of Tradeflow-managed landing pages and services.',
}

export default function TermsOfServicePage() {
  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'General Sans', system-ui, sans-serif" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-10 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          &larr; Back to Tradeflow
        </Link>

        <h1
          className="text-3xl md:text-4xl font-semibold tracking-tight mb-2"
          style={{ fontFamily: "'Gambetta', Georgia, serif" }}
        >
          Terms of Service
        </h1>
        <p className="text-sm text-white/40 mb-10">Last updated: 2026-07-06</p>

        <div className="space-y-8 text-[15px] leading-7 text-white/70">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Service description</h2>
            <p>
              Tradeflow (&quot;Tradeflow,&quot; &quot;we,&quot; &quot;us&quot;) provides
              managed lead-generation infrastructure — landing pages, ad management,
              missed-call text-back, and SMS/email follow-up — to home service businesses
              (&quot;Clients&quot;) and, in doing so, communicates with homeowners
              (&quot;Users&quot;) who request service through those channels.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Acceptable use</h2>
            <p>
              You agree not to submit false contact information, use automated tools to
              submit forms, attempt to interfere with the operation of our landing pages or
              APIs, or use our services for any unlawful purpose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. Communications</h2>
            <p>
              Submitting a lead form or calling a tracked number constitutes a request to be
              contacted by the relevant Client and/or Tradeflow, by phone, text, or email,
              regarding that request, subject to our{' '}
              <Link href="/privacy" className="underline decoration-white/20 hover:text-white transition-colors" style={{ color: GOLD }}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. No guarantee of results</h2>
            <p>
              Tradeflow provides lead-generation infrastructure but does not guarantee any
              specific volume of leads, conversion rate, appointment outcome, or business
              result. Service quality, pricing, and scheduling for any home service work are
              solely the responsibility of the independent Client contractor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Tradeflow and its officers, employees,
              and processors are not liable for any indirect, incidental, or consequential
              damages arising from use of our services, including damages related to missed
              calls, delayed follow-up, or the acts or omissions of any Client contractor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Billing (Clients)</h2>
            <p>
              Contractor Clients are billed on a recurring monthly retainer basis via Stripe.
              Subscriptions renew automatically until cancelled; failure to pay may result in
              suspension of ad management and landing-page services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Illinois, without regard
              to its conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Contact us</h2>
            <p>
              Questions about these terms? Email{' '}
              <a
                href="mailto:hello@tradeflow-technologies.com"
                className="underline decoration-white/20 hover:text-white transition-colors"
                style={{ color: GOLD }}
              >
                hello@tradeflow-technologies.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
