import Link from 'next/link'

const GOLD = '#D4AF37'

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'General Sans', system-ui, sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: "'Gambetta', Georgia, serif" }}>
            Trade<span style={{ color: GOLD }}>flow</span>
          </span>
          <div className="flex items-center gap-6">
            <a href="#pricing" className="hidden sm:inline text-[13px] text-white/40 hover:text-white/70 transition-colors">Pricing</a>
            <Link href="/login" className="text-[13px] text-white/40 hover:text-white/70 transition-colors">
              Sign in →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-36 pb-32 px-6 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 35%, #0d0d0d, #000)' }} />
        {/* Floor glow */}
        <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{ background: `linear-gradient(to top, rgba(212,175,55,0.025), transparent)` }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-8"
            style={{ color: GOLD, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
            Built for Chicagoland HVAC
          </div>

          <h1
            className="text-[clamp(42px,7vw,76px)] font-semibold leading-[1.05] tracking-tight mb-5"
            style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.03em' }}
          >
            Stop losing leads.
            <br />
            <span style={{ color: GOLD }}>Start closing jobs.</span>
          </h1>

          <p className="text-[clamp(15px,1.4vw,18px)] text-white/45 max-w-xl mx-auto leading-relaxed mb-10">
            Tradeflow captures every call, form, and missed contact — then follows
            up automatically so no lead is ever lost.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="mailto:hello@tradeflow.io"
              className="inline-flex items-center gap-2 font-bold text-[15px] py-[14px] px-8 rounded-xl transition-all"
              style={{ background: GOLD, color: '#000', boxShadow: `0 0 40px rgba(212,175,55,0.3)` }}
            >
              Get started — free trial →
            </a>
            <a href="#features" className="text-[13px] text-white/30 hover:text-white/50 transition-colors">
              ↓ See how it works
            </a>
          </div>

          <p className="mt-7 text-white/20 text-[12px] tracking-wide">
            2-week free trial · $200 in ad spend on us · No contracts
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/[0.04] py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '< 60s', label: 'Lead response time' },
            { value: '40–60%', label: 'Leads lost without follow-up' },
            { value: '$25–$55', label: 'Avg. LSA cost per lead' },
            { value: '100%', label: 'Exclusive leads — not shared' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: GOLD }}>{stat.value}</div>
              <div className="text-[12px] text-white/30 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              Sound familiar?
            </h2>
            <p className="text-white/35 max-w-md mx-auto text-[15px]">
              Most HVAC companies lose 40–60% of inbound leads before they ever get called back.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: '📞', title: 'Missed calls go cold', body: "You're on a job, a call comes in, you miss it. By the time you call back — they've already booked someone else." },
              { icon: '⏱️', title: 'No time to follow up', body: "Between installs and service calls, chasing leads feels impossible. Leads go stale and revenue disappears." },
              { icon: '📉', title: "Can't track what's working", body: 'You spend money on ads but have no idea which campaigns are driving calls, leads, or actual jobs.' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6 transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white text-[15px] mb-2">{item.title}</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-24" style={{ background: '#050505' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div
              className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-6"
              style={{ color: GOLD, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
            >
              Platform
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-white/35 max-w-lg mx-auto text-[15px] leading-relaxed">
              One platform replaces 5 different tools most HVAC companies are paying for separately.
            </p>
          </div>

          {/* Feature blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                badge: 'Advertising',
                title: 'Google LSA Ads',
                desc: 'We set up and fully manage Google Local Services Ads in your service area. You appear at the top of Google with a Verified badge — paying only for real leads, not clicks.',
                highlight: true,
              },
              {
                badge: 'Automation',
                title: '60-Second Text-Back',
                desc: 'When a call is missed, an automated text goes out in under 60 seconds. Your lead hears from you before they call the next HVAC company on the list.',
                highlight: true,
              },
              {
                badge: 'Dashboard',
                title: 'Live Lead Feed',
                desc: 'Every form fill, call, and missed contact flows into your dashboard automatically. Name, phone, service type, status — updated in real time.',
                highlight: false,
              },
              {
                badge: 'Follow-Up',
                title: 'SMS Sequences',
                desc: 'Multi-step text sequences go out over days or weeks, keeping your business top of mind. Custom messages for each HVAC service type.',
                highlight: false,
              },
              {
                badge: 'Analytics',
                title: 'Call Tracking',
                desc: 'Every call tracked by campaign, source, and outcome. See duration, recordings, and conversion rate by zip code.',
                highlight: false,
              },
              {
                badge: 'Conversion',
                title: 'Landing Pages',
                desc: 'High-converting pages for each service type — load in under 2 seconds on mobile. One clear CTA, local trust signals, form above the fold.',
                highlight: false,
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-7 transition-all"
                style={{
                  background: f.highlight ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${f.highlight ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: f.highlight ? '0 0 50px rgba(212,175,55,0.04)' : 'none',
                }}
              >
                <div
                  className="inline-block text-[10px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full mb-4"
                  style={{ color: GOLD, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
                >
                  {f.badge}
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              How it works
            </h2>
            <p className="text-white/35 max-w-md mx-auto text-[15px]">
              We handle everything from ad click to booked job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'We run your ads', desc: 'Google Local Services Ads — set up, optimized, and fully managed. You only pay for real leads.' },
              { step: '02', title: 'Every lead captured', desc: 'Calls, forms, and missed contacts all flow into your dashboard. Nothing falls through the cracks.' },
              { step: '03', title: 'Automatic follow-up', desc: "A text goes out within 60 seconds of a missed call. Your lead hears from you first." },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px" style={{ background: `linear-gradient(to right, rgba(212,175,55,0.2), transparent)` }} />
                )}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold mb-5"
                  style={{ color: GOLD, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
                >
                  {item.step}
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-24" style={{ background: '#050505' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-6"
              style={{ color: GOLD, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
            >
              Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              Simple, flat-rate pricing
            </h2>
            <p className="text-white/35 max-w-md mx-auto text-[15px]">
              No percentage cuts. No per-lead fees. One flat retainer covers everything.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$500',
                desc: 'Get started with LSA ads and automated lead follow-up.',
                features: ['Google LSA setup & management', '1 service landing page', 'Lead capture dashboard', 'Missed-call text-back', 'Email lead notifications'],
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$1,500',
                desc: 'Full automation and call tracking for contractors ready to scale.',
                features: ['Everything in Starter', 'Up to 4 service landing pages', 'CallRail call tracking', 'SMS follow-up sequences', 'Monthly performance report'],
                highlight: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-8"
                style={{
                  background: plan.highlight ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${plan.highlight ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: plan.highlight ? '0 0 60px rgba(212,175,55,0.06)' : 'none',
                }}
              >
                {plan.highlight && (
                  <div
                    className="inline-block text-[10px] font-semibold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full mb-4"
                    style={{ color: GOLD, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                  >
                    Most Popular
                  </div>
                )}
                <div className="text-[11px] text-white/30 uppercase tracking-[0.15em] mb-2">{plan.name}</div>
                <div className="text-5xl font-bold text-white mb-1">
                  {plan.price}
                  <span className="text-lg font-normal text-white/25">/mo</span>
                </div>
                <p className="text-white/35 text-[13px] mt-2 mb-6">{plan.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold mt-0.5 shrink-0" style={{ color: GOLD }}>✓</span>
                      <span className="text-white/50">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@tradeflow.io"
                  className="block text-center font-bold py-3.5 px-6 rounded-xl text-[13px] transition-all"
                  style={{
                    background: plan.highlight ? GOLD : 'rgba(255,255,255,0.06)',
                    color: plan.highlight ? '#000' : 'rgba(255,255,255,0.6)',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: plan.highlight ? '0 0 30px rgba(212,175,55,0.2)' : 'none',
                  }}
                >
                  Start free trial →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-6 py-28 text-center overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.05), transparent)` }} />
        <div className="relative max-w-xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Ready to fill your schedule?
          </h2>
          <p className="text-white/40 text-[16px] leading-relaxed mb-10">
            We&apos;re onboarding a small number of HVAC contractors in Chicagoland right now. 2-week free trial, $200 in ad spend on us.
          </p>
          <a
            href="mailto:hello@tradeflow.io"
            className="inline-flex items-center gap-2 font-bold text-[15px] py-[15px] px-10 rounded-xl transition-all"
            style={{ background: GOLD, color: '#000', boxShadow: `0 0 50px rgba(212,175,55,0.3)` }}
          >
            Claim your free trial →
          </a>
          <p className="mt-5 text-white/20 text-[12px]">No credit card required</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.04] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/20">
          <span className="font-semibold text-white/40" style={{ fontFamily: "'Gambetta', Georgia, serif" }}>
            Trade<span style={{ color: GOLD }}>flow</span>
          </span>
          <span>AI-powered lead generation for HVAC contractors</span>
          <Link href="/login" className="hover:text-white/40 transition-colors">Contractor login</Link>
        </div>
      </footer>
    </div>
  )
}
