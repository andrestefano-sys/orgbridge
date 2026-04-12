'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

const GOOGLE_CONFIGURED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'

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

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao criar conta.')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="py-4 text-center animate-fade-in">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--ob-success-bg)', border: '1px solid var(--ob-success-border)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4L19 7" stroke="var(--ob-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2
          className="mb-2 text-xl font-semibold"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Verifique seu e-mail
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>
          Enviamos um link de confirmação para{' '}
          <strong style={{ color: 'var(--ob-text)' }}>{email}</strong>.{' '}
          Acesse seu e-mail para ativar sua conta.
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
      {/* Header */}
      <div className="mb-7">
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Criar conta grátis
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Já tem conta?{' '}
          <Link
            href="/login"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: 'var(--ob-amber-dim)' }}
          >
            Entrar
          </Link>
        </p>
      </div>

      {/* Google OAuth */}
      {GOOGLE_CONFIGURED && (
        <>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 rounded-xl px-4 text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.99]"
            style={{
              height: 48,
              border: '1.5px solid var(--ob-border)',
              color: 'var(--ob-text)',
              background: 'var(--ob-surface)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--ob-border)' }} />
            <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--ob-border)' }} />
          </div>
        </>
      )}

      {/* Error */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            className="ob-input"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
            maxLength={100}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            E-mail corporativo
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
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            Senha
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
              autoComplete="new-password"
              minLength={8}
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
          <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
            Mínimo de 8 caracteres
          </p>
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
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </button>

        <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--ob-text-faint)' }}>
          Ao criar uma conta, você concorda com os{' '}
          <Link href="/terms" className="underline-offset-2 hover:underline" style={{ color: 'var(--ob-text-muted)' }}>
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link href="/privacy" className="underline-offset-2 hover:underline" style={{ color: 'var(--ob-text-muted)' }}>
            Política de Privacidade
          </Link>
          .
        </p>
      </form>
    </div>
  )
}
