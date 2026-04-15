'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const GOLD = '#D4AF37'

interface FrameData {
  id: string
  badge: string
  title: string
  description: string
  image: string
  details: string[]
  side: 'left' | 'right'
  zOffset: number
}

const FRAMES: FrameData[] = [
  {
    id: 'lsa-ads',
    badge: 'Advertising',
    title: 'Google LSA Ads',
    description: 'We set up and fully manage Google Local Services Ads in your service area. You appear at the top of Google with a Verified badge — paying only for real leads, not clicks.',
    image: '/images/marketing/lsa-ads.svg',
    details: [
      'Google Guaranteed badge builds instant trust',
      'Pay per lead, not per click — no wasted spend',
      'We handle setup, optimization, and bid management',
      'Target specific zip codes across Chicagoland',
    ],
    side: 'left',
    zOffset: -900,
  },
  {
    id: 'textback',
    badge: 'Automation',
    title: '60-Second Text-Back',
    description: 'When a call is missed, an automated text goes out in under 60 seconds. Your lead hears from you before they call the next HVAC company on the list.',
    image: '/images/marketing/textback.svg',
    details: [
      'Instant response while you\'re on a job',
      'Custom message templates per service type',
      'Branded with your company name',
      'Converts missed calls into booked appointments',
    ],
    side: 'right',
    zOffset: -900,
  },
  {
    id: 'dashboard',
    badge: 'Dashboard',
    title: 'Live Lead Feed',
    description: 'Every form fill, call, and missed contact flows into your dashboard automatically. Name, phone, service type, status — updated in real time.',
    image: '/images/marketing/dashboard.svg',
    details: [
      'See every lead the moment it comes in',
      'Filter by status, source, and service type',
      'One-click call or text any lead',
      'Export data anytime — you own your leads',
    ],
    side: 'left',
    zOffset: -1700,
  },
  {
    id: 'sms',
    badge: 'Follow-Up',
    title: 'SMS Sequences',
    description: 'Multi-step text sequences go out over days or weeks, keeping your business top of mind. Custom messages for each HVAC service type.',
    image: '/images/marketing/sms.svg',
    details: [
      'Automated drip campaigns over days or weeks',
      'Different sequences for AC, heating, maintenance',
      'Smart timing — texts send at optimal hours',
      'Stop sequence automatically when lead converts',
    ],
    side: 'right',
    zOffset: -1700,
  },
  {
    id: 'tracking',
    badge: 'Analytics',
    title: 'Call Tracking',
    description: 'Every call tracked by campaign, source, and outcome. See duration, recordings, and conversion rate by zip code.',
    image: '/images/marketing/tracking.svg',
    details: [
      'Unique tracking numbers per campaign',
      'Call recordings for quality and training',
      'See which ads drive actual booked jobs',
      'Geographic performance by zip code',
    ],
    side: 'left',
    zOffset: -2500,
  },
  {
    id: 'landing',
    badge: 'Conversion',
    title: 'Landing Pages',
    description: 'High-converting pages for each service type — load in under 2 seconds on mobile. One clear CTA, local trust signals, form above the fold.',
    image: '/images/marketing/landing.svg',
    details: [
      'Sub-2-second load on mobile devices',
      'Custom pages per service (AC, furnace, etc.)',
      'Local reviews and trust badges built in',
      'A/B tested for maximum conversion',
    ],
    side: 'right',
    zOffset: -2500,
  },
]

