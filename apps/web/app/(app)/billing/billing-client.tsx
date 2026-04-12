'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// ─── Types ────────────────────────────────────────────────────
interface Subscription {
  plan: string
  planLabel: string
  memberLimit: number | null
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

// ─── Plan definitions ─────────────────────────────────────────
const PLANS = [
  {
    key: 'free',
    label: 'Free',
    price: 'R$0',
    period: '',
    description: 'Para começar',
    limit: '10 membros',
    features: ['10 membros', 'Feed e mensagens', 'Organograma básico', 'IA limitada (10 msgs/dia)'],
    cta: null,
    highlight: false,
  },
  {
    key: 'starter',
    label: 'Starter',
    price: 'R$99',
    period: '/mês',
    description: 'Pequenas equipes',
    limit: '50 membros',
    features: ['50 membros', 'Tudo do Free', 'Analytics básico', 'Moderação', 'IA ilimitada', 'Suporte por email'],
    cta: 'Assinar Starter',
    highlight: false,
  },
  {
    key: 'business',
    label: 'Business',
    price: 'R$299',
    period: '/mês',
    description: 'Empresas em crescimento',
    limit: '200 membros',
    features: ['200 membros', 'Tudo do Starter', 'Analytics avançado', 'Convites em massa', 'Exportação de dados', 'Suporte prioritário'],
    cta: 'Assinar Business',
    highlight: true,
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    price: 'R$899',
    period: '/mês',
    description: 'Grandes organizações',
    limit: 'Ilimitado',
    features: ['Membros ilimitados', 'Tudo do Business', 'SLA garantido', 'Onboarding dedicado', 'Relatórios personalizados', 'Suporte 24/7'],
    cta: 'Assinar Enterprise',
    highlight: false,
  },
]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Ativa',       color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  past_due:    { label: 'Pagamento pendente', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  canceled:    { label: 'Cancelada',   color: 'var(--ob-text-faint)', bg: 'var(--ob-surface-alt)' },
  trialing:    { label: 'Em teste',    color: 'var(--ob-amber)', bg: 'rgba(233,160,16,0.1)' },
  unpaid:      { label: 'Não pago',    color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: 'var(--ob-amber)' }} aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-medium shadow-xl animate-fade-in"
      style={{
        background: type === 'success' ? '#022c22' : '#450a0a',
        color: type === 'success' ? '#4ade80' : '#f87171',
        border: `1px solid ${type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
      }}
      role="status"
    >
      {type === 'success' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
      )}
      {message}
    </div>
  )
}

// ─── Inner (uses useSearchParams) ─────────────────────────────
function BillingInner({ networkId, isOwner }: { networkId: string; isOwner: boolean }) {
  const searchParams = useSearchParams()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch(`/api/networks/${networkId}/billing`)
      .then((r) => r.json())
      .then((d) => setSub(d.subscription ?? null))
      .finally(() => setLoading(false))
  }, [networkId])

  // Handle Stripe redirect back
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      showToast('Assinatura ativada com sucesso!', 'success')
      // Re-fetch subscription after Stripe redirect
      fetch(`/api/networks/${networkId}/billing`)
        .then((r) => r.json())
        .then((d) => setSub(d.subscription ?? null))
    }
    if (searchParams.get('canceled') === '1') {
      showToast('Pagamento cancelado.', 'error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleCheckout(plan: string) {
    if (!isOwner) return
    setActing(plan)
    const res = await fetch(`/api/networks/${networkId}/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkout', plan }),
    })
    const data = await res.json()
    setActing(null)
    if (res.ok && data.url) {
      window.location.href = data.url
    } else {
      showToast(data.error ?? 'Erro ao iniciar pagamento.', 'error')
    }
  }

  async function handlePortal() {
    if (!isOwner) return
    setActing('portal')
    const res = await fetch(`/api/networks/${networkId}/billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'portal' }),
    })
    const data = await res.json()
    setActing(null)
    if (res.ok && data.url) {
      window.location.href = data.url
    } else {
      showToast(data.error ?? 'Erro ao abrir portal.', 'error')
    }
  }

  const currentPlan = sub?.plan ?? 'free'
  const statusInfo = STATUS_LABELS[sub?.status ?? 'active'] ?? STATUS_LABELS['active']!

  return (
    <div className="max-w-4xl animate-fade-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-0.5" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Assinatura
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Gerencie o plano e a cobrança da sua rede
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Current plan banner */}
          <div
            className="rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: 'var(--ob-navy)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ob-amber)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-base font-semibold" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                    Plano {sub?.planLabel ?? 'Free'}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: statusInfo.bg, color: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </span>
                  {sub?.cancelAtPeriodEnd && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                      Cancela ao fim do período
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
                  {sub?.memberLimit != null
                    ? `Até ${sub.memberLimit} membros`
                    : 'Membros ilimitados'}
                  {sub?.currentPeriodEnd && (
                    <> · Renova em {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                  )}
                </p>
              </div>
            </div>

            {/* Manage / upgrade CTA */}
            {isOwner && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {sub?.stripeSubscriptionId ? (
                  <button
                    onClick={handlePortal}
                    disabled={acting === 'portal'}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
                  >
                    {acting === 'portal' ? <Spinner /> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                    Gerenciar assinatura
                  </button>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                    Escolha um plano abaixo para fazer upgrade
                  </p>
                )}
              </div>
            )}

            {!isOwner && (
              <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                Apenas o dono da rede pode alterar o plano
              </p>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === currentPlan
              const isHigher = PLANS.findIndex((p) => p.key === plan.key) > PLANS.findIndex((p) => p.key === currentPlan)

              return (
                <div
                  key={plan.key}
                  className="rounded-2xl p-5 flex flex-col"
                  style={{
                    background: isCurrent ? 'var(--ob-navy)' : plan.highlight ? 'rgba(233,160,16,0.04)' : 'var(--ob-surface)',
                    border: isCurrent
                      ? '1.5px solid rgba(233,160,16,0.4)'
                      : plan.highlight
                      ? '1.5px solid rgba(233,160,16,0.3)'
                      : '1px solid var(--ob-border)',
                  }}
                >
                  {/* Plan header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isCurrent ? 'var(--ob-amber)' : plan.highlight ? 'var(--ob-amber)' : 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                      >
                        {plan.label}
                      </p>
                      {isCurrent && (
                        <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: 'rgba(233,160,16,0.2)', color: 'var(--ob-amber)' }}>
                          Atual
                        </span>
                      )}
                      {plan.highlight && !isCurrent && (
                        <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: 'rgba(233,160,16,0.1)', color: 'var(--ob-amber-dim)' }}>
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs mb-3" style={{ color: isCurrent ? 'rgba(255,255,255,0.5)' : 'var(--ob-text-faint)' }}>
                      {plan.description}
                    </p>
                    <p style={{ color: isCurrent ? '#fff' : 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-sm ml-0.5" style={{ color: isCurrent ? 'rgba(255,255,255,0.5)' : 'var(--ob-text-faint)' }}>{plan.period}</span>
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-2 mb-5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: isCurrent ? 'rgba(255,255,255,0.7)' : 'var(--ob-text-muted)' }}>
                        <span style={{ color: isCurrent ? 'var(--ob-amber)' : '#4ade80', flexShrink: 0 }}>
                          <CheckIcon />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {plan.cta && isOwner && !isCurrent && isHigher && (
                    <button
                      onClick={() => handleCheckout(plan.key)}
                      disabled={!!acting}
                      className="w-full rounded-xl py-2 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{
                        background: plan.highlight ? 'var(--ob-amber)' : 'var(--ob-navy)',
                        color: plan.highlight ? 'var(--ob-navy)' : '#fff',
                        fontFamily: 'var(--font-sora)',
                      }}
                    >
                      {acting === plan.key ? <Spinner /> : plan.cta}
                    </button>
                  )}
                  {isCurrent && (
                    <div
                      className="w-full rounded-xl py-2 text-sm font-medium text-center"
                      style={{ background: 'rgba(233,160,16,0.15)', color: 'var(--ob-amber)' }}
                    >
                      Plano atual
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer note */}
          <p className="mt-6 text-xs text-center" style={{ color: 'var(--ob-text-faint)' }}>
            Pagamentos processados de forma segura pelo Stripe · Cancele a qualquer momento
          </p>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

// ─── Export wrapped in Suspense ───────────────────────────────
export function BillingClient({ networkId, isOwner }: { networkId: string; isOwner: boolean }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: 'var(--ob-amber)' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></div>}>
      <BillingInner networkId={networkId} isOwner={isOwner} />
    </Suspense>
  )
}
