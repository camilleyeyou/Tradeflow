'use client'

import { useEffect } from 'react'
import './globals.css'

const GOLD = '#D4AF37'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white px-6 flex items-center justify-center antialiased">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-white/60 text-sm mb-8">
            An unexpected error occurred. You can try again, or come back later.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 font-bold text-[15px] py-3.5 px-8 rounded-xl transition-all hover:brightness-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{ background: GOLD, color: '#000' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
