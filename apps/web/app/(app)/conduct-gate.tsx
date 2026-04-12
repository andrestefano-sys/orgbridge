'use client'

import { useEffect, useState, useCallback } from 'react'

interface Policy {
  id: string
  title: string
  content: string
  version: string
}

interface Props {
  networkId: string
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Simple markdown-like renderer for conduct policy (bold, lists, headings)
function PolicyContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="text-sm leading-relaxed space-y-2" style={{ color: 'var(--ob-text-muted)' }}>
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return <h2 key={i} className="text-base font-semibold mt-4" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>{line.slice(2)}</h2>
        }
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-sm font-semibold mt-3" style={{ color: 'var(--ob-text)' }}>{line.slice(3)}</h3>
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--ob-amber)' }} />
              <span>{line.slice(2)}</span>
            </div>
          )
        }
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

export function ConductGate({ networkId }: Props) {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [checking, setChecking] = useState(true)
  const [show, setShow] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')

  const check = useCallback(async () => {
    try {
      const res = await fetch(`/api/networks/${networkId}/conduct`)
      const data = await res.json()
      if (data.policy && !data.accepted) {
        setPolicy(data.policy)
        setShow(true)
      }
    } catch {
      // silently ignore — don't block the user if check fails
    } finally {
      setChecking(false)
    }
  }, [networkId])

  useEffect(() => { check() }, [check])

  async function handleAccept() {
    if (!checked) { setError('Você precisa marcar que leu e concorda com as diretrizes.'); return }
    setAccepting(true)
    setError('')

    const res = await fetch(`/api/networks/${networkId}/conduct`, { method: 'PUT' })
    const data = await res.json()
    setAccepting(false)

    if (!res.ok) { setError(data.error ?? 'Erro ao registrar aceite.'); return }
    setShow(false)
  }

  if (checking || !show || !policy) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal
      aria-labelledby="conduct-title"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl flex flex-col animate-fade-in"
        style={{
          background: 'var(--ob-surface)',
          border: '1px solid var(--ob-border)',
          maxHeight: '90vh',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--ob-border)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: 'rgba(233,160,16,0.12)', border: '1px solid rgba(233,160,16,0.3)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ob-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h2 id="conduct-title" className="text-base font-semibold" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                {policy.title}
              </h2>
              <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                Versão {policy.version} · Aceite obrigatório
              </p>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
            Antes de continuar, leia e aceite as diretrizes de uso desta rede.
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <PolicyContent content={policy.content} />
        </div>

        {/* Footer */}
        <div
          className="px-6 py-5 flex-shrink-0"
          style={{ borderTop: '1px solid var(--ob-border)' }}
        >
          {error && (
            <p className="text-xs mb-3" style={{ color: 'var(--ob-error)' }} role="alert">{error}</p>
          )}

          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => { setChecked(e.target.checked); setError('') }}
              className="mt-0.5 h-4 w-4 rounded flex-shrink-0"
              style={{ accentColor: 'var(--ob-amber)' }}
            />
            <span className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
              Li e concordo com as diretrizes de uso desta rede.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            style={{ background: 'var(--ob-navy)', color: '#fff' }}
          >
            {accepting ? <Spinner /> : null}
            {accepting ? 'Registrando aceite...' : 'Aceitar e continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
