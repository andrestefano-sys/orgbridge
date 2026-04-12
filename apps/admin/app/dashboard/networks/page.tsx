'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface Network {
  id: string
  name: string
  slug: string
  status: string
  type: string | null
  industry: string | null
  createdAt: string
  memberCount: number
  plan: string
  subStatus: string
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Ativa', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  suspended: { label: 'Suspensa', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: '#64748b' },
  starter: { label: 'Starter', color: '#3b82f6' },
  business: { label: 'Business', color: '#8b5cf6' },
  enterprise: { label: 'Enterprise', color: '#E9A010' },
}

function Badge({ value, map }: { value: string; map: Record<string, { label: string; color: string; bg?: string }> }) {
  const info = map[value] ?? { label: value, color: '#94a3b8' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, color: info.color, background: (info as { bg?: string }).bg ?? `${info.color}1a` }}>
      {info.label}
    </span>
  )
}

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (search: string, p: number, append = false) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (search) params.set('q', search)
    const res = await fetch(`/api/networks?${params}`)
    const data = await res.json()
    setNetworks((prev) => append ? [...prev, ...data.networks] : data.networks)
    setHasMore(data.hasMore)
    setLoading(false)
  }, [])

  useEffect(() => { load(q, 1) }, [])

  function handleSearch(value: string) {
    setQ(value)
    setPage(1)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => load(value, 1), 350)
  }

  async function toggleStatus(id: string, current: string) {
    const newStatus = current === 'active' ? 'suspended' : 'active'
    setToggling(id)
    await fetch(`/api/networks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setNetworks((prev) => prev.map((n) => n.id === id ? { ...n, status: newStatus } : n))
    setToggling(null)
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(q, next, true)
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Redes</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Gerencie todas as organizações da plataforma</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou slug..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#f1f5f9', outline: 'none', width: 240 }}
        />
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px 80px 100px', gap: 0, borderBottom: '1px solid #334155' }}>
          {['Rede', 'Tipo / Indústria', 'Status', 'Plano', 'Membros', 'Ações'].map((h) => (
            <div key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading && networks.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 14 }}>Carregando...</div>
        )}

        {!loading && networks.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 14 }}>Nenhuma rede encontrada.</div>
        )}

        {networks.map((n, i) => (
          <div
            key={n.id}
            style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px 80px 100px', borderBottom: i < networks.length - 1 ? '1px solid #1e293b' : 'none', alignItems: 'center' }}
          >
            {/* Name */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>{n.name}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>/{n.slug}</div>
            </div>
            {/* Type / Industry */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{n.type ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{n.industry ?? ''}</div>
            </div>
            {/* Status */}
            <div style={{ padding: '12px 16px' }}>
              <Badge value={n.status} map={STATUS_LABELS} />
            </div>
            {/* Plan */}
            <div style={{ padding: '12px 16px' }}>
              <Badge value={n.plan} map={PLAN_LABELS} />
            </div>
            {/* Members */}
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>
              {n.memberCount}
            </div>
            {/* Actions */}
            <div style={{ padding: '12px 16px' }}>
              <button
                onClick={() => toggleStatus(n.id, n.status)}
                disabled={toggling === n.id}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid',
                  cursor: toggling === n.id ? 'not-allowed' : 'pointer',
                  opacity: toggling === n.id ? 0.5 : 1,
                  background: 'transparent',
                  borderColor: n.status === 'active' ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.4)',
                  color: n.status === 'active' ? '#f87171' : '#4ade80',
                }}
              >
                {n.status === 'active' ? 'Suspender' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{ padding: '8px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}
