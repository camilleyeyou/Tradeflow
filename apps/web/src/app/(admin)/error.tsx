'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin panel error</h1>
        <div
          className="rounded-xl p-6 space-y-4"
          style={{
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <div>
            <p className="text-red-400 text-sm font-semibold mb-1">Error message</p>
            <p className="text-white/80 text-sm font-mono break-words">
              {error.message || 'Unknown error'}
            </p>
          </div>
          {error.digest && (
            <div>
              <p className="text-red-400 text-sm font-semibold mb-1">Digest</p>
              <p className="text-white/60 text-xs font-mono">{error.digest}</p>
            </div>
          )}
          <div>
            <p className="text-red-400 text-sm font-semibold mb-1">Common causes</p>
            <ul className="text-white/60 text-sm list-disc pl-5 space-y-1">
              <li>Missing env vars: <code className="text-white/80">SUPABASE_SERVICE_ROLE_KEY</code>, <code className="text-white/80">NEXT_PUBLIC_SUPABASE_URL</code></li>
              <li>Required tables (<code className="text-white/80">clients</code>, <code className="text-white/80">client_users</code>) do not exist in Supabase</li>
              <li>Service role key lacks permission to read the <code className="text-white/80">clients</code> table</li>
            </ul>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Retry
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
