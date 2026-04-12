'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service when available
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div
      className="min-h-svh flex items-center justify-center px-5"
      style={{ background: 'var(--ob-surface-alt)' }}
    >
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        {/* Icon */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl mb-6"
          style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#DC2626"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Algo deu errado
        </h1>
        <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        {error.digest && (
          <p className="text-xs mb-6 font-mono" style={{ color: 'var(--ob-text-faint)' }}>
            Ref: {error.digest}
          </p>
        )}
        {!error.digest && <div className="mb-6" />}

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--ob-navy)', color: '#fff', fontFamily: 'var(--font-sora)' }}
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-70"
            style={{
              background: 'var(--ob-surface)',
              border: '1px solid var(--ob-border)',
              color: 'var(--ob-text-muted)',
            }}
          >
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  )
}
