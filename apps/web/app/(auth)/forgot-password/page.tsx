'use client'

import { useState } from 'react'
import Link from 'next/link'

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="py-4 text-center animate-fade-in">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(233,160,16,0.12)', border: '1px solid rgba(233,160,16,0.3)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="var(--ob-amber)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2
          className="mb-2 text-xl font-semibold"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          E-mail enviado
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>
          Se o endereço <strong style={{ color: 'var(--ob-text)' }}>{email}</strong> estiver
          cadastrado, você receberá as instruções em instantes. Verifique também a caixa de spam.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--ob-amber-dim)' }}
        >
          ← Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-7">
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Recuperar senha
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="ob-input"
            placeholder="seu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'var(--ob-navy)', color: '#FFFFFF' }}
        >
          {loading ? (
            <>
              <Spinner />
              Enviando...
            </>
          ) : (
            'Enviar link de recuperação'
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--ob-text-muted)' }}>
        Lembrou a senha?{' '}
        <Link
          href="/login"
          className="font-medium hover:underline underline-offset-2"
          style={{ color: 'var(--ob-amber-dim)' }}
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
