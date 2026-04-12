'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Network {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  industry: string | null
  country: string | null
  city: string | null
  state: string | null
  type: string
  status: string
  ownerId: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface Props {
  network: Network
  memberCount: number
  nodeCount: number
  currentUserRole: string
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold mb-0.5" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          {title}
        </h2>
        {desc && <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--ob-text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Invitations Panel ────────────────────────────────────────
interface Invitation {
  id: string
  email: string
  role: string
  token: string
  expiresAt: string
  createdAt: string
}

const ROLE_LABELS_INV: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  member: 'Membro',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function InvitationsPanel({ networkId }: { networkId: string }) {
  const [invs, setInvs] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  // Send form state
  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])
  const [sendRole, setSendRole] = useState('member')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendResults, setSendResults] = useState<Array<{ email: string; status: string }> | null>(null)

  const loadInvs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/networks/${networkId}/invitations`)
    if (res.ok) {
      const data = await res.json()
      setInvs(data.invitations ?? [])
    }
    setLoading(false)
  }, [networkId])

  useEffect(() => { loadInvs() }, [loadInvs])

  async function revoke(token: string) {
    if (!confirm('Revogar este convite?')) return
    setRevoking(token)
    await fetch(`/api/networks/${networkId}/invitations?token=${token}`, { method: 'DELETE' })
    setRevoking(null)
    setInvs((prev) => prev.filter((i) => i.token !== token))
  }

  function daysLeft(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function addEmail() {
    const emails = emailInput
      .split(/[\s,;]+/)
      .map((e) => e.toLowerCase().trim())
      .filter((e) => EMAIL_RE.test(e) && !emailList.includes(e))
    setEmailList((prev) => [...prev, ...emails].slice(0, 20))
    setEmailInput('')
  }

  function removeEmail(email: string) {
    setEmailList((prev) => prev.filter((e) => e !== email))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addEmail()
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (emailList.length === 0) return
    setSending(true)
    setSendError('')
    setSendResults(null)

    const res = await fetch(`/api/networks/${networkId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: emailList, role: sendRole }),
    })
    const data = await res.json()
    setSending(false)

    if (!res.ok) {
      setSendError(data.error ?? 'Erro ao enviar convites.')
      return
    }

    setSendResults(data.results)
    setEmailList([])
    setEmailInput('')
    // Reload pending list to reflect newly sent invites
    loadInvs()
  }

  function dismissResults() {
    setSendResults(null)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Send form */}
      <form onSubmit={handleSend} className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--ob-text-faint)' }}>
          Enviar novo convite
        </p>

        {sendError && (
          <div role="alert" className="rounded-lg px-3 py-2 text-xs"
            style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}>
            {sendError}
          </div>
        )}

        {sendResults && (
          <div className="rounded-xl p-3" style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--ob-text-muted)' }}>Resultado</span>
              <button type="button" onClick={dismissResults} className="text-xs hover:underline" style={{ color: 'var(--ob-text-faint)' }}>Fechar</button>
            </div>
            <div className="flex flex-col gap-1">
              {sendResults.map((r) => (
                <div key={r.email} className="flex items-center gap-2 text-xs">
                  {r.status === 'sent' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                  )}
                  <span style={{ color: r.status === 'sent' ? 'var(--ob-text)' : 'var(--ob-text-faint)' }}>{r.email}</span>
                  {r.status !== 'sent' && <span style={{ color: 'var(--ob-text-faint)' }}>— ignorado</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="email"
            className="ob-input flex-1"
            style={{ height: 40, fontSize: 13 }}
            placeholder="nome@empresa.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addEmail}
          />
          <select
            className="ob-input"
            style={{ height: 40, width: 130, cursor: 'pointer', fontSize: 13 }}
            value={sendRole}
            onChange={(e) => setSendRole(e.target.value)}
          >
            <option value="member">Membro</option>
            <option value="manager">Gestor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {emailList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {emailList.map((email) => (
              <div
                key={email}
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)', color: 'var(--ob-text)' }}
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  aria-label={`Remover ${email}`}
                  className="ml-0.5 hover:opacity-70"
                  style={{ color: 'var(--ob-text-faint)' }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
          Digite e pressione Enter, vírgula ou espaço para adicionar vários e-mails.
        </p>

        <button
          type="submit"
          disabled={sending || emailList.length === 0}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--ob-navy)', color: '#fff' }}
        >
          {sending ? <Spinner /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
          {sending ? 'Enviando...' : `Enviar ${emailList.length > 0 ? emailList.length + ' ' : ''}convite${emailList.length !== 1 ? 's' : ''}`}
        </button>
      </form>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--ob-border)' }} />

      {/* Pending list */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--ob-text-faint)' }}>
          Pendentes ({loading ? '…' : invs.length})
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--ob-text-faint)' }}>
            <Spinner /> Carregando...
          </div>
        ) : invs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>Nenhum convite pendente.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {invs.map((inv) => {
              const days = daysLeft(inv.expiresAt)
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: 'var(--ob-navy)', color: 'var(--ob-amber)', fontFamily: 'var(--font-sora)' }}
                  >
                    {inv.email[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ob-text)' }}>{inv.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
                        {ROLE_LABELS_INV[inv.role] ?? inv.role}
                      </span>
                      <span className="text-xs" style={{ color: days <= 1 ? 'var(--ob-error)' : 'var(--ob-text-faint)' }}>
                        · expira em {days}d
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => revoke(inv.token)}
                    disabled={revoking === inv.token}
                    className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ border: '1px solid var(--ob-border)', color: 'var(--ob-error)' }}
                    aria-label={`Revogar convite de ${inv.email}`}
                  >
                    {revoking === inv.token ? <Spinner /> : 'Revogar'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Moderation Panel ─────────────────────────────────────────
const REASON_LABELS: Record<string, string> = {
  harassment: 'Assédio ou ameaça',
  spam: 'Spam',
  inappropriate: 'Conteúdo impróprio',
  misinformation: 'Desinformação',
  other: 'Outro motivo',
}

interface Report {
  id: string
  targetType: string
  targetId: string
  reason: string
  description: string | null
  status: string
  createdAt: string
  reporter: { id: string; name: string | null; avatarUrl: string | null }
}

function ModerationPanel({ networkId }: { networkId: string }) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadReports = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/networks/${networkId}/reports?status=pending`)
    if (res.ok) {
      const data = await res.json()
      setReports(data.reports ?? [])
    }
    setLoading(false)
  }, [networkId])

  useEffect(() => { loadReports() }, [loadReports])

  async function handleReview(reportId: string, status: 'resolved' | 'dismissed') {
    setSubmitting(true)
    await fetch(`/api/networks/${networkId}/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNotes }),
    })
    setSubmitting(false)
    setReviewingId(null)
    setReviewNotes('')
    setReports((prev) => prev.filter((r) => r.id !== reportId))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm py-4" style={{ color: 'var(--ob-text-faint)' }}>
        <Spinner /> Carregando denúncias...
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: 'var(--ob-surface-alt)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--ob-text-faint)' }} aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Nenhuma denúncia pendente.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {reports.map((r) => (
        <div
          key={r.id}
          className="rounded-xl p-4"
          style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                  >
                    {r.targetType === 'post' ? 'Post' : 'Comentário'}
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--ob-text)' }}>
                    {REASON_LABELS[r.reason] ?? r.reason}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
                  Denunciado por <strong style={{ color: 'var(--ob-text)' }}>{r.reporter.name ?? 'Membro'}</strong>
                  {' · '}{new Date(r.createdAt).toLocaleDateString('pt-BR')}
                </p>
                {r.description && (
                  <p className="mt-1 text-xs italic" style={{ color: 'var(--ob-text-muted)' }}>
                    &ldquo;{r.description}&rdquo;
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setReviewingId(reviewingId === r.id ? null : r.id)}
              className="flex-shrink-0 text-xs font-medium rounded-lg px-3 py-1.5 transition-all hover:opacity-80"
              style={{ background: 'var(--ob-navy)', color: '#fff' }}
            >
              Revisar
            </button>
          </div>

          {reviewingId === r.id && (
            <div
              className="rounded-lg p-3 mt-2"
              style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--ob-text-muted)' }}>
                Notas de revisão (opcional)
              </p>
              <textarea
                className="ob-input resize-none w-full mb-3"
                style={{ minHeight: 56, fontSize: 12 }}
                placeholder="Descreva a decisão tomada..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                maxLength={300}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(r.id, 'resolved')}
                  disabled={submitting}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  ✓ Resolver (conteúdo removido)
                </button>
                <button
                  onClick={() => handleReview(r.id, 'dismissed')}
                  disabled={submitting}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--ob-surface-alt)', color: 'var(--ob-text-muted)', border: '1px solid var(--ob-border)' }}
                >
                  Descartar denúncia
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function SettingsClient({ network, memberCount, nodeCount, currentUserRole }: Props) {
  const [name, setName] = useState(network.name)
  const [logoUrl, setLogoUrl] = useState(network.logoUrl ?? '')
  const [description, setDescription] = useState(network.description ?? '')
  const [industry, setIndustry] = useState(network.industry ?? '')
  const [country, setCountry] = useState(network.country ?? '')
  const [city, setCity] = useState(network.city ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isOwner = currentUserRole === 'owner'

  // Code of Conduct
  const [conductContent, setConductContent] = useState('')
  const [conductTitle, setConductTitle] = useState('Diretrizes de Uso da Rede')
  const [conductLoading, setConductLoading] = useState(true)
  const [conductSaving, setConductSaving] = useState(false)
  const [conductError, setConductError] = useState('')
  const [conductSuccess, setConductSuccess] = useState(false)
  const [conductVersion, setConductVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/networks/${network.id}/conduct`)
      .then((r) => r.json())
      .then((data) => {
        if (data.policy) {
          setConductContent(data.policy.content)
          setConductTitle(data.policy.title)
          setConductVersion(data.policy.version)
        }
      })
      .finally(() => setConductLoading(false))
  }, [network.id])

  async function handleSaveConduct(e: React.FormEvent) {
    e.preventDefault()
    setConductSaving(true)
    setConductError('')
    setConductSuccess(false)

    const res = await fetch(`/api/networks/${network.id}/conduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: conductTitle, content: conductContent }),
    })
    const data = await res.json()
    setConductSaving(false)

    if (!res.ok) { setConductError(data.error ?? 'Erro ao salvar política.'); return }
    setConductVersion(data.policy?.version ?? null)
    setConductSuccess(true)
    setTimeout(() => setConductSuccess(false), 3000)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    const res = await fetch(`/api/networks/${network.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, logoUrl: logoUrl.trim() || null, description, industry, country, city }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setSaveError(data.error ?? 'Erro ao salvar.')
      return
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const createdDate = new Date(network.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Configurações
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Gerencie as informações e preferências da sua rede
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Membros', value: memberCount, href: '/members' },
          { label: 'Áreas', value: nodeCount, href: '/org-chart' },
          { label: 'Status', value: network.status === 'active' ? 'Ativa' : network.status, href: null },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
          >
            <p
              className="text-xl font-semibold mb-0.5"
              style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
            >
              {s.value}
            </p>
            <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
              {s.href ? (
                <Link href={s.href} className="hover:underline underline-offset-2" style={{ color: 'var(--ob-text-muted)' }}>
                  {s.label}
                </Link>
              ) : s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {/* General info */}
        <SectionCard title="Informações gerais" desc="Nome, descrição e dados da organização">
          <form onSubmit={handleSave}>
            {/* Logo preview + name side by side */}
            <div className="flex items-center gap-4 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  width={48}
                  height={48}
                  className="rounded-xl object-cover flex-shrink-0"
                  style={{ width: 48, height: 48, border: '1px solid var(--ob-border)' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold select-none"
                  style={{ background: 'var(--ob-navy)', color: 'var(--ob-amber)', fontFamily: 'var(--font-sora)' }}
                >
                  {name[0]?.toUpperCase() ?? 'O'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--ob-text-muted)' }}>Logo da rede</p>
                <input
                  type="url"
                  className="ob-input w-full"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://... (URL da imagem)"
                  maxLength={500}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>
            <Field label="Nome da rede *">
              <input
                className="ob-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Descrição">
              <textarea
                className="ob-input resize-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="Descreva brevemente sua organização..."
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Setor / Indústria">
                <input
                  className="ob-input"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="ex: Tecnologia"
                  maxLength={80}
                />
              </Field>
              <Field label="País">
                <input
                  className="ob-input"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="ex: Brasil"
                  maxLength={60}
                />
              </Field>
            </div>
            <Field label="Cidade">
              <input
                className="ob-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="ex: São Paulo"
                maxLength={80}
              />
            </Field>

            {saveError && (
              <div
                className="mb-4 rounded-lg px-4 py-3 text-sm"
                role="alert"
                style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}
              >
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div
                className="mb-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2"
                role="status"
                style={{ background: 'var(--ob-success-bg)', border: '1px solid var(--ob-success-border)', color: 'var(--ob-success)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Alterações salvas com sucesso.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
              style={{ background: 'var(--ob-navy)', color: '#fff' }}
            >
              {saving ? <Spinner /> : null}
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </SectionCard>

        {/* Network identity */}
        <SectionCard title="Identidade da rede" desc="Informações fixas que identificam sua rede">
          <div className="flex flex-col gap-3">
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
            >
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ob-text-muted)' }}>Identificador (slug)</p>
                <p className="text-sm font-mono" style={{ color: 'var(--ob-text)' }}>orgbridge.net/{network.slug}</p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', color: 'var(--ob-text-faint)' }}
              >
                fixo
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
            >
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ob-text-muted)' }}>Criada em</p>
                <p className="text-sm" style={{ color: 'var(--ob-text)' }}>{createdDate}</p>
              </div>
            </div>
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
            >
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ob-text-muted)' }}>Tipo de estrutura</p>
                <p className="text-sm" style={{ color: 'var(--ob-text)' }}>
                  {network.type === 'vertical' ? 'Hierárquica (vertical)' : 'Horizontal'}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Quick links */}
        <SectionCard title="Gestão" desc="Atalhos para as principais ações de administração">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Membros', desc: `${memberCount} ${memberCount === 1 ? 'membro' : 'membros'} ativos`, href: '/members', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
              { label: 'Organograma', desc: `${nodeCount} ${nodeCount === 1 ? 'área' : 'áreas'}`, href: '/org-chart', icon: 'M12 5a3 3 0 100 6 3 3 0 000-6zM5 19a3 3 0 100-6 3 3 0 000 6zM19 19a3 3 0 100-6 3 3 0 000 6zM12 11v2M12 13l-4 4M12 13l4 4' },
              { label: 'Analytics', desc: 'Engajamento e atividade', href: '/analytics', icon: 'M18 20V10M12 20V4M6 20v-6' },
              { label: 'Feed da rede', desc: 'Ver publicações e atividade', href: '/feed', icon: 'M4 6h16M4 12h16M4 18h7' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-xl p-3 transition-all hover:opacity-80"
                style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: 'var(--ob-navy)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(233,160,16,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={item.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>{item.desc}</p>
                </div>
                <svg className="ml-auto flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Invitations */}
        <SectionCard
          title="Convidar membros"
          desc="Envie convites por e-mail e gerencie os pendentes."
        >
          <InvitationsPanel networkId={network.id} />
        </SectionCard>

        {/* Code of Conduct */}
        <SectionCard
          title="Code of Conduct"
          desc="Diretrizes de uso que todos os membros devem aceitar ao entrar na rede."
        >
          {conductLoading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ob-text-faint)' }}>
              <Spinner /> Carregando...
            </div>
          ) : (
            <form onSubmit={handleSaveConduct}>
              <Field label="Título da política">
                <input
                  className="ob-input"
                  value={conductTitle}
                  onChange={(e) => setConductTitle(e.target.value)}
                  maxLength={120}
                />
              </Field>
              <Field label={`Conteúdo (Markdown suportado)${conductVersion ? ` — versão atual: ${conductVersion}` : ''}`}>
                <textarea
                  className="ob-input resize-none font-mono text-xs"
                  rows={10}
                  value={conductContent}
                  onChange={(e) => setConductContent(e.target.value)}
                  placeholder={'# Diretrizes de Uso\n\nDescreva as regras da sua rede...\n\n## Comportamento esperado\n\n- Tratar todos com respeito\n- ...'}
                />
              </Field>

              {conductError && (
                <div className="mb-4 rounded-lg px-4 py-3 text-sm" role="alert"
                  style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}>
                  {conductError}
                </div>
              )}
              {conductSuccess && (
                <div className="mb-4 rounded-lg px-4 py-3 text-sm flex items-center gap-2" role="status"
                  style={{ background: 'var(--ob-success-bg)', border: '1px solid var(--ob-success-border)', color: 'var(--ob-success)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 13l4 4L19 7" /></svg>
                  Política publicada. Membros serão solicitados a aceitar na próxima visita.
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={conductSaving || !conductContent.trim()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                  style={{ background: 'var(--ob-navy)', color: '#fff' }}
                >
                  {conductSaving ? <Spinner /> : null}
                  {conductSaving ? 'Publicando...' : conductVersion ? 'Atualizar política' : 'Publicar política'}
                </button>
                {conductVersion && (
                  <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                    Versão {conductVersion}
                  </span>
                )}
              </div>
            </form>
          )}
        </SectionCard>

        {/* Moderation */}
        <SectionCard
          title="Moderação de conteúdo"
          desc="Denúncias de posts e comentários pendentes de revisão."
        >
          <ModerationPanel networkId={network.id} />
        </SectionCard>

        {/* Danger zone — owner only */}
        {isOwner && (
          <div
            className="rounded-2xl p-6"
            style={{ border: '1px solid var(--ob-error-border)', background: 'var(--ob-error-bg)' }}
          >
            <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--ob-error)', fontFamily: 'var(--font-sora)' }}>
              Zona de perigo
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--ob-text-muted)' }}>
              Ações irreversíveis que afetam todos os membros da rede.
            </p>
            <button
              disabled
              className="rounded-xl px-4 py-2.5 text-sm font-medium opacity-50 cursor-not-allowed"
              style={{ border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)', background: 'transparent' }}
              title="Em breve"
            >
              Encerrar rede — em breve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
