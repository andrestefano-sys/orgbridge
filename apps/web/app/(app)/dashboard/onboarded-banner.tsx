'use client'

import { useState, useEffect } from 'react'

interface Props {
  networkName: string
}

export function OnboardedBanner({ networkName }: Props) {
  const [visible, setVisible] = useState(true)

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div
      className="relative flex items-start gap-4 rounded-2xl px-5 py-4 mb-6"
      style={{
        background: 'linear-gradient(135deg, var(--ob-navy) 0%, var(--ob-navy-mid) 100%)',
        border: '1px solid rgba(233,160,16,0.25)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(233,160,16,0.18)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ob-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-semibold"
          style={{ color: '#fff', fontFamily: 'var(--font-sora)' }}
        >
          {networkName ? `${networkName} está pronto!` : 'Sua rede está pronta!'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Rede criada com sucesso. Convide membros, personalize o organograma e comece a conectar sua equipe.
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setVisible(false)}
        className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 transition-all hover:opacity-70"
        style={{ color: 'rgba(255,255,255,0.5)' }}
        aria-label="Fechar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden"
        style={{ background: 'rgba(233,160,16,0.15)' }}
      >
        <div
          className="h-full"
          style={{
            background: 'var(--ob-amber)',
            animation: 'onboarded-shrink 8s linear forwards',
          }}
        />
      </div>

      <style>{`
        @keyframes onboarded-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
