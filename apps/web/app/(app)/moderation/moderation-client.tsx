'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────
interface Report {
  id: string
  targetType: 'post' | 'comment'
  targetId: string
  reason: string
  description: string | null
  status: 'pending' | 'resolved' | 'dismissed'
  createdAt: string
  reviewedAt: string | null
  reviewNotes: string | null
  reporter: { id: string; name: string | null; avatarUrl: string | null } | null
}

const REASON_LABELS: Record<string, string> = {
  harassment: 'Assédio ou ameaça',
  spam: 'Spam',
  inappropriate: 'Conteúdo impróprio',
  misinformation: 'Desinformação',
  other: 'Outro',
}

const REASON_COLORS: Record<string, { bg: string; text: string }> = {
  harassment: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  spam: { bg: 'rgba(249,115,22,0.1)', text: '#f97316' },
  inappropriate: { bg: 'rgba(234,179,8,0.1)', text: '#ca8a04' },
  misinformation: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7' },
  other: { bg: 'var(--ob-surface-alt)', text: 'var(--ob-text-muted)' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ─── Review Modal ─────────────────────────────────────────────
function ReviewModal({
  report,
  networkId,
  onClose,
  onResolved,
}: {
  report: Report
  networkId: string
  onClose: () => void
  onResolved: (id: string, status: 'resolved' | 'dismissed') => void
}) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(status: 'resolved' | 'dismissed') {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/networks/${networkId}/reports/${report.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNotes: notes }),
    })
    setLoading(false)
    if (res.ok) {
      onResolved(report.id, status)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao processar.')
    }
  }

  const reasonCfg = REASON_COLORS[report.reason] ?? REASON_COLORS['other']!

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 animate-fade-in"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
              Revisar denúncia
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: reasonCfg.bg, color: reasonCfg.text }}
              >
                {REASON_LABELS[report.reason] ?? report.reason}
              </span>
              <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                {report.targetType === 'post' ? 'Post' : 'Comentário'} · {timeAgo(report.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-black/5 flex-shrink-0"
            style={{ color: 'var(--ob-text-faint)' }}
            aria-label="Fechar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reporter */}
        {report.reporter && (
          <div
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 mb-4"
            style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold flex-shrink-0 mt-0.5"
              style={{ background: 'var(--ob-navy)', color: 'var(--ob-amber)', fontFamily: 'var(--font-sora)' }}
            >
              {(report.reporter.name ?? 'U').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: 'var(--ob-text)' }}>
                Denunciante: {report.reporter.name ?? 'Anônimo'}
              </p>
              {report.description && (
                <p className="text-xs mt-0.5 italic" style={{ color: 'var(--ob-text-muted)' }}>
                  "{report.description}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Content ID info */}
        <div
          className="rounded-xl px-3 py-2.5 mb-4"
          style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
            <span style={{ color: 'var(--ob-text-faint)' }}>ID do conteúdo: </span>
            <code style={{ color: 'var(--ob-text)', fontFamily: 'monospace', fontSize: 11 }}>{report.targetId}</code>
          </p>
          {report.targetType === 'post' && (
            <Link
              href="/feed"
              target="_blank"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium hover:underline underline-offset-2"
              style={{ color: 'var(--ob-amber-dim)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Abrir feed
            </Link>
          )}
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ob-text-muted)' }}>
            Notas de revisão <span style={{ color: 'var(--ob-text-faint)' }}>(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre a decisão e o motivo..."
            className="ob-input resize-none w-full"
            style={{ minHeight: 72, fontSize: 13 }}
            maxLength={500}
          />
        </div>

        {error && (
          <p className="text-xs mb-3" style={{ color: 'var(--ob-error)' }}>{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => submit('resolved')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: '#16a34a', color: '#fff' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {loading ? 'Salvando...' : 'Resolver'}
          </button>
          <button
            onClick={() => submit('dismissed')}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-5 animate-pulse"
          style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <div className="h-5 w-24 rounded-full" style={{ background: 'var(--ob-border)' }} />
                <div className="h-5 w-16 rounded-full" style={{ background: 'var(--ob-border)' }} />
              </div>
              <div className="h-3 w-2/3 rounded mb-1.5" style={{ background: 'var(--ob-border)' }} />
              <div className="h-3 w-1/3 rounded" style={{ background: 'var(--ob-border)' }} />
            </div>
            <div className="h-8 w-20 rounded-xl" style={{ background: 'var(--ob-border)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────
function Empty({ filter }: { filter: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-16 text-center rounded-2xl"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          {filter === 'pending' ? 'Nenhuma denúncia pendente' : 'Nenhum resultado'}
        </p>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          {filter === 'pending'
            ? 'Tudo limpo — sua comunidade está saudável.'
            : 'Nenhuma denúncia neste filtro.'}
        </p>
      </div>
    </div>
  )
}

// ─── Report Row ───────────────────────────────────────────────
function ReportRow({
  report,
  onReview,
}: {
  report: Report
  onReview: (r: Report) => void
}) {
  const reasonCfg = REASON_COLORS[report.reason] ?? REASON_COLORS['other']!

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: reasonCfg.bg, color: reasonCfg.text }}
            >
              {REASON_LABELS[report.reason] ?? report.reason}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                background: report.targetType === 'post' ? 'rgba(99,102,241,0.1)' : 'rgba(34,197,94,0.1)',
                color: report.targetType === 'post' ? '#818cf8' : '#4ade80',
              }}
            >
              {report.targetType === 'post' ? 'Post' : 'Comentário'}
            </span>
            {report.status !== 'pending' && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  background: report.status === 'resolved' ? 'rgba(22,163,74,0.1)' : 'var(--ob-surface-alt)',
                  color: report.status === 'resolved' ? '#16a34a' : 'var(--ob-text-faint)',
                }}
              >
                {report.status === 'resolved' ? 'Resolvido' : 'Descartado'}
              </span>
            )}
          </div>

          {/* Reporter */}
          <p className="text-sm mb-0.5" style={{ color: 'var(--ob-text)' }}>
            <span style={{ color: 'var(--ob-text-faint)' }}>Por: </span>
            <strong style={{ fontWeight: 500 }}>{report.reporter?.name ?? 'Anônimo'}</strong>
          </p>

          {/* Description snippet */}
          {report.description && (
            <p className="text-xs line-clamp-1 mb-1 italic" style={{ color: 'var(--ob-text-muted)' }}>
              "{report.description}"
            </p>
          )}

          {/* Meta */}
          <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
            {timeAgo(report.createdAt)}
            {report.reviewedAt && <> · Revisado {timeAgo(report.reviewedAt)}</>}
            {report.reviewNotes && (
              <> · <span style={{ fontStyle: 'italic' }}>"{report.reviewNotes}"</span></>
            )}
          </p>
        </div>

        {/* Action button */}
        {report.status === 'pending' ? (
          <button
            onClick={() => onReview(report)}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--ob-navy)', color: '#fff' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Revisar
          </button>
        ) : (
          <div
            className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: report.status === 'resolved' ? 'rgba(22,163,74,0.1)' : 'var(--ob-surface-alt)',
              color: report.status === 'resolved' ? '#16a34a' : 'var(--ob-text-faint)',
            }}
            aria-label={report.status === 'resolved' ? 'Resolvido' : 'Descartado'}
          >
            {report.status === 'resolved' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'resolved', label: 'Resolvidas' },
  { key: 'dismissed', label: 'Descartadas' },
]

export function ModerationClient({ networkId }: { networkId: string }) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reviewing, setReviewing] = useState<Report | null>(null)

  const fetchReports = useCallback(async (status: string) => {
    setLoading(true)
    const res = await fetch(`/api/networks/${networkId}/reports?status=${status}`)
    if (res.ok) {
      const data = await res.json()
      setReports(data.reports ?? [])
    }
    setLoading(false)
  }, [networkId])

  useEffect(() => {
    fetchReports(statusFilter)
  }, [statusFilter, fetchReports])

  function handleResolved(id: string, _status: 'resolved' | 'dismissed') {
    setReviewing(null)
    setReports((prev) => prev.filter((r) => r.id !== id))
  }

  const pendingCount = reports.length

  return (
    <div className="max-w-2xl mx-auto animate-fade-slide-up">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-semibold tracking-tight mb-0.5"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Moderação
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Gerencie denúncias de conteúdo da sua comunidade
        </p>
      </div>

      {/* Health banner */}
      {!loading && statusFilter === 'pending' && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-5"
          style={{
            background: pendingCount > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(22,163,74,0.05)',
            border: `1px solid ${pendingCount > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)'}`,
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: pendingCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)' }}
          >
            {pendingCount > 0 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
              </svg>
            )}
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: pendingCount > 0 ? '#ef4444' : '#16a34a', fontFamily: 'var(--font-sora)' }}
            >
              {pendingCount > 0
                ? `${pendingCount} denúncia${pendingCount !== 1 ? 's' : ''} aguardando revisão`
                : 'Nenhuma denúncia pendente'}
            </p>
            <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
              {pendingCount > 0
                ? 'Revise e tome uma ação em cada caso.'
                : 'Sua comunidade está saudável.'}
            </p>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: statusFilter === f.key ? 'var(--ob-navy)' : 'var(--ob-surface)',
              color: statusFilter === f.key ? '#fff' : 'var(--ob-text-muted)',
              border: `1px solid ${statusFilter === f.key ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <Skeleton />
      ) : reports.length === 0 ? (
        <Empty filter={statusFilter} />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onReview={setReviewing}
            />
          ))}
        </div>
      )}

      {reviewing && (
        <ReviewModal
          report={reviewing}
          networkId={networkId}
          onClose={() => setReviewing(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  )
}
