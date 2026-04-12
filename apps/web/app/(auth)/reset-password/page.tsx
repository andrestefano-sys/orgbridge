'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="py-4 text-center">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 9v4M12 17h.01" stroke="var(--ob-error)" strokeWidth="2" strokeLinecap="round" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--ob-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2
          className="mb-2 text-xl font-semibold"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Link inválido
        </h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Este link de redefinição é inválido ou expirou.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex h-10 items-center rounded-lg px-5 text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'var(--ob-navy)', color: '#FFFFFF' }}
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao redefinir senha.')
      return
    }

    router.push('/login?reset=1')
  }

  return (
    <div>
      <div className="mb-7">
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Nova senha
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Escolha uma senha segura com no mínimo 8 caracteres.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{
            background: 'var(--ob-error-bg)',
            border: '1px solid var(--ob-error-border)',
            color: 'var(--ob-error)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            Nova senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="ob-input pr-12"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/5"
              style={{ color: 'var(--ob-text-faint)' }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            Confirmar senha
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              className={`ob-input pr-12 ${confirm && confirm !== password ? 'error' : ''}`}
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-black/5"
              style={{ color: 'var(--ob-text-faint)' }}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {confirm && confirm !== password && (
            <p className="text-xs" style={{ color: 'var(--ob-error)' }}>
              As senhas não coincidem
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'var(--ob-navy)', color: '#FFFFFF' }}
        >
          {loading ? (
            <>
              <Spinner />
              Salvando...
            </>
          ) : (
            'Redefinir senha'
          )}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: 'var(--ob-border)', borderTopColor: 'var(--ob-amber)' }} />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
