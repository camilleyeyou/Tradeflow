'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic-link'>('password')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

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
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Check your email for a magic link.')
      }
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '100px auto', padding: '0 16px' }}>
      <h1>Sign in to Tradeflow</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {mode === 'password' && (
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}
        <button type="submit">
          {mode === 'password' ? 'Sign in' : 'Send magic link'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === 'password' ? 'magic-link' : 'password')}
        style={{ marginTop: 8 }}
      >
        {mode === 'password' ? 'Admin? Use magic link instead' : 'Use email/password instead'}
      </button>
      {message && <p>{message}</p>}
    </main>
  )
}
