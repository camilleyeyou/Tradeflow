import { ImageResponse } from 'next/og'

export const alt = 'Tradeflow — AI-powered lead generation for HVAC & plumbing companies'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050505',
          backgroundImage:
            'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(212,175,55,0.10), transparent)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontFamily: 'Georgia, serif',
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          <span style={{ color: '#ffffff' }}>Trade</span>
          <span style={{ color: '#D4AF37' }}>flow</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 34,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          AI-powered lead generation for HVAC & plumbing companies
        </div>
      </div>
    ),
    { ...size }
  )
}
