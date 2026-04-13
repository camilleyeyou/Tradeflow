import Link from 'next/link'

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-[#03101c] text-white font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#03101c]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            Trade<span className="text-[#0ccaff]">flow</span>
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-28 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#0ccaff]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#0ccaff]/10 border border-[#0ccaff]/20 text-[#0ccaff] text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-[#0ccaff] rounded-full animate-pulse" />
            Built for Chicagoland HVAC Contractors
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            Stop losing leads.
            <br />
            <span className="text-[#0ccaff]">Start closing jobs.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tradeflow captures every call, form, and missed contact — then follows
            up automatically so your phone keeps ringing while you focus on the work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:hello@tradeflow.io"
              className="relative group inline-flex items-center justify-center gap-2 bg-[#0ccaff] hover:bg-[#1fb9e6] text-[#03101c] font-bold py-4 px-8 rounded-lg text-base transition-all shadow-[0_0_30px_rgba(12,202,255,0.35)] hover:shadow-[0_0_40px_rgba(12,202,255,0.55)]"
            >
              Get started — free trial
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-8 rounded-lg text-base transition-all"
            >
              See how it works
            </a>
          </div>

          <p className="mt-6 text-white/30 text-sm">
            2-week free trial · $200 in ad spend on us · No contracts
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="px-6 py-10 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '< 60s', label: 'Lead response time' },
            { value: '40–60%', label: 'Leads lost without follow-up' },
            { value: '$25–$55', label: 'Avg. LSA cost per lead' },
            { value: '100%', label: 'Exclusive leads — not shared' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-bold text-[#0ccaff]">{stat.value}</div>
              <div className="text-sm text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sound familiar?</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Most HVAC companies lose 40–60% of inbound leads before they ever get called back.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              <div
                key={item.title}
                className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl p-6 backdrop-blur-sm transition-colors"
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-24 bg-[#021221]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Tradeflow works</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              We handle everything from ad click to booked job — you just show up to the work.
            </p>
          </div>

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
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[#0ccaff]/30 to-transparent -translate-y-px z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#0ccaff]/10 border border-[#0ccaff]/20 flex items-center justify-center text-[#0ccaff] font-bold text-sm mb-5">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything in one place</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              One platform that replaces 5 different tools most HVAC companies are paying for separately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '🎯', title: 'Google LSA Management', body: 'Verified ads that show at the very top of Google — above organic results.' },
              { icon: '📋', title: 'Lead Dashboard', body: 'Every lead with name, phone, service type, and status — updated in real time.' },
              { icon: '💬', title: 'Missed-Call Text-Back', body: 'Automatic SMS within 60 seconds of a missed call.' },
              { icon: '🔁', title: 'SMS Follow-Up Sequences', body: 'Multi-step texts that nurture leads who didn\'t book on first contact.' },
              { icon: '📞', title: 'Call Tracking', body: 'Know which campaign drove which call. Duration, outcomes, recordings.' },
              { icon: '📄', title: 'Landing Pages', body: 'High-converting pages built for AC repair, furnace, installation, maintenance.' },
            ].map((item) => (
              <div
                key={item.title}
                className="group bg-white/[0.03] hover:bg-[#0ccaff]/5 border border-white/10 hover:border-[#0ccaff]/20 rounded-2xl p-6 transition-all"
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white mb-1.5 text-sm">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-6 py-24 bg-[#021221]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, flat-rate pricing</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              No percentage cuts. No per-lead fees. A flat retainer so you know exactly what you're paying.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$500',
                description: 'Get started with LSA ads and automated lead follow-up.',
                features: [
                  'Google LSA setup & management',
                  '1 service landing page',
                  'Lead capture dashboard',
                  'Missed-call text-back',
                  'Email lead notifications',
                ],
                cta: 'Start free trial',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$1,500',
                description: 'Full automation and call tracking for contractors ready to scale.',
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
                className={`rounded-2xl p-8 border ${
                  plan.highlight
                    ? 'bg-[#0ccaff]/5 border-[#0ccaff]/30 shadow-[0_0_40px_rgba(12,202,255,0.08)]'
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-[#0ccaff]/10 text-[#0ccaff] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </div>
                )}
                <div className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-1">
                  {plan.name}
                </div>
                <div className="text-5xl font-extrabold text-white mb-1">
                  {plan.price}
                  <span className="text-xl font-normal text-white/40">/mo</span>
                </div>
                <p className="text-white/40 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span className="text-[#0ccaff] font-bold mt-0.5 shrink-0">✓</span>
                      <span className="text-white/60">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@tradeflow.io"
                  className={`block text-center font-semibold py-3 px-6 rounded-lg transition-all ${
                    plan.highlight
                      ? 'bg-[#0ccaff] hover:bg-[#1fb9e6] text-[#03101c] shadow-[0_0_20px_rgba(12,202,255,0.3)]'
                      : 'bg-white/10 hover:bg-white/15 text-white'
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
      <section className="px-6 py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#0ccaff]/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Ready to fill your schedule?
          </h2>
          <p className="text-white/50 mb-10 text-lg">
            We&apos;re onboarding a small number of HVAC contractors in Chicagoland right now.
            Get started with a 2-week free trial and $200 in ad spend on us.
          </p>
          <a
            href="mailto:hello@tradeflow.io"
            className="inline-flex items-center gap-2 bg-[#0ccaff] hover:bg-[#1fb9e6] text-[#03101c] font-bold py-4 px-10 rounded-lg text-lg transition-all shadow-[0_0_40px_rgba(12,202,255,0.4)] hover:shadow-[0_0_55px_rgba(12,202,255,0.55)]"
          >
            Claim your free trial →
          </a>
          <p className="mt-5 text-white/25 text-sm">No credit card required to start</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <span className="font-bold text-white/60 tracking-tight">
            Trade<span className="text-[#0ccaff]">flow</span>
          </span>
          <span>AI-powered lead generation for HVAC contractors in Chicagoland</span>
          <Link href="/login" className="hover:text-white/60 transition-colors">
            Contractor login
          </Link>
        </div>
      </footer>

    </div>
  )
}
