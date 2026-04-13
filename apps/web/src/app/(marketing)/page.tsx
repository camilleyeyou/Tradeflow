import Link from 'next/link'

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Tradeflow</span>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-blue-900 text-white px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-blue-800 text-blue-200 text-sm font-medium px-3 py-1 rounded-full mb-6">
            Built for Chicagoland HVAC Contractors
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Stop losing leads.<br />Start closing jobs.
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Tradeflow captures every call, form, and missed contact — then follows
            up automatically so your phone keeps ringing while you focus on the work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@tradeflow.io"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
            >
              Get started — free trial
            </a>
            <a
              href="#how-it-works"
              className="bg-blue-800 hover:bg-blue-700 text-white font-medium py-4 px-8 rounded-lg text-lg transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 text-blue-300 text-sm">2-week free trial · $200 in ad spend on us · No contracts</p>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            Sound familiar?
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Most HVAC companies lose 40–60% of inbound leads before they ever get called back.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '📞',
                title: 'Missed calls go cold',
                body: "You're on a job, a call comes in, you miss it. By the time you call back — they've already booked someone else.",
              },
              {
                icon: '⏱️',
                title: 'No time to follow up',
                body: "Between installs and service calls, chasing down leads feels impossible. Leads go stale and revenue disappears.",
              },
              {
                icon: '📉',
                title: "Can't track what's working",
                body: 'You spend money on ads but have no idea which campaigns are driving calls, leads, or actual booked jobs.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            How Tradeflow works
          </h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            We handle everything from ad click to booked job — you just show up to the work.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'We run your Google LSA ads',
                body: 'We set up and manage Google Local Services Ads in your area. You only pay when a real lead comes in — not per click.',
              },
              {
                step: '02',
                title: 'Every lead is captured instantly',
                body: 'Form fills, calls, and missed calls all flow into your dashboard. Nothing falls through the cracks.',
              },
              {
                step: '03',
                title: 'Automatic follow-up goes out',
                body: 'A text goes out within 60 seconds of a missed call or new form. Your lead hears from you before they call the next guy.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-5xl font-bold text-blue-100 mb-4 select-none">{item.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
            Everything in one place
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Google LSA Management', body: 'Verified ads that show at the very top of Google — above organic results.' },
              { icon: '📋', title: 'Lead Dashboard', body: 'Every lead with name, phone, service type, and status — updated in real time.' },
              { icon: '💬', title: 'Missed-Call Text-Back', body: 'Automatic SMS within 60 seconds of a missed call. Never lose a hot lead again.' },
              { icon: '🔁', title: 'SMS Follow-Up Sequences', body: 'Multi-step text sequences that nurture leads who didn\'t book on the first contact.' },
              { icon: '📞', title: 'Call Tracking', body: 'Know exactly which campaign drove which call. Track duration, outcomes, and recordings.' },
              { icon: '📄', title: 'Landing Pages', body: 'High-converting pages built for each service — AC repair, furnace, installation, maintenance.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, flat-rate pricing
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            No percentage cuts. No per-lead fees. A flat retainer so you know exactly what you're paying.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$500',
                description: 'Perfect for getting started with LSA and automated follow-up.',
                features: [
                  'Google LSA setup & management',
                  '1 service landing page',
                  'Lead capture dashboard',
                  'Missed-call text-back',
                  'Email notifications',
                ],
                cta: 'Start free trial',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$1,500',
                description: 'For contractors ready to scale with full automation and call tracking.',
                features: [
                  'Everything in Starter',
                  'Up to 4 service landing pages',
                  'CallRail call tracking',
                  'SMS follow-up sequences',
                  'Monthly performance report',
                ],
                cta: 'Start free trial',
                highlight: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.highlight
                    ? 'border-blue-600 bg-blue-900 text-white'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="mb-1 text-sm font-semibold uppercase tracking-wide opacity-70">
                  {plan.name}
                </div>
                <div className="text-4xl font-bold mb-1">
                  {plan.price}
                  <span className="text-lg font-normal opacity-60">/mo</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-200' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 font-bold mt-0.5">✓</span>
                      <span className={plan.highlight ? 'text-blue-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@tradeflow.io"
                  className={`block text-center font-semibold py-3 px-6 rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-blue-900 hover:bg-blue-800 text-white'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 bg-blue-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to fill your schedule?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            We're onboarding a small number of HVAC contractors in Chicagoland right now.
            Get started with a 2-week free trial and $200 in ad spend on us.
          </p>
          <a
            href="mailto:hello@tradeflow.io"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-10 rounded-lg text-lg transition-colors"
          >
            Claim your free trial
          </a>
          <p className="mt-4 text-blue-300 text-sm">No credit card required to start</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-semibold text-gray-600">Tradeflow</span>
          <span>AI-powered lead generation for HVAC contractors in Chicagoland</span>
          <Link href="/login" className="hover:text-gray-600">
            Contractor login
          </Link>
        </div>
      </footer>
    </div>
  )
}
