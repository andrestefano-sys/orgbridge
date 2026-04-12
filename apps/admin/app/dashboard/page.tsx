'use client'

import { useEffect, useState } from 'react'

interface Stats {
  totalNetworks: number
  totalUsers: number
  activeMembers: number
  newUsersLast30d: number
  mrr: number
  planCounts: Record<string, number>
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ? '#E9A010' : '#f1f5f9', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

const PLANS = [
  { key: 'free', label: 'Free', color: '#475569' },
  { key: 'starter', label: 'Starter', color: '#3b82f6' },
  { key: 'business', label: 'Business', color: '#8b5cf6' },
  { key: 'enterprise', label: 'Enterprise', color: '#E9A010' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false) })
      .catch(() => { setError('Erro ao carregar estatísticas.'); setLoading(false) })
  }, [])

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' }}>Visão Geral</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Métricas consolidadas da plataforma</p>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#475569', fontSize: 14 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </svg>
          Carregando...
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', color: '#f87171', fontSize: 14 }}>
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard label="MRR" value={`R$ ${stats.mrr.toLocaleString('pt-BR')}`} sub="Receita mensal recorrente" accent />
            <StatCard label="Total de Redes" value={stats.totalNetworks.toLocaleString('pt-BR')} />
            <StatCard label="Total de Usuários" value={stats.totalUsers.toLocaleString('pt-BR')} />
            <StatCard label="Membros Ativos" value={stats.activeMembers.toLocaleString('pt-BR')} />
            <StatCard label="Novos (30d)" value={`+${stats.newUsersLast30d.toLocaleString('pt-BR')}`} sub="Usuários novos nos últimos 30 dias" />
          </div>

          {/* Plan distribution */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '24px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 20 }}>Distribuição de Planos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PLANS.map(({ key, label, color }) => {
                const count = stats.planCounts[key] ?? 0
                const total = Object.values(stats.planCounts).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{count} <span style={{ color: '#475569', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: 6, background: '#0f172a', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
