import Link from 'next/link'

const GOLD = '#D4AF37'

export default function MarketingHomePage() {
  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'General Sans', system-ui, sans-serif" }}
    >
      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/4 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="" width={40} height={40} className="shrink-0" />
            <span
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "'Gambetta', Georgia, serif" }}
            >
              Trade<span style={{ color: GOLD }}>flow</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden sm:inline text-[13px] text-white/40 hover:text-white/70 transition-colors">
              How it works
            </a>
            <a href="#pricing" className="hidden sm:inline text-[13px] text-white/40 hover:text-white/70 transition-colors">
              Pricing
            </a>
            <Link href="/login" className="text-[13px] text-white/40 hover:text-white/70 transition-colors">
              Sign in &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, #0d0d0d, #000)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(212,175,55,0.02), transparent)' }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <div
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-8"
                style={{ color: GOLD, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
                Built for Chicagoland HVAC
              </div>

              <h1
                className="text-[clamp(36px,5.5vw,64px)] font-semibold leading-[1.08] tracking-tight mb-5"
                style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.03em' }}
              >
                Stop losing leads.
                <br />
                <span style={{ color: GOLD }}>Start closing jobs.</span>
              </h1>

              <p className="text-[clamp(15px,1.3vw,18px)] text-white/45 max-w-lg leading-relaxed mb-8">
                Tradeflow captures every call, form, and missed contact &mdash; then
                follows up automatically so no lead is ever lost.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <a
                  href="mailto:hello@tradeflow.io"
                  className="inline-flex items-center gap-2 font-bold text-[15px] py-3.5 px-8 rounded-xl transition-all hover:brightness-110"
                  style={{ background: GOLD, color: '#000', boxShadow: '0 0 40px rgba(212,175,55,0.25)' }}
                >
                  Get started &mdash; free trial &rarr;
                </a>
                <a href="#how-it-works" className="text-[13px] text-white/30 hover:text-white/50 transition-colors py-3.5 px-2">
                  See how it works &darr;
                </a>
              </div>

              <p className="mt-6 text-white/20 text-[12px] tracking-wide">
                2-week free trial &middot; $200 in ad spend on us &middot; No contracts
              </p>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative">
              <div
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.04), transparent)' }}
              />
              <img
                src="/images/marketing/dashboard.svg"
                alt="Tradeflow lead dashboard showing incoming leads with status, source, and service type"
                className="w-full h-auto rounded-xl relative"
                style={{ boxShadow: '0 8px 80px rgba(0,0,0,0.6)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-white/4 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '< 60s', label: 'Lead response time' },
            { value: '40\u201360%', label: 'Leads lost without follow-up' },
            { value: '$75', label: 'Per qualified lead' },
            { value: '100%', label: 'Exclusive leads \u2014 not shared' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: GOLD }}>{stat.value}</div>
              <div className="text-[12px] text-white/30 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PAIN POINTS ─── */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
              style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}
            >
              Sound familiar?
            </h2>
            <p className="text-white/35 max-w-md mx-auto text-[15px]">
              Most HVAC companies lose 40&ndash;60% of inbound leads before they ever get called back.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M8 4h4l3 7-3.5 2.5a16 16 0 007 7L21 17l7 3v4a2 2 0 01-2 2A18 18 0 018 8a2 2 0 012-2" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    <line x1="20" y1="4" x2="28" y2="12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                    <line x1="28" y1="4" x2="20" y2="12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                ),
                title: 'Missed calls go cold',
                body: "You're on a job, a call comes in, you miss it. By the time you call back \u2014 they've already booked someone else.",
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="12" stroke={GOLD} strokeWidth="1.5" opacity="0.4"/>
                    <path d="M16 8v8l5 3" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                  </svg>
                ),
                title: 'No time to follow up',
                body: 'Between installs and service calls, chasing leads feels impossible. Leads go stale and revenue disappears.',
              },
              {
                icon: (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <polyline points="4,24 10,18 16,20 22,12 28,14" stroke={GOLD} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                    <path d="M22 6h6v6" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
                  </svg>
                ),
                title: "Can't track what's working",
                body: 'You spend money on ads but have no idea which campaigns are driving calls, leads, or actual jobs.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white text-[15px] mb-2">{item.title}</h3>
                <p className="text-white/40 text-[13px] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE: GOOGLE LSA ─── */}
      <section className="px-6 py-24" style={{ background: '#050505' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="/images/marketing/google-lsa.svg"
              alt="Google search results showing your HVAC company at the top with Google Guaranteed badge"
              className="w-full h-auto rounded-xl"
              style={{ boxShadow: '0 8px 60px rgba(0,0,0,0.5)' }}
            />
          </div>
          <div>
            <GoldBadge>Advertising</GoldBadge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              Your company at the top of Google
            </h2>
            <p className="text-white/45 text-[15px] leading-relaxed mb-6">
              We set up and fully manage Google Local Services Ads in your service area.
              You appear at the very top of Google with a verified badge &mdash; above
              regular ads, above organic results. You only pay for real leads, not clicks.
            </p>
            <FeatureList items={[
              'Google Guaranteed badge builds instant trust',
              'Pay per lead, not per click \u2014 no wasted ad spend',
              'We handle setup, optimization, and bid management',
              'Target specific zip codes across Chicagoland',
            ]} />
          </div>
        </div>
      </section>

      {/* ─── FEATURE: TEXT-BACK ─── */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <GoldBadge>Automation</GoldBadge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              Missed call? They hear from you in 60 seconds
            </h2>
            <p className="text-white/45 text-[15px] leading-relaxed mb-6">
              When you miss a call, an automated text goes out before the customer
              has time to call your competitor. Your company name, a friendly message,
              and an easy way to reply &mdash; all automatic.
            </p>
            <FeatureList items={[
              'Text sent in under 60 seconds \u2014 automatically',
              'Custom messages branded with your company name',
              'Customer replies go straight to your phone',
              'Every response captured in your lead dashboard',
            ]} />
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <img
              src="/images/marketing/phone-textback.svg"
              alt="Phone showing missed call notification and automatic text-back response sent in 47 seconds"
              className="w-full max-w-[320px] h-auto"
              style={{ filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.5))' }}
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURE: SMS SEQUENCES ─── */}
      <section className="px-6 py-24" style={{ background: '#050505' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="/images/marketing/sms.svg"
              alt="SMS follow-up sequence showing automated messages over 7 days with open rates and conversion data"
              className="w-full h-auto rounded-xl"
              style={{ boxShadow: '0 8px 60px rgba(0,0,0,0.5)' }}
            />
          </div>
          <div>
            <GoldBadge>Follow-Up</GoldBadge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              Leads that don&apos;t book? We keep following up
            </h2>
            <p className="text-white/45 text-[15px] leading-relaxed mb-6">
              Multi-step text sequences go out over days, keeping your business
              top of mind. Different messages for AC repair, furnace installs,
              and maintenance &mdash; all on autopilot.
            </p>
            <FeatureList items={[
              'Automated sequences over days or weeks',
              'Different flows for each service type',
              'Stops automatically when a lead books',
              'Converts 25\u201335% of cold leads into jobs',
            ]} />
          </div>
        </div>
      </section>

      {/* ─── FEATURE: CALL TRACKING ─── */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <GoldBadge>Analytics</GoldBadge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              See exactly which ads drive booked jobs
            </h2>
            <p className="text-white/45 text-[15px] leading-relaxed mb-6">
              Every call is tracked by campaign, source, and outcome. See which
              ads are actually putting money in your pocket &mdash; not just generating clicks.
            </p>
            <FeatureList items={[
              'Unique tracking numbers per campaign',
              'Call recordings for quality and training',
              'See conversion rates by zip code',
              'Monthly performance reports delivered to you',
            ]} />
          </div>
          <div className="order-1 lg:order-2">
            <img
              src="/images/marketing/tracking.svg"
              alt="Call analytics dashboard showing 142 total calls, 67 booked, with weekly trend chart and source breakdown"
              className="w-full h-auto rounded-xl"
              style={{ boxShadow: '0 8px 60px rgba(0,0,0,0.5)' }}
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="px-6 py-24" style={{ background: '#050505' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <GoldBadge>Process</GoldBadge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 mt-6" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              How it works
            </h2>
            <p className="text-white/35 max-w-md mx-auto text-[15px]">
              We handle everything from ad click to booked job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'We run your ads', desc: 'Google Local Services Ads \u2014 set up, optimized, and fully managed. You only pay for real leads.' },
              { step: '02', title: 'Every lead captured', desc: 'Calls, forms, and missed contacts all flow into your dashboard. Nothing falls through the cracks.' },
              { step: '03', title: 'Automatic follow-up', desc: 'A text goes out within 60 seconds of a missed call. Your lead hears from you first.' },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px" style={{ background: 'linear-gradient(to right, rgba(212,175,55,0.2), transparent)' }} />
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

      {/* ─── PRICING ─── */}
      <section id="pricing" className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <GoldBadge>Pricing</GoldBadge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 mt-6" style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}>
              Choose how you want to grow
            </h2>
            <p className="text-white/35 max-w-md mx-auto text-[15px]">
              Flat monthly retainers or pay per lead &mdash; pick the model that fits your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$500',
                priceLabel: '/mo',
                desc: 'Get started with LSA ads and automated lead follow-up.',
                features: ['Google LSA setup & management', '1 service landing page', 'Lead capture dashboard', 'Missed-call text-back', 'Email lead notifications'],
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$1,500',
                priceLabel: '/mo',
                desc: 'Full automation and call tracking for contractors ready to scale.',
                features: ['Everything in Starter', 'Up to 4 service landing pages', 'CallRail call tracking', 'SMS follow-up sequences', 'Monthly performance report'],
                highlight: true,
              },
              {
                name: 'Pay Per Lead',
                price: '$75',
                priceLabel: '/lead',
                desc: 'No monthly commitment. Pay only when we deliver a qualified lead.',
                features: ['No retainer or setup fee', 'Exclusive leads \u2014 never shared', 'Only pay for verified contacts', 'Pause or cancel anytime', 'Dashboard access included'],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl p-7"
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
                  {plan.price}<span className="text-lg font-normal text-white/25">{plan.priceLabel}</span>
                </div>
                <p className="text-white/35 text-[13px] mt-2 mb-6">{plan.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                      <span className="font-bold mt-0.5 shrink-0" style={{ color: GOLD }}>&#10003;</span>
                      <span className="text-white/50">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@tradeflow.io"
                  className="block text-center font-bold py-3.5 px-6 rounded-xl text-[13px] transition-all hover:brightness-110"
                  style={{
                    background: plan.highlight ? GOLD : 'rgba(255,255,255,0.06)',
                    color: plan.highlight ? '#000' : 'rgba(255,255,255,0.6)',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: plan.highlight ? '0 0 30px rgba(212,175,55,0.2)' : 'none',
                  }}
                >
                  Start free trial &rarr;
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative px-6 py-28 text-center overflow-hidden" style={{ background: '#050505' }}>
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-125 h-75 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.06), transparent)' }}
        />
        <div className="relative max-w-xl mx-auto">
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em', lineHeight: 1.1 }}
          >
            Ready to fill your schedule?
          </h2>
          <p className="text-white/40 text-[16px] leading-relaxed mb-10">
            We&apos;re onboarding a small number of HVAC contractors in Chicagoland
            right now. 2-week free trial, $200 in ad spend on us.
          </p>
          <a
            href="mailto:hello@tradeflow.io"
            className="inline-flex items-center gap-2 font-bold text-[15px] py-3.75 px-10 rounded-xl transition-all hover:brightness-110"
            style={{ background: GOLD, color: '#000', boxShadow: '0 0 50px rgba(212,175,55,0.3)' }}
          >
            Claim your free trial &rarr;
          </a>
          <p className="mt-5 text-white/20 text-[12px]">No credit card required</p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/4 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/20">
          <span className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white" style={{ fontFamily: "'Gambetta', Georgia, serif" }}>
            <img src="/logo-icon.svg" alt="" width={40} height={40} className="shrink-0" />
            <span>Trade<span style={{ color: GOLD }}>flow</span></span>
          </span>
          <span>AI-powered lead generation for HVAC contractors</span>
          <Link href="/login" className="hover:text-white/40 transition-colors">Contractor login</Link>
        </div>
      </footer>
    </div>
  )
}

/* ─── Shared components ─── */

function GoldBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
      style={{ color: GOLD, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}
    >
      {children}
    </div>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[14px]">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
            style={{ color: GOLD, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            &#10003;
          </span>
          <span className="text-white/50 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}