// Ambient particles
function Particles() {
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() < 0.3 ? 1.5 : 1,
      opacity: 0.03 + Math.random() * 0.12,
      color: Math.random() < 0.4 ? GOLD : '#ffffff',
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
    }))
  ).current

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${p.color}, transparent)`,
            opacity: p.opacity,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// Art Frame with proximity-based visibility
function ArtFrame({
  frame,
  cameraZ,
  onClick,
}: {
  frame: FrameData
  cameraZ: number
  onClick: () => void
}) {
  const rotateY = frame.side === 'left' ? 35 : -35
  const xPos = frame.side === 'left' ? 'calc(50% - 300px)' : 'calc(50% + 40px)'

  // Calculate distance from camera to frame — frame becomes visible as camera approaches
  const distance = Math.abs(frame.zOffset + cameraZ)
  const maxVisible = 1400 // start fading in when this close
  const fullyVisible = 400 // fully opaque at this distance
  const frameOpacity =
    distance > maxVisible
      ? 0
      : distance < fullyVisible
        ? 1
        : 1 - (distance - fullyVisible) / (maxVisible - fullyVisible)

  // Scale up slightly as camera gets closer
  const proximityScale = distance < 800 ? 1 + (1 - distance / 800) * 0.05 : 1

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        width: 260,
        height: 380,
        top: '27%',
        left: xPos,
        transform: `translateZ(${frame.zOffset}px) rotateY(${rotateY}deg) scale(${proximityScale})`,
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'filter 0.4s ease, box-shadow 0.4s ease',
        boxShadow: '0 4px 60px rgba(0,0,0,0.9)',
        opacity: frameOpacity,
        pointerEvents: frameOpacity > 0.1 ? 'auto' : 'none',
      }}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={frameOpacity > 0.1 ? 0 : -1}
      aria-label={`View details: ${frame.title}`}
    >
      {/* Frame image */}
      <img
        src={frame.image}
        alt={frame.title}
        className="w-full h-full object-contain transition-all duration-500 opacity-[0.85] group-hover:opacity-100 group-hover:scale-[1.03]"
        draggable={false}
      />
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 40px rgba(212,175,55,0.12)',
          background: 'linear-gradient(to top, rgba(212,175,55,0.06), transparent)',
        }}
      />
    </div>
  )
}

// Detail Modal
function DetailModal({
  frame,
  onClose,
}: {
  frame: FrameData
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEsc)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(40px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl p-8 md:p-12"
        style={{
          background: 'rgba(9,9,11,0.95)',
          border: '1px solid rgba(63,63,70,0.6)',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Badge */}
        <div
          className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-6"
          style={{
            color: GOLD,
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          {frame.badge}
        </div>

        {/* Title */}
        <h2
          id="modal-title"
          className="text-3xl md:text-4xl font-semibold tracking-tight mb-4"
          style={{ fontFamily: "'Gambetta', Georgia, serif", letterSpacing: '-0.02em' }}
        >
          {frame.title}
        </h2>

        {/* Description */}
        <p className="text-white/45 text-[15px] leading-relaxed max-w-2xl mb-8">
          {frame.description}
        </p>

        {/* Two column layout: Image + Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <img
              src={frame.image}
              alt={frame.title}
              className="w-full h-auto"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <ul className="space-y-4">
              {frame.details.map((detail) => (
                <li key={detail} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
                    style={{
                      color: GOLD,
                      background: 'rgba(212,175,55,0.1)',
                      border: '1px solid rgba(212,175,55,0.2)',
                    }}
                  >
                    &#10003;
                  </span>
                  <span className="text-white/50 text-[14px] leading-relaxed">
                    {detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketingHomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [activeFrame, setActiveFrame] = useState<FrameData | null>(null)
  const [windowHeight, setWindowHeight] = useState(1000)
  const [mounted, setMounted] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    setWindowHeight(window.innerHeight)
    // Trigger entrance animation after a brief delay
    const timer = setTimeout(() => setMounted(true), 100)

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }

    const onResize = () => setWindowHeight(window.innerHeight)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Hallway occupies the first 500vh of scroll (more room for deeper frames)
  const hallwayScrollHeight = windowHeight * 5
  const hallwayProgress = Math.min(scrollY / hallwayScrollHeight, 1)
  const translateZ = hallwayProgress * 3500

  // Fade out hallway as it ends
  const hallwayOpacity = hallwayProgress > 0.85
    ? Math.max(0, 1 - (hallwayProgress - 0.85) / 0.15)
    : 1

  // Hero text fades and lifts as you start scrolling
  const heroOpacity = Math.max(0, 1 - hallwayProgress * 5)
  const heroTranslateY = hallwayProgress * -150

  // Scroll progress (gold bar)
  const totalScrollHeight =
    typeof document !== 'undefined'
      ? document.documentElement.scrollHeight - windowHeight
      : 1
  const scrollPercent = totalScrollHeight > 0 ? Math.min(scrollY / totalScrollHeight, 1) : 0

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'General Sans', system-ui, sans-serif" }}
    >
      {/* Animation keyframes */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-5px); }
          75% { transform: translateY(-30px) translateX(8px); }
        }
        @keyframes bounce-scroll {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(8px); opacity: 1; }
        }
      `}</style>

      {/* ─── SCROLL PROGRESS BAR ─── */}
      <div
        className="fixed top-0 left-0 h-[2px] z-[60]"
        style={{
          width: `${scrollPercent * 100}%`,
          background: `linear-gradient(to right, ${GOLD}, rgba(212,175,55,0.4))`,
          boxShadow: `0 0 10px rgba(212,175,55,0.3)`,
          transition: 'width 0.1s linear',
        }}
      />

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "'Gambetta', Georgia, serif" }}
          >
            Trade<span style={{ color: GOLD }}>flow</span>
          </span>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="hidden sm:inline text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hidden sm:inline text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              Sign in &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── 3D HALLWAY VIEWPORT ─── */}
      <div
        className="fixed inset-0 overflow-hidden"
        style={{
          perspective: 2400,
          perspectiveOrigin: '50% 50%',
          opacity: hallwayOpacity,
          pointerEvents: hallwayOpacity < 0.05 ? 'none' : 'auto',
          willChange: 'opacity',
        }}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 40%, #0d0d0d, #000)',
          }}
        />

        {/* Floor glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(212,175,55,0.025), transparent)',
          }}
        />

        {/* Ambient particles */}
        <Particles />

        {/* ─── HERO OVERLAY ─── */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{
            opacity: heroOpacity,
            transform: `translateY(${heroTranslateY}px)`,
            willChange: 'opacity, transform',
          }}
        >
          {/* Dark vignette behind hero text — prevents frame bleed-through */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 60% 55% at 50% 48%, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 80%)',
            }}
          />

          <div
            className="relative text-center px-6 max-w-3xl pointer-events-auto"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] px-4 py-1.5 rounded-full mb-8"
              style={{
                color: GOLD,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.18)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: GOLD }}
              />
              Built for Chicagoland HVAC
            </div>

            <h1
              className="text-[clamp(42px,7vw,76px)] font-semibold leading-[1.05] tracking-tight mb-5"
              style={{
                fontFamily: "'Gambetta', Georgia, serif",
                letterSpacing: '-0.03em',
              }}
            >
              Stop losing leads.
              <br />
              <span style={{ color: GOLD }}>Start closing jobs.</span>
            </h1>

            <p className="text-[clamp(15px,1.4vw,18px)] text-white/45 max-w-xl mx-auto leading-relaxed mb-10">
              Tradeflow captures every call, form, and missed contact &mdash; then
              follows up automatically so no lead is ever lost.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
              <a
                href="mailto:hello@tradeflow.io"
                className="inline-flex items-center gap-2 font-bold text-[15px] py-[14px] px-8 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: GOLD,
                  color: '#000',
                  boxShadow: '0 0 40px rgba(212,175,55,0.3)',
                }}
              >
                Get started &mdash; free trial &rarr;
              </a>
            </div>

            <p className="text-white/20 text-[12px] tracking-wide mb-12">
              2-week free trial &middot; $200 in ad spend on us &middot; No contracts
            </p>

            {/* Animated scroll indicator */}
            <div
              className="flex flex-col items-center gap-2"
              style={{ animation: 'bounce-scroll 2s ease-in-out infinite' }}
            >
              <span className="text-white/30 text-[11px] uppercase tracking-[0.2em]">
                Scroll to explore
              </span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 7l6 6 6-6" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* ─── HALLWAY TRACK ─── */}
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transform: `translateZ(${translateZ}px)`,
            willChange: 'transform',
          }}
        >
          {FRAMES.map((frame) => (
            <ArtFrame
              key={frame.id}
              frame={frame}
              cameraZ={translateZ}
              onClick={() => setActiveFrame(frame)}
            />
          ))}
        </div>

        {/* Center guide line */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 20%, rgba(212,175,55,0.04) 40%, rgba(212,175,55,0.04) 60%, transparent 80%)',
          }}
        />

        {/* Side vanishing-point lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(100deg, rgba(212,175,55,0.015) 0%, transparent 15%),
              linear-gradient(-100deg, rgba(212,175,55,0.015) 0%, transparent 15%)
            `,
          }}
        />
      </div>

      {/* ─── SCROLL SPACER for hallway ─── */}
      <div style={{ height: '520vh' }} />

      {/* ─── CONTENT AFTER HALLWAY ─── */}
      <div className="relative z-10 bg-black">
        {/* Stats */}
        <section className="border-y border-white/[0.04] py-10 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '< 60s', label: 'Lead response time' },
              { value: '40\u201360%', label: 'Leads lost without follow-up' },
              { value: '$25\u2013$55', label: 'Avg. LSA cost per lead' },
              { value: '100%', label: 'Exclusive leads \u2014 not shared' },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: GOLD }}
                >
                  {stat.value}
                </div>
                <div className="text-[12px] text-white/30 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pain Points */}
        <section id="features" className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                style={{
                  fontFamily: "'Gambetta', Georgia, serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Sound familiar?
              </h2>
              <p className="text-white/35 max-w-md mx-auto text-[15px]">
                Most HVAC companies lose 40&ndash;60% of inbound leads before
                they ever get called back.
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
                  className="rounded-2xl p-6 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="font-semibold text-white text-[15px] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/40 text-[13px] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-24" style={{ background: '#050505' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                style={{
                  fontFamily: "'Gambetta', Georgia, serif",
                  letterSpacing: '-0.02em',
                }}
              >
                How it works
              </h2>
              <p className="text-white/35 max-w-md mx-auto text-[15px]">
                We handle everything from ad click to booked job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: '01',
                  title: 'We run your ads',
                  desc: 'Google Local Services Ads \u2014 set up, optimized, and fully managed. You only pay for real leads.',
                },
                {
                  step: '02',
                  title: 'Every lead captured',
                  desc: 'Calls, forms, and missed contacts all flow into your dashboard. Nothing falls through the cracks.',
                },
                {
                  step: '03',
                  title: 'Automatic follow-up',
                  desc: 'A text goes out within 60 seconds of a missed call. Your lead hears from you first.',
                },
              ].map((item, i) => (
                <div key={item.step} className="relative">
                  {i < 2 && (
                    <div
                      className="hidden md:block absolute top-5 left-full w-full h-px"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(212,175,55,0.2), transparent)',
                      }}
                    />
                  )}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold mb-5"
                    style={{
                      color: GOLD,
                      background: 'rgba(212,175,55,0.08)',
                      border: '1px solid rgba(212,175,55,0.18)',
                    }}
                  >
                    {item.step}
                  </div>
                  <h3 className="text-[16px] font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/40 text-[13px] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-6 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <div
                className="inline-block text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-6"
                style={{
                  color: GOLD,
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.18)',
                }}
              >
                Pricing
              </div>
              <h2
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                style={{
                  fontFamily: "'Gambetta', Georgia, serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Simple, flat-rate pricing
              </h2>
              <p className="text-white/35 max-w-md mx-auto text-[15px]">
                No percentage cuts. No per-lead fees. One flat retainer covers
                everything.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {[
                {
                  name: 'Starter',
                  price: '$500',
                  desc: 'Get started with LSA ads and automated lead follow-up.',
                  features: [
                    'Google LSA setup & management',
                    '1 service landing page',
                    'Lead capture dashboard',
                    'Missed-call text-back',
                    'Email lead notifications',
                  ],
                  highlight: false,
                },
                {
                  name: 'Growth',
                  price: '$1,500',
                  desc: 'Full automation and call tracking for contractors ready to scale.',
                  features: [
                    'Everything in Starter',
                    'Up to 4 service landing pages',
                    'CallRail call tracking',
                    'SMS follow-up sequences',
                    'Monthly performance report',
                  ],
                  highlight: true,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-2xl p-8"
                  style={{
                    background: plan.highlight
                      ? 'rgba(212,175,55,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${plan.highlight ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: plan.highlight
                      ? '0 0 60px rgba(212,175,55,0.06)'
                      : 'none',
                  }}
                >
                  {plan.highlight && (
                    <div
                      className="inline-block text-[10px] font-semibold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full mb-4"
                      style={{
                        color: GOLD,
                        background: 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.2)',
                      }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div className="text-[11px] text-white/30 uppercase tracking-[0.15em] mb-2">
                    {plan.name}
                  </div>
                  <div className="text-5xl font-bold text-white mb-1">
                    {plan.price}
                    <span className="text-lg font-normal text-white/25">
                      /mo
                    </span>
                  </div>
                  <p className="text-white/35 text-[13px] mt-2 mb-6">
                    {plan.desc}
                  </p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2.5 text-[13px]"
                      >
                        <span
                          className="font-bold mt-0.5 shrink-0"
                          style={{ color: GOLD }}
                        >
                          &#10003;
                        </span>
                        <span className="text-white/50">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="mailto:hello@tradeflow.io"
                    className="block text-center font-bold py-3.5 px-6 rounded-xl text-[13px] transition-all"
                    style={{
                      background: plan.highlight
                        ? GOLD
                        : 'rgba(255,255,255,0.06)',
                      color: plan.highlight ? '#000' : 'rgba(255,255,255,0.6)',
                      border: plan.highlight
                        ? 'none'
                        : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: plan.highlight
                        ? '0 0 30px rgba(212,175,55,0.2)'
                        : 'none',
                    }}
                  >
                    Start free trial &rarr;
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative px-6 py-28 text-center overflow-hidden">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-125 h-75 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.05), transparent)',
            }}
          />
          <div className="relative max-w-xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
              style={{
                fontFamily: "'Gambetta', Georgia, serif",
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Ready to fill your schedule?
            </h2>
            <p className="text-white/40 text-[16px] leading-relaxed mb-10">
              We&apos;re onboarding a small number of HVAC contractors in
              Chicagoland right now. 2-week free trial, $200 in ad spend on us.
            </p>
            <a
              href="mailto:hello@tradeflow.io"
              className="inline-flex items-center gap-2 font-bold text-[15px] py-3.75 px-10 rounded-xl transition-all hover:scale-[1.02]"
              style={{
                background: GOLD,
                color: '#000',
                boxShadow: '0 0 50px rgba(212,175,55,0.3)',
              }}
            >
              Claim your free trial &rarr;
            </a>
            <p className="mt-5 text-white/20 text-[12px]">
              No credit card required
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/4 px-6 py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/20">
            <span
              className="font-semibold text-white/40"
              style={{ fontFamily: "'Gambetta', Georgia, serif" }}
            >
              Trade<span style={{ color: GOLD }}>flow</span>
            </span>
            <span>AI-powered lead generation for HVAC contractors</span>
            <Link
              href="/login"
              className="hover:text-white/40 transition-colors"
            >
              Contractor login
            </Link>
          </div>
        </footer>
      </div>

      {/* ─── DETAIL MODAL ─── */}
      {activeFrame && (
        <DetailModal
          frame={activeFrame}
          onClose={() => setActiveFrame(null)}
        />
      )}
    </div>
  )
}
