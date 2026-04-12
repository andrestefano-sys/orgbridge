'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────
interface OrgNode {
  id: string
  serverId?: string
  name: string
  parentId: string | null
  color: string | undefined
}

interface StepProps {
  onNext: (data: unknown) => void
  onBack?: () => void
}

// ─── Helpers ─────────────────────────────────────────────────
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const NODE_COLORS = [
  '#E9A010', '#3B82F6', '#10B981', '#8B5CF6',
  '#EF4444', '#F59E0B', '#06B6D4', '#EC4899',
]

// ─── Step Indicator ──────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Sua rede', 'Organograma', 'Convidar']
  return (
    <div className="mb-8 flex items-center gap-0">
      {labels.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200"
                style={{
                  background: done ? 'var(--ob-navy)' : active ? 'var(--ob-amber)' : 'var(--ob-border)',
                  color: done || active ? (done ? '#fff' : 'var(--ob-navy)') : 'var(--ob-text-faint)',
                }}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : step}
              </div>
              <span
                className="mt-1.5 text-xs font-medium"
                style={{ color: active ? 'var(--ob-text)' : 'var(--ob-text-faint)' }}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className="mx-2 mb-5 h-px w-12 sm:w-20 transition-all duration-300"
                style={{ background: done ? 'var(--ob-navy)' : 'var(--ob-border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Network Info ─────────────────────────────────────
interface Step1Data {
  name: string
  slug: string
  industry: string
  country: string
  type: 'vertical' | 'horizontal'
  description: string
}

const INDUSTRIES = [
  'Tecnologia', 'Saúde', 'Educação', 'Finanças', 'Varejo',
  'Manufatura', 'Consultoria', 'Agência / Marketing', 'Logística', 'Outro',
]

function Step1({ onNext }: StepProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('Brasil')
  const [type, setType] = useState<'vertical' | 'horizontal'>('vertical')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(slugify(v))
  }

  function handleSlugChange(v: string) {
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''))
    setSlugEdited(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) { setError('Nome deve ter ao menos 2 caracteres.'); return }
    if (slug.length < 2) { setError('Identificador deve ter ao menos 2 caracteres.'); return }

    setLoading(true)
    const res = await fetch('/api/networks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug, industry, country, type, description: description.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao criar rede.')
      return
    }

    onNext({ network: data.network, rootNode: data.rootNode })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Informações da rede
        </h2>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Esses dados identificam sua organização na plataforma.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}>
          {error}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="net-name" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
          Nome da organização <span style={{ color: 'var(--ob-error)' }}>*</span>
        </label>
        <input
          id="net-name"
          type="text"
          className="ob-input"
          placeholder="Ex: Acme Corp"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          maxLength={100}
          autoFocus
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="net-slug" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
          Identificador único <span style={{ color: 'var(--ob-error)' }}>*</span>
        </label>
        <div className="relative flex items-center">
          <span
            className="absolute left-3 text-sm select-none"
            style={{ color: 'var(--ob-text-faint)' }}
          >
            orgbridge.net/
          </span>
          <input
            id="net-slug"
            type="text"
            className="ob-input"
            style={{ paddingLeft: 112 }}
            placeholder="acme-corp"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            required
            maxLength={60}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
          Apenas letras minúsculas, números e hífens. Não pode ser alterado depois.
        </p>
      </div>

      {/* Industry + Country */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="net-industry" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            Setor
          </label>
          <select
            id="net-industry"
            className="ob-input"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="">Selecionar...</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="net-country" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
            País
          </label>
          <input
            id="net-country"
            type="text"
            className="ob-input"
            placeholder="Brasil"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            maxLength={60}
          />
        </div>
      </div>

      {/* Type */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>Estrutura hierárquica</span>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'vertical', label: 'Vertical', desc: 'Hierarquia clara com níveis definidos (CEO → Diretor → Gerente...)' },
            { value: 'horizontal', label: 'Horizontal', desc: 'Estrutura mais plana com menor hierarquia formal' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className="flex flex-col items-start rounded-xl p-4 text-left transition-all duration-150"
              style={{
                border: `2px solid ${type === opt.value ? 'var(--ob-amber)' : 'var(--ob-border)'}`,
                background: type === opt.value ? 'rgba(233,160,16,0.06)' : 'var(--ob-surface)',
              }}
            >
              <span className="text-sm font-semibold mb-0.5" style={{ color: 'var(--ob-text)' }}>{opt.label}</span>
              <span className="text-xs leading-snug" style={{ color: 'var(--ob-text-muted)' }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="net-desc" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
          Descrição <span className="font-normal" style={{ color: 'var(--ob-text-faint)' }}>(opcional)</span>
        </label>
        <textarea
          id="net-desc"
          className="ob-input resize-none"
          style={{ height: 80, paddingTop: 10, paddingBottom: 10 }}
          placeholder="Uma frase sobre o propósito desta rede..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
        />
        <p className="text-xs text-right" style={{ color: 'var(--ob-text-faint)' }}>{description.length}/300</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]"
        style={{ background: 'var(--ob-navy)', color: '#fff' }}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Criando rede...
          </>
        ) : 'Criar rede e continuar →'}
      </button>
    </form>
  )
}

