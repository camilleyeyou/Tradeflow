'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic-link'>('password')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` },
      })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email for a magic link.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#03101c] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Trade<span className="text-[#0ccaff]">flow</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white/8 border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#0ccaff]/50 focus:border-[#0ccaff]/50 transition-all"
                placeholder="you@example.com"
              />
            </div>

            {mode === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white/8 border border-white/10 rounded-lg text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-[#0ccaff]/50 focus:border-[#0ccaff]/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0ccaff] hover:bg-[#1fb9e6] disabled:opacity-50 text-[#03101c] font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-[0_0_20px_rgba(12,202,255,0.25)] hover:shadow-[0_0_28px_rgba(12,202,255,0.4)]"
            >
              {loading ? 'Signing in…' : mode === 'password' ? 'Sign in' : 'Send magic link'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'password' ? 'magic-link' : 'password')}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              {mode === 'password' ? 'Admin? Use magic link instead' : 'Use email/password instead'}
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-sm text-center ${message.includes('Check') ? 'text-[#0ccaff]' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
