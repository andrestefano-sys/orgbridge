'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-5 py-16">
      {/* Icon */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl mb-5"
        style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
      >
        <svg
          width="26"
          height="26"
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

      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
      >
        Erro ao carregar esta página
      </h2>
      <p className="text-sm mb-1 max-w-xs leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>
        Algo inesperado aconteceu. Tente novamente ou volte ao início.
      </p>
      {error.digest && (
        <p className="text-xs mb-5 font-mono" style={{ color: 'var(--ob-text-faint)' }}>
          Ref: {error.digest}
        </p>
      )}
      {!error.digest && <div className="mb-5" />}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--ob-navy)', color: '#fff', fontFamily: 'var(--font-sora)' }}
        >
          Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-70"
          style={{
            background: 'var(--ob-surface)',
            border: '1px solid var(--ob-border)',
            color: 'var(--ob-text-muted)',
          }}
        >
          Início
        </Link>
      </div>
    </div>
  )
}