// ─── Step 2: Org Chart ────────────────────────────────────────
interface Step2Data {
  nodes: OrgNode[]
}

function Step2({ onNext, onBack, networkId, rootNode }: StepProps & { networkId: string; rootNode: { id: string; name: string } }) {
  const [nodes, setNodes] = useState<OrgNode[]>([
    { id: rootNode.id, serverId: rootNode.id, name: rootNode.name, parentId: null, color: 'var(--ob-navy)' },
  ])
  const [newName, setNewName] = useState('')
  const [newParent, setNewParent] = useState(rootNode.id)
  const [newColor, setNewColor] = useState(NODE_COLORS[0])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function addNode(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')

    const parentNode = nodes.find((n) => n.id === newParent)
    const parentServerId = parentNode?.serverId

    const res = await fetch(`/api/networks/${networkId}/org-nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), parentId: parentServerId || rootNode.id, color: newColor }),
    })

    const data = await res.json()
    setAdding(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao adicionar área.')
      return
    }

    const tempId = uid()
    setNodes((prev): OrgNode[] => [
      ...prev,
      { id: String(data.node.id), serverId: String(data.node.id), name: newName.trim(), parentId: parentServerId ?? rootNode.id, color: newColor },
    ])
    setNewName('')
  }

  function removeNode(id: string) {
    // Remove node and its descendants
    const toRemove = new Set<string>()
    function collect(nid: string) {
      toRemove.add(nid)
      nodes.filter((n) => n.parentId === nid).forEach((n) => collect(n.id))
    }
    collect(id)
    setNodes((prev) => prev.filter((n) => !toRemove.has(n.id)))
  }

  function renderTree(parentId: string | null, depth = 0): React.ReactNode {
    const children = nodes.filter((n) => n.parentId === parentId)
    if (children.length === 0) return null
    return (
      <ul className={`flex flex-col gap-1 ${depth > 0 ? 'ml-5 border-l pl-4' : ''}`} style={{ borderColor: 'var(--ob-border)' }}>
        {children.map((node) => (
          <li key={node.id}>
            <div className="flex items-center gap-2 py-1 group">
              <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: node.color }} />
              <span className="text-sm flex-1" style={{ color: 'var(--ob-text)' }}>{node.name}</span>
              {node.id !== rootNode.id && (
                <button
                  type="button"
                  onClick={() => removeNode(node.id)}
                  className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-red-50"
                  style={{ color: 'var(--ob-error)' }}
                  aria-label={`Remover ${node.name}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {renderTree(node.id, depth + 1)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Organograma inicial
        </h2>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Adicione as áreas e departamentos da sua organização. Você poderá editar depois.
        </p>
      </div>

      {/* Tree preview */}
      <div className="rounded-xl p-4" style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)', minHeight: 80 }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--ob-text-faint)' }}>ESTRUTURA ATUAL</p>
        <div>
          {/* Root */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: 'var(--ob-navy)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>{rootNode.name}</span>
            <span className="text-xs rounded-full px-2 py-0.5" style={{ background: 'rgba(233,160,16,0.15)', color: 'var(--ob-amber-dim)' }}>raiz</span>
          </div>
          {renderTree(rootNode.id)}
        </div>
      </div>

      {/* Add node form */}
      <form onSubmit={addNode} className="flex flex-col gap-3">
        <p className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>Adicionar área / departamento</p>

        {error && (
          <div role="alert" className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            className="ob-input flex-1"
            style={{ height: 40 }}
            placeholder="Ex: Engenharia, Comercial, RH..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={80}
          />
          <select
            className="ob-input"
            style={{ height: 40, width: 140, cursor: 'pointer' }}
            value={newParent}
            onChange={(e) => setNewParent(e.target.value)}
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>Cor:</span>
          {NODE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className="h-6 w-6 rounded-full transition-transform hover:scale-110"
              style={{
                background: c,
                outline: newColor === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2,
              }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: 'var(--ob-surface-alt)', border: '1.5px solid var(--ob-border)', color: 'var(--ob-text)' }}
        >
          {adding ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
          Adicionar
        </button>
      </form>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 flex-1 items-center justify-center rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ border: '1.5px solid var(--ob-border)', color: 'var(--ob-text-muted)', background: 'var(--ob-surface)' }}
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={() => onNext({ nodes })}
          className="flex h-12 flex-1 items-center justify-center rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'var(--ob-navy)', color: '#fff' }}
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Invitations ──────────────────────────────────────
function Step3({ onNext, onBack, networkId }: StepProps & { networkId: string }) {
  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])
  const [role, setRole] = useState('member')
  const [results, setResults] = useState<Array<{ email: string; status: string; reason?: string }> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  async function handleSend() {
    if (emailList.length === 0) { onNext({}); return }
    setLoading(true)
    setError('')

    const res = await fetch(`/api/networks/${networkId}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails: emailList, role }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao enviar convites.')
      return
    }

    setResults(data.results)
  }

  if (results) {
    const sent = results.filter((r) => r.status === 'sent')
    const skipped = results.filter((r) => r.status === 'skipped')
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div>
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            Convites enviados!
          </h2>
          <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
            {sent.length} convite{sent.length !== 1 ? 's' : ''} enviado{sent.length !== 1 ? 's' : ''} com sucesso.
          </p>
        </div>

        {sent.length > 0 && (
          <div className="flex flex-col gap-1">
            {sent.map((r) => (
              <div key={r.email} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ob-success)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                {r.email}
              </div>
            ))}
          </div>
        )}

        {skipped.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium" style={{ color: 'var(--ob-text-faint)' }}>Ignorados:</p>
            {skipped.map((r) => (
              <div key={r.email} className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
                {r.email} — {r.reason}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => onNext({})}
          className="flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
          style={{ background: 'var(--ob-navy)', color: '#fff' }}
        >
          Ir para o painel →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Convidar membros
        </h2>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Convide sua equipe por e-mail. Você pode fazer isso depois também.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)', color: 'var(--ob-error)' }}>
          {error}
        </div>
      )}

      {/* Email input */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invite-email" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
          E-mails
        </label>
        <div className="flex gap-2">
          <input
            id="invite-email"
            type="email"
            className="ob-input flex-1"
            placeholder="nome@empresa.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addEmail}
          />
          <button
            type="button"
            onClick={addEmail}
            className="flex h-12 items-center rounded-xl px-4 text-sm font-medium transition-all hover:opacity-90"
            style={{ background: 'var(--ob-surface-alt)', border: '1.5px solid var(--ob-border)', color: 'var(--ob-text)' }}
          >
            Adicionar
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
          Digite e pressione Enter, vírgula ou espaço para adicionar. Máximo 20.
        </p>
      </div>

      {/* Email chips */}
      {emailList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emailList.map((email) => (
            <div
              key={email}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)', color: 'var(--ob-text)' }}
            >
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                aria-label={`Remover ${email}`}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
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

      {/* Role */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invite-role" className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>
          Função dos convidados
        </label>
        <select
          id="invite-role"
          className="ob-input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="member">Membro — acesso padrão ao feed e perfis</option>
          <option value="manager">Gestor — pode moderar conteúdo da sua área</option>
          <option value="admin">Admin — gerencia membros e configurações</option>
        </select>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 flex-1 items-center justify-center rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ border: '1.5px solid var(--ob-border)', color: 'var(--ob-text-muted)', background: 'var(--ob-surface)' }}
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          style={{ background: 'var(--ob-navy)', color: '#fff' }}
        >
          {loading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : null}
          {emailList.length > 0 ? `Enviar ${emailList.length} convite${emailList.length !== 1 ? 's' : ''}` : 'Pular e ir para o painel'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [network, setNetwork] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [rootNode, setRootNode] = useState<{ id: string; name: string } | null>(null)

  function handleStep1(data: unknown) {
    const d = data as { network: { id: string; name: string; slug: string }; rootNode: { id: string; name: string } }
    setNetwork(d.network)
    setRootNode(d.rootNode)
    setStep(2)
  }

  function handleStep2() {
    setStep(3)
  }

  function handleStep3() {
    router.push('/dashboard?onboarded=1')
  }

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Configurar minha rede
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Leva menos de 2 minutos para criar sua rede corporativa.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 sm:p-8 max-w-xl"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)' }}
      >
        <StepIndicator current={step} total={3} />

        {step === 1 && <Step1 onNext={handleStep1} />}

        {step === 2 && network && rootNode && (
          <Step2
            onNext={handleStep2}
            onBack={() => setStep(1)}
            networkId={network.id}
            rootNode={rootNode}
          />
        )}

        {step === 3 && network && (
          <Step3
            onNext={handleStep3}
            onBack={() => setStep(2)}
            networkId={network.id}
          />
        )}
      </div>
    </div>
  )
}
