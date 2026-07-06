import type { Metadata } from 'next'
import Link from 'next/link'

const GOLD = '#D4AF37'

export const metadata: Metadata = {
  title: 'Privacy Policy | Tradeflow',
  description:
    'How Tradeflow collects, uses, and protects information from homeowners and HVAC contractor clients.',
}

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-white/40 mb-10">Last updated: 2026-07-06</p>

        <div className="space-y-8 text-[15px] leading-7 text-white/70">
          <section>
            <h2 className="text-lg font-semibold text-white mb-2">1. Who we are</h2>
            <p>
              Tradeflow (&quot;Tradeflow,&quot; &quot;we,&quot; &quot;us&quot;) provides
              managed lead-generation and follow-up services for home service businesses,
              including landing pages, missed-call text-back, and SMS follow-up, on behalf
              of the local contractor you are contacting (the &quot;Client&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">2. Information we collect</h2>
            <p>When you submit a form or call a number shown on one of our landing pages, we collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your name and phone number</li>
              <li>The service you requested and your ZIP code</li>
              <li>Call metadata (time, duration, recording) when you call a tracked number</li>
              <li>Basic device/browser information for security and analytics purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">3. How we use your information</h2>
            <p>We use the information you provide to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Connect you with the local contractor you requested service from</li>
              <li>
                Contact you by phone or text — including automated texts — about your service
                request, appointment status, and follow-up
              </li>
              <li>Improve our lead-routing and follow-up systems</li>
              <li>Meet legal, billing, and record-keeping obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">4. SMS &amp; call consent</h2>
            <p>
              By submitting a form or calling a tracked number on a Tradeflow-managed landing
              page, you consent to receive calls and text messages, including automated and
              informational messages, from the Client and/or Tradeflow related to your service
              request. Message and data rates may apply. Message frequency varies. Reply{' '}
              <strong>STOP</strong> to any text to opt out at any time, or reply{' '}
              <strong>HELP</strong> for assistance. Consent to receive texts is not a condition
              of purchasing any service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">5. Who we share information with</h2>
            <p>
              We share your information only as needed to provide the service you requested,
              with processors including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>GoHighLevel — contact management and SMS/call automation</li>
              <li>CallRail — call tracking, recording, and transcription</li>
              <li>Stripe — billing for our contractor clients (does not process homeowner payments)</li>
              <li>Resend — transactional email notifications to the contractor</li>
              <li>Supabase — secure database hosting</li>
            </ul>
            <p className="mt-2">We do not sell your personal information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">6. Data retention &amp; security</h2>
            <p>
              We retain lead and call records for as long as reasonably necessary to support
              the Client&apos;s service and our legal obligations, and we apply industry-standard
              safeguards including encrypted storage and row-level access controls that isolate
              each Client&apos;s data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">7. Your choices</h2>
            <p>
              You may opt out of texts at any time by replying STOP, and you may request
              deletion or a copy of your information by contacting us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">8. Contact us</h2>
            <p>
              Questions about this policy? Email{' '}
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
