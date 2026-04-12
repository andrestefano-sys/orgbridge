'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Suspense } from 'react'

interface InvitationInfo {
  id: string
  email: string
  role: string
  network: {
    id: string
    name: string
    slug: string
  }
  expiresAt: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Fundador',
  admin: 'Administrador',
  manager: 'Gestor',
  member: 'Membro',
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      style={{ color: 'var(--ob-amber)' }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─── Inner component (uses useSearchParams) ────────────────────
function InviteInner() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const { data: session, status: sessionStatus } = useSession()

  const [inviteState, setInviteState] = useState<'loading' | 'ready' | 'invalid' | 'accepted' | 'error'>('loading')
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [emailMismatch, setEmailMismatch] = useState(false)

  // 1. Validate token
  useEffect(() => {
    if (!token) { setInviteState('invalid'); return }

    fetch(`/api/invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setInviteState('invalid'); return }
        setInvitation(data.invitation)
        setInviteState('ready')
      })
      .catch(() => setInviteState('error'))
  }, [token])

  // 2. Auto-accept if user is already logged in and invite is ready
  useEffect(() => {
    if (inviteState === 'ready' && sessionStatus === 'authenticated' && token && !accepting) {
      handleAccept()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteState, sessionStatus])

  async function handleAccept() {
    if (!token) return
    setAccepting(true)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    setAccepting(false)

    if (res.ok) {
      setEmailMismatch(!!data.emailMismatch)
      setInviteState('accepted')
      // Redirect to dashboard after short delay
      setTimeout(() => router.push('/dashboard?onboarded=1'), 2000)
    } else {
      setInviteState('error')
    }
  }

  // ── Render states ──────────────────────────────────────────────

  if (!token) {
    return (
      <Card>
        <ErrorIcon />
        <h1 className="text-xl font-semibold mt-4 mb-2" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Link inválido
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--ob-text-muted)' }}>
          Este link de convite não é válido. Verifique o email recebido.
        </p>
        <Link href="/login" className="ob-btn-primary text-sm px-5 py-2.5 rounded-xl">
          Ir para login
        </Link>
      </Card>
    )
  }

  if (inviteState === 'loading') {
    return (
      <Card>
        <Spinner size={32} />
        <p className="mt-4 text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Verificando convite…
        </p>
      </Card>
    )
  }

  if (inviteState === 'invalid') {
    return (
      <Card>
        <ErrorIcon />
        <h1 className="text-xl font-semibold mt-4 mb-2" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Convite inválido ou expirado
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--ob-text-muted)' }}>
          Este convite pode ter expirado ou já ter sido usado. Peça ao administrador um novo convite.
        </p>
        <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--ob-amber-dim)' }}>
          Ir para login →
        </Link>
      </Card>
    )
  }

  if (inviteState === 'error') {
    return (
      <Card>
        <ErrorIcon />
        <h1 className="text-xl font-semibold mt-4 mb-2" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Algo deu errado
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--ob-text-muted)' }}>
          Não foi possível processar seu convite. Tente novamente ou entre em contato com o administrador.
        </p>
        <button
          onClick={() => { setInviteState('ready'); setAccepting(false) }}
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--ob-amber-dim)' }}
        >
          Tentar novamente
        </button>
      </Card>
    )
  }

  if (inviteState === 'accepted') {
    return (
      <Card>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
          style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Bem-vindo à {invitation?.network.name ?? 'rede'}!
        </h1>
        <p className="text-sm mb-1" style={{ color: 'var(--ob-text-muted)' }}>
          Você agora faz parte da rede. Redirecionando…
        </p>
        {emailMismatch && (
          <p className="mt-3 text-xs px-4 py-2 rounded-lg" style={{ background: 'rgba(233,160,16,0.1)', color: 'var(--ob-amber)', border: '1px solid rgba(233,160,16,0.2)' }}>
            Atenção: o convite foi enviado para um email diferente do seu login. Se isso for um erro, contate o administrador.
          </p>
        )}
        <div className="mt-4">
          <Spinner size={16} />
        </div>
      </Card>
    )
  }

  // inviteState === 'ready'
  // If not authenticated, show sign-in prompt
  if (sessionStatus === 'unauthenticated') {
    return (
      <Card>
        <NetworkIcon />
        <div className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ob-text-faint)' }}>
          Convite para
        </div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          {invitation?.network.name}
        </h1>
        <p className="text-sm mb-1" style={{ color: 'var(--ob-text-muted)' }}>
          Função: <span className="font-medium" style={{ color: 'var(--ob-text)' }}>{ROLE_LABELS[invitation?.role ?? ''] ?? invitation?.role}</span>
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--ob-text-faint)' }}>
          Enviado para <span style={{ color: 'var(--ob-text-muted)' }}>{invitation?.email}</span>
        </p>

        <p className="text-sm mb-4" style={{ color: 'var(--ob-text-muted)' }}>
          Para aceitar o convite, entre com sua conta:
        </p>

        <button
          onClick={() => signIn(undefined, { callbackUrl: `/invite?token=${token}` })}
          className="flex items-center justify-center gap-2 w-full rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: 'var(--ob-navy)', color: '#fff', fontFamily: 'var(--font-sora)' }}
        >
          Entrar e aceitar convite
        </button>

        <p className="mt-4 text-xs" style={{ color: 'var(--ob-text-faint)' }}>
          Não tem conta?{' '}
          <a
            onClick={() => signIn(undefined, { callbackUrl: `/invite?token=${token}` })}
            className="cursor-pointer hover:underline"
            style={{ color: 'var(--ob-amber-dim)' }}
          >
            Crie uma agora
          </a>
        </p>
      </Card>
    )
  }

  // Authenticated + ready → auto-accepting (spinner)
  return (
    <Card>
      <Spinner size={32} />
      <p className="mt-4 text-sm" style={{ color: 'var(--ob-text-muted)' }}>
        {accepting ? 'Aceitando convite…' : 'Verificando…'}
      </p>
    </Card>
  )
}

// ─── Shared layout pieces ──────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center text-center max-w-sm w-full px-8 py-10 rounded-2xl"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      {children}
    </div>
  )
}

function NetworkIcon() {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-2xl"
      style={{ background: 'var(--ob-navy)', border: '1px solid rgba(233,160,16,0.2)' }}
    >
      <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" />
        <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
        <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
        <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function ErrorIcon() {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-2xl"
      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    </div>
  )
}

// ─── Page export (wrapped in Suspense for useSearchParams) ──────
export default function InvitePage() {
  return (
    <div
      className="min-h-svh flex items-center justify-center px-5 py-12"
      style={{ background: 'var(--ob-surface-alt)' }}
    >
      <Suspense
        fallback={
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--ob-text-muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: 'var(--ob-amber)' }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Carregando…
          </div>
        }
      >
        <InviteInner />
      </Suspense>
    </div>
  )
}
