'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

/* ─── Constants ─────────────────────────────────────────────── */
const GOLD = '#D4AF37'
const SCROLL_VH = 600          // scroll-section height in vh
const MAX_Z = 3500             // total Z travel
const FRAME_Z = [0, -700, -1400, -2100, -2800]

/* ─── Types ──────────────────────────────────────────────────── */
interface FrameInfo {
  badge: string
  title: string
  tagline: string
  detail: string
  visual: React.ReactNode
}

/* ─── Frame Visuals ──────────────────────────────────────────── */
function LeadDashVisual() {
  const rows = [
    { name: 'Jane S.', svc: 'AC Repair', status: 'new', hot: true },
    { name: 'Mike R.', svc: 'Furnace', status: 'contacted', hot: false },
    { name: 'Amy L.', svc: 'Install', status: 'booked', hot: false },
  ]
  return (
    <div style={{ padding: '28px 22px' }}>
      <div style={{ color: GOLD, fontSize: 9, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>Live Feed</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, opacity: r.hot ? 1 : 0.45 + i * 0.15 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.hot ? GOLD : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{r.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{r.svc}</div>
          </div>
          <div style={{ fontSize: 9, padding: '3px 7px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em', background: r.hot ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)', color: r.hot ? GOLD : 'rgba(255,255,255,0.3)' }}>
            {r.status}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 22, padding: '14px 16px', background: 'rgba(212,175,55,0.06)', borderRadius: 8, border: `1px solid rgba(212,175,55,0.14)` }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 }}>3</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>New leads today</div>
      </div>
    </div>
  )
}

function LSAVisual() {
  return (
    <div style={{ padding: '30px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
        <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Google Verified</div>
      </div>
      <div style={{ height: 1, background: `rgba(212,175,55,0.12)`, marginBottom: 18 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Oak Park HVAC</div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
        {[1,2,3,4,5].map(s => <span key={s} style={{ color: GOLD, fontSize: 13 }}>★</span>)}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 5 }}>4.9 · 120+</span>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
        Licensed &amp; Insured<br/>Serving Oak Park, IL
      </div>
      <div style={{ marginTop: 22, padding: '10px 14px', background: 'rgba(212,175,55,0.08)', border: `1px solid rgba(212,175,55,0.18)`, borderRadius: 6, fontSize: 11, color: GOLD, textAlign: 'center', letterSpacing: '0.05em' }}>
        #1 Position · Fully Managed
      </div>
    </div>
  )
}

function TextBackVisual() {
  return (
    <div style={{ padding: '28px 22px' }}>
      <div style={{ color: GOLD, fontSize: 9, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 22 }}>Auto Response</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📞</div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '0 10px 10px 10px', padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          Missed call from (312) 555-0199
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'flex-end', marginBottom: 6 }}>
        <div style={{ background: `rgba(212,175,55,0.12)`, border: `1px solid rgba(212,175,55,0.2)`, borderRadius: '10px 0 10px 10px', padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.8)', maxWidth: '75%' }}>
          Hi! This is Oak Park HVAC — sorry we missed you. Still need AC help? We can be there today.
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 10, color: GOLD, marginBottom: 20 }}>Sent in 48 seconds ✓</div>
      <div style={{ padding: '10px 14px', background: 'rgba(212,175,55,0.06)', borderRadius: 6, border: `1px solid rgba(212,175,55,0.1)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Avg. response</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: GOLD }}>{'< 60s'}</span>
      </div>
    </div>
  )
}

function SMSVisual() {
  const msgs = [
    { delay: '0s', text: 'Still need furnace repair? We have same-day availability.', sent: true },
    { delay: '+2 days', text: "Here's a $50 off coupon for your first service call.", sent: true },
    { delay: '+5 days', text: 'Just checking in — furnace season is here. Ready to book?', sent: true },
  ]
  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ color: GOLD, fontSize: 9, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>Follow-Up Sequence</div>
      {msgs.map((m, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 5, textAlign: 'right' }}>{m.delay}</div>
          <div style={{ background: 'rgba(212,175,55,0.07)', border: `1px solid rgba(212,175,55,${0.1 + i * 0.04})`, borderRadius: 8, padding: '8px 12px', fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, opacity: 1 - i * 0.15 }}>
            {m.text}
          </div>
        </div>
      ))}
    </div>
  )
}

function CallTrackingVisual() {
  const stats = [
    { label: 'Calls tracked', value: '48', sub: 'this month' },
    { label: 'Booked', value: '31', sub: '64% conversion' },
    { label: 'Missed', value: '9', sub: 'all texted back' },
  ]
  return (
    <div style={{ padding: '28px 22px' }}>
      <div style={{ color: GOLD, fontSize: 9, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 22 }}>Call Intelligence</div>
      {stats.map((s, i) => (
        <div key={i} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: i === 0 ? '#fff' : i === 1 ? GOLD : 'rgba(255,255,255,0.5)' }}>{s.value}</span>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginTop: 2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

function LandingPageVisual() {
  return (
    <div style={{ padding: '22px 18px' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['#ff5f57','#febc2e','#28c840'].map((c,i) => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.6 }} />)}
        </div>
        <div style={{ padding: '14px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 6 }}>AC Repair in Oak Park</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Fast, licensed HVAC service</div>
          <div style={{ background: `rgba(212,175,55,0.15)`, border: `1px solid rgba(212,175,55,0.25)`, borderRadius: 4, padding: '7px 10px', fontSize: 10, color: GOLD, textAlign: 'center', marginBottom: 10 }}>
            Call Now: (708) 555-0100
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 4, padding: '10px' }}>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 6 }} />
            <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 10, width: '70%' }} />
            <div style={{ height: 22, background: `rgba(212,175,55,0.2)`, borderRadius: 4 }} />
          </div>
        </div>
      </div>
      <div style={{ fontSize: 9, color: GOLD, textAlign: 'center', letterSpacing: '0.1em' }}>Static · Sub-2s Load · Mobile-First</div>
    </div>
  )
}

/* ─── Frame Pairs Data ───────────────────────────────────────── */
const PAIRS: Array<{ left: FrameInfo; right: FrameInfo }> = [
  {
    left: {
      badge: 'Dashboard',
      title: 'Every Lead, Live',
      tagline: 'Real-time lead tracking',
      detail: 'Every form fill, call, and missed contact flows into your dashboard automatically. Name, phone, service type, and status — all in one place, updated in real time. Never lose track of a hot lead again.',
      visual: <LeadDashVisual />,
    },
    right: {
      badge: 'Advertising',
      title: 'Google LSA Ads',
      tagline: 'Top of search, verified',
      detail: 'We set up and fully manage Google Local Services Ads for your service area. You appear at the very top of Google results with a Verified badge — only paying for real, qualified leads, not clicks.',
      visual: <LSAVisual />,
    },
  },
  {
    left: {
      badge: 'Automation',
      title: '60-Second Text-Back',
      tagline: 'No lead goes cold',
      detail: "When a call is missed, an automated text goes out in under 60 seconds. Your lead hears from you before they call the next HVAC company on the list. One of the highest-ROI features in the platform.",
      visual: <TextBackVisual />,
    },
    right: {
      badge: 'Follow-Up',
      title: 'SMS Sequences',
      tagline: 'Nurture until they book',
      detail: 'Multi-step text sequences go out automatically over days or weeks, keeping your business top of mind. Includes offers, reminders, and seasonal nudges — all customized for HVAC.',
      visual: <SMSVisual />,
    },
  },
  {
    left: {
      badge: 'Analytics',
      title: 'Call Tracking',
      tagline: 'Know what drives revenue',
      detail: 'Every call is tracked by campaign, source, and outcome. See duration, recordings, and conversion rate. Know exactly which ad, page, or zip code is delivering the best ROI.',
      visual: <CallTrackingVisual />,
    },
    right: {
      badge: 'Conversion',
      title: 'Landing Pages',
      tagline: 'Built to convert, not impress',
      detail: 'Statically-generated pages for each service (AC repair, furnace, installation, maintenance) load in under 2 seconds on mobile. One clear CTA, local trust signals, form above the fold.',
      visual: <LandingPageVisual />,
    },
  },
  {
    left: {
      badge: 'Results',
      title: 'Exclusive Leads',
      tagline: 'Yours and yours alone',
      detail: "Unlike Angi or HomeAdvisor, every lead generated through Tradeflow belongs exclusively to you. No shared leads, no bidding wars, no competition from 5 other contractors for the same homeowner.",
      visual: (
        <div style={{ padding: '32px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1 }}>100%</div>
          <div style={{ fontSize: 11, color: GOLD, marginTop: 8, letterSpacing: '0.1em' }}>EXCLUSIVE LEADS</div>
          <div style={{ height: 1, background: `rgba(212,175,55,0.15)`, margin: '20px 0' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
            Not shared with Angi.<br/>Not sold to competitors.<br/>Only yours.
          </div>
        </div>
      ),
    },
    right: {
      badge: 'Pricing',
      title: 'Flat Monthly Rate',
      tagline: 'No surprises, no %',
      detail: 'A single flat retainer covers everything — ad management, landing pages, lead capture, follow-up automation, and your dashboard. No per-lead fees. No percentage of revenue. Just one predictable number.',
      visual: (
        <div style={{ padding: '28px 22px' }}>
          {[{ name: 'Starter', price: '$500' }, { name: 'Growth', price: '$1,500' }].map((p, i) => (
            <div key={i} style={{ marginBottom: 16, padding: '16px', background: i === 1 ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: 8, border: `1px solid ${i === 1 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.name}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: i === 1 ? GOLD : '#fff' }}>{p.price}<span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/mo</span></span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 }}>No per-lead fees · No contracts</div>
        </div>
      ),
    },
  },
  {
    left: {
      badge: 'Trial',
      title: 'Free 2-Week Trial',
      tagline: '$200 ad spend on us',
      detail: 'We cover $200 in Google LSA ad spend during your trial period so you can see real results before you pay a cent. No credit card required to start.',
      visual: (
        <div style={{ padding: '32px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>Limited Availability</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 20 }}>
            Chicagoland HVAC<br/>contractors only
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Oak Park', 'Berwyn', 'Evanston', 'Naperville'].map((city) => (
              <div key={city} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{city}, IL</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    right: {
      badge: 'Get Started',
      title: 'Fill Your Schedule',
      tagline: 'Jobs waiting for you',
      detail: "We're currently onboarding a small number of HVAC contractors in the Chicagoland area. Spots are limited to ensure each client gets dedicated attention. Reach out to claim your trial.",
      visual: (
        <div style={{ padding: '32px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 20, lineHeight: 1.5 }}>
            Ready to stop losing leads to the competition?
          </div>
          <a href="mailto:hello@tradeflow.io" style={{ display: 'block', padding: '12px', background: GOLD, borderRadius: 8, color: '#000', fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none', marginBottom: 12, boxShadow: `0 0 24px rgba(212,175,55,0.3)` }}>
            Claim Free Trial →
          </a>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: '0.08em' }}>
            NO CREDIT CARD REQUIRED
          </div>
        </div>
      ),
    },
  },
]

/* ─── ArtFrame ───────────────────────────────────────────────── */
function ArtFrame({ frame, side, zOffset, currentZ, onClick }: {
  frame: FrameInfo
  side: 'left' | 'right'
  zOffset: number
  currentZ: number
  onClick: () => void
}) {
  const distFromCamera = zOffset + currentZ  // positive = in front, negative = behind
  const isCurrent = Math.abs(distFromCamera) < 400

  const rotateY = side === 'left' ? 35 : -35
  const translateX = side === 'left' ? -310 : 310
  const blur = Math.max(0, Math.min(3, Math.abs(distFromCamera) / 600 - 0.3))

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '27%',
        left: '50%',
        width: 260,
        height: 380,
        cursor: 'pointer',
        transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${zOffset}px) rotateY(${rotateY}deg)`,
        transition: 'filter 0.4s ease, box-shadow 0.4s ease',
        filter: `brightness(${isCurrent ? 1 : 0.55}) blur(${blur}px)`,
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.04)',
        background: 'linear-gradient(135deg, #0d0d0d 0%, #050505 100%)',
        boxShadow: isCurrent
          ? `0 4px 60px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.12)`
          : `0 4px 60px rgba(0,0,0,0.9)`,
      }}
    >
      {/* Frame top bar */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: GOLD, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', padding: '3px 8px', borderRadius: 100 }}>
          {frame.badge}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>tap for details</div>
      </div>

      {/* Visual content */}
      <div style={{ flex: 1 }}>
        {frame.visual}
      </div>

      {/* Frame title bar */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{frame.title}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{frame.tagline}</div>
      </div>
    </div>
  )
}

/* ─── Modal ──────────────────────────────────────────────────── */
function Modal({ frame, onClose }: { frame: FrameInfo; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(40px)', padding: '24px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: 'rgba(10,10,10,0.95)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', boxShadow: `0 40px 120px rgba(0,0,0,0.8), 0 0 60px rgba(212,175,55,0.06)`, animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div style={{ padding: '28px 28px 20px' }}>
          <div style={{ display: 'inline-block', fontSize: 10, color: GOLD, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', padding: '4px 10px', borderRadius: 100, marginBottom: 16 }}>
            {frame.badge}
          </div>
          <h2 style={{ fontFamily: "'Gambetta', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            {frame.title}
          </h2>
          <p style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>{frame.tagline}</p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.15), transparent)' }} />

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, margin: 0 }}>
            {frame.detail}
          </p>
          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <a
              href="mailto:hello@tradeflow.io"
              style={{ flex: 1, padding: '12px', background: GOLD, color: '#000', fontSize: 13, fontWeight: 700, textAlign: 'center', borderRadius: 8, textDecoration: 'none', boxShadow: `0 0 30px rgba(212,175,55,0.25)` }}
            >
              Get started →
            </a>
            <button
              onClick={onClose}
              style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 13, borderRadius: 8, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Pricing Section ────────────────────────────────────────── */
function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '$500',
      description: 'Get started with LSA ads and automated lead follow-up.',
      features: ['Google LSA setup & management', '1 service landing page', 'Lead capture dashboard', 'Missed-call text-back', 'Email lead notifications'],
      highlight: false,
    },
    {
      name: 'Growth',
      price: '$1,500',
      description: 'Full automation and call tracking for contractors ready to scale.',
      features: ['Everything in Starter', 'Up to 4 service landing pages', 'CallRail call tracking', 'SMS follow-up sequences', 'Monthly performance report'],
      highlight: true,
    },
  ]

  return (
    <section style={{ padding: '120px 24px', background: '#000' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ display: 'inline-block', fontSize: 10, color: GOLD, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
            Pricing
          </div>
          <h2 style={{ fontFamily: "'Gambetta', Georgia, serif", fontSize: 40, fontWeight: 600, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Simple, flat-rate pricing
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
            No percentage cuts. No per-lead fees. One flat retainer covers everything.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{ background: plan.highlight ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${plan.highlight ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 16, padding: 32, boxShadow: plan.highlight ? `0 0 60px rgba(212,175,55,0.07)` : 'none' }}>
              {plan.highlight && (
                <div style={{ display: 'inline-block', fontSize: 10, color: GOLD, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', padding: '3px 10px', borderRadius: 100, marginBottom: 16 }}>
                  Most Popular
                </div>
              )}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>
                {plan.price}
                <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.3)' }}>/mo</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: '12px 0 24px' }}>{plan.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                    <span style={{ color: GOLD, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hello@tradeflow.io"
                style={{ display: 'block', padding: '13px', textAlign: 'center', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', background: plan.highlight ? GOLD : 'rgba(255,255,255,0.07)', color: plan.highlight ? '#000' : 'rgba(255,255,255,0.7)', boxShadow: plan.highlight ? `0 0 30px rgba(212,175,55,0.2)` : 'none', border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)' }}
              >
                Start free trial →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MarketingHomePage() {
  const [zPos, setZPos] = useState(0)
  const [heroOpacity, setHeroOpacity] = useState(1)
  const [modal, setModal] = useState<FrameInfo | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onScroll() {
      const section = sectionRef.current
      if (!section) return
      const scrolled = window.scrollY
      const maxScroll = section.offsetHeight - window.innerHeight
      const progress = Math.max(0, Math.min(1, scrolled / maxScroll))
      setZPos(progress * MAX_Z)
      setHeroOpacity(Math.max(0, 1 - progress * 6))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll progress 0–1
  const scrollPct = zPos / MAX_Z

  return (
    <div style={{ fontFamily: "'General Sans', system-ui, sans-serif", background: '#000', color: '#fff', overflowX: 'hidden' }}>

      {/* CSS keyframe for modal animation */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        ::-webkit-scrollbar { width: 4px; background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 4px; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <span style={{ fontFamily: "'Gambetta', Georgia, serif", fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', color: '#fff' }}>
            Trade<span style={{ color: GOLD }}>flow</span>
          </span>
          <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.2s' }}>
            Sign in →
          </Link>
        </div>
      </nav>

      {/* ── 3D Hallway Section ── */}
      <div ref={sectionRef} style={{ height: `${SCROLL_VH}vh`, position: 'relative' }}>

        {/* Sticky viewport */}
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

          {/* Ambient background */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0d0d, #000)', pointerEvents: 'none' }} />

          {/* Ambient particles */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `radial-gradient(1px 1px at 20% 30%, rgba(212,175,55,0.12) 0%, transparent 100%), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.06) 0%, transparent 100%), radial-gradient(1px 1px at 45% 80%, rgba(212,175,55,0.08) 0%, transparent 100%), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.05) 0%, transparent 100%)` }} />

          {/* Floor glow */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, background: 'linear-gradient(to top, rgba(212,175,55,0.025), transparent)', pointerEvents: 'none' }} />

          {/* Hero text (fades as you enter) */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', opacity: heroOpacity, pointerEvents: heroOpacity < 0.1 ? 'none' : 'auto', zIndex: 10 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)', color: GOLD, fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Built for Chicagoland HVAC
            </div>
            <h1 style={{ fontFamily: "'Gambetta', Georgia, serif", fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 600, color: '#fff', margin: '0 0 16px', lineHeight: 1.05, letterSpacing: '-0.03em', maxWidth: 800 }}>
              Stop losing leads.<br />
              <span style={{ color: GOLD }}>Start closing jobs.</span>
            </h1>
            <p style={{ fontSize: 'clamp(14px, 1.5vw, 18px)', color: 'rgba(255,255,255,0.45)', maxWidth: 520, lineHeight: 1.7, margin: '0 0 36px' }}>
              Tradeflow captures every call, form, and missed contact — then follows up automatically so no lead is ever lost.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
              <a href="mailto:hello@tradeflow.io" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: GOLD, color: '#000', fontWeight: 700, fontSize: 14, padding: '13px 28px', borderRadius: 10, textDecoration: 'none', boxShadow: `0 0 40px rgba(212,175,55,0.3)` }}>
                Get started — free trial →
              </a>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>↓ Scroll to explore</div>
            </div>
          </div>

          {/* 3D Perspective container */}
          <div style={{ position: 'absolute', inset: 0, perspective: '2400px', perspectiveOrigin: '50% 50%' }}>
            <div style={{ transformStyle: 'preserve-3d', transform: `translateZ(${zPos}px)`, width: '100%', height: '100%', position: 'relative' }}>
              {PAIRS.map((pair, i) => (
                <div key={i}>
                  <ArtFrame frame={pair.left} side="left" zOffset={FRAME_Z[i]} currentZ={zPos} onClick={() => setModal(pair.left)} />
                  <ArtFrame frame={pair.right} side="right" zOffset={FRAME_Z[i]} currentZ={zPos} onClick={() => setModal(pair.right)} />
                </div>
              ))}
            </div>
          </div>

          {/* Scroll progress bar */}
          <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 2, height: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{ width: '100%', height: `${scrollPct * 100}%`, background: GOLD, borderRadius: 2, transition: 'height 0.1s' }} />
          </div>

          {/* Section label */}
          <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', textTransform: 'uppercase', display: scrollPct > 0.05 ? 'block' : 'none' }}>
            {Math.round(scrollPct * PAIRS.length)} / {PAIRS.length} features
          </div>
        </div>
      </div>

      {/* ── Pricing Section ── */}
      <PricingSection />

      {/* ── Final CTA ── */}
      <section style={{ padding: '100px 24px', background: '#000', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: `radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.06), transparent)`, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 580, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontFamily: "'Gambetta', Georgia, serif", fontSize: 44, fontWeight: 600, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Ready to fill your schedule?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: '0 0 36px', lineHeight: 1.7 }}>
            We&apos;re onboarding a small number of HVAC contractors in Chicagoland right now. 2-week free trial, $200 in ad spend on us.
          </p>
          <a href="mailto:hello@tradeflow.io" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: GOLD, color: '#000', fontWeight: 700, fontSize: 15, padding: '15px 36px', borderRadius: 10, textDecoration: 'none', boxShadow: `0 0 50px rgba(212,175,55,0.3)` }}>
            Claim your free trial →
          </a>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>No credit card required</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, maxWidth: 1100, margin: '0 auto' }}>
        <span style={{ fontFamily: "'Gambetta', Georgia, serif", fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
          Trade<span style={{ color: GOLD }}>flow</span>
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>AI-powered lead generation for HVAC contractors in Chicagoland</span>
        <Link href="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>Contractor login</Link>
      </footer>

      {/* ── Modal ── */}
      {modal && <Modal frame={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
