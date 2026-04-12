'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface User {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
  emailVerified: boolean
  createdAt: string
  networksCount: number
}

function Avatar({ user }: { user: User }) {
  const initials = (user.name ?? user.email)
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name ?? user.email}
        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()

  const load = useCallback(async (search: string, p: number, append = false) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (search) params.set('q', search)
    const res = await fetch(`/api/users?${params}`)
    const data = await res.json()
    setUsers((prev) => append ? [...prev, ...data.users] : data.users)
    setHasMore(data.hasMore)
    setLoading(false)
  }, [])

  useEffect(() => { load('', 1) }, [])

  function handleSearch(value: string) {
    setQ(value)
    setPage(1)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => load(value, 1), 350)
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Usuários</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Todos os usuários cadastrados na plataforma</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#f1f5f9', outline: 'none', width: 240 }}
        />
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px', borderBottom: '1px solid #334155' }}>
          {['Usuário', 'E-mail', 'Redes', 'Cadastro'].map((h) => (
            <div key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading && users.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 14 }}>Carregando...</div>
        )}

        {!loading && users.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#475569', fontSize: 14 }}>Nenhum usuário encontrado.</div>
        )}

        {users.map((u, i) => (
          <div
            key={u.id}
            style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px 120px', borderBottom: i < users.length - 1 ? '1px solid #1e293b' : 'none', alignItems: 'center' }}
          >
            {/* User info */}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar user={u} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{u.name ?? '—'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {u.emailVerified ? (
                    <span style={{ fontSize: 10, color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>Verificado</span>
                  ) : (
                    <span style={{ fontSize: 10, color: '#fb923c', background: 'rgba(251,146,60,0.1)', padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>Pendente</span>
                  )}
                </div>
              </div>
            </div>
            {/* Email */}
            <div style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.email}
            </div>
            {/* Networks count */}
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>
              {u.networksCount} {u.networksCount === 1 ? 'rede' : 'redes'}
            </div>
            {/* Created at */}
            <div style={{ padding: '12px 16px', fontSize: 12, color: '#475569' }}>
              {formatDate(u.createdAt)}
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
