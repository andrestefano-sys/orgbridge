'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao fazer login.')
      return
    }

    router.push(next)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="3" r="2.5" fill="#E9A010" />
              <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.5)" />
              <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.5)" />
              <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.4)" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.4)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>OrgBridge Admin</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Acesso restrito a administradores</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 28 }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }}
              placeholder="admin@orgbridge.net"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#E9A010', color: '#0D1929', padding: '11px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </svg>
            ) : null}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#475569' }}>
          OrgBridge Admin · Acesso monitorado e registrado
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
