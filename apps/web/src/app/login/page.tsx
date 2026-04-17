'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GOLD = '#D4AF37'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d0d0d, #000)' }}
    >
      <div
        className="fixed bottom-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(212,175,55,0.02), transparent)' }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <img src="/logo-icon.svg" alt="" width={48} height={48} />
            <h1
              className="text-2xl font-semibold tracking-tight text-white"
              style={{ fontFamily: "'Gambetta', Georgia, serif" }}
            >
              Trade<span style={{ color: GOLD }}>flow</span>
            </h1>
          </Link>
          <p className="text-sm text-white/35 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 8px 60px rgba(0,0,0,0.5)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/60 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-white/20 transition-all outline-none focus:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(212,175,55,0.4)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/60 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-white/20 transition-all outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(212,175,55,0.4)'
                  e.target.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-2.5 px-4 rounded-lg text-sm transition-all disabled:opacity-50 hover:brightness-110 cursor-pointer"
              style={{
                background: GOLD,
                color: '#000',
                boxShadow: '0 0 30px rgba(212,175,55,0.2)',
              }}
            >
              {loading ? 'Signing in\u2026' : 'Sign in'}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-center text-red-400">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
