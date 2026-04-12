'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────
interface Analytics {
  period: number
  since: string
  members: {
    total: number
    newInPeriod: number
    byRole: Array<{ role: string; count: number }>
  }
  posts: {
    total: number
    inPeriod: number
    byType: Array<{ type: string; count: number }>
  }
  engagement: {
    comments: number
    reactions: number
  }
  topPosters: Array<{
    authorId: string
    postCount: number
    user: { id: string; name: string | null; avatarUrl: string | null } | null
  }>
  topPosts: Array<{
    id: string
    content: string
    type: string
    reactionsCount: number
    commentsCount: number
    createdAt: string
    author: { id: string; name: string | null } | null
  }>
  dailyActivity: Array<{ date: string; posts: number }>
}

// ─── Helpers ──────────────────────────────────────────────────
function pct(part: number, total: number) {
  if (total === 0) return 0
  return Math.round((part / total) * 100)
}

const TYPE_LABELS: Record<string, string> = {
  text: 'Publicações',
  recognition: 'Reconhecimentos',
  announcement: 'Comunicados',
  document: 'Documentos',
}

const TYPE_COLORS: Record<string, string> = {
  text: '#6366f1',
  recognition: '#E9A010',
  announcement: '#8b5cf6',
  document: '#06b6d4',
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dono',
  admin: 'Admin',
  manager: 'Gestor',
  member: 'Membro',
}

const ROLE_COLORS: Record<string, string> = {
  owner: '#E9A010',
  admin: '#818cf8',
  manager: '#4ade80',
  member: '#94a3b8',
}

function initials(name: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Activity Chart (SVG sparkline area chart) ───────────────
function ActivityChart({ data, period }: { data: Array<{ date: string; posts: number }>; period: string }) {
  const W = 600
  const H = 80
  const PAD = { top: 8, bottom: 24, left: 4, right: 4 }

  if (data.length === 0) return null

  const maxVal = Math.max(...data.map((d) => d.posts), 1)

  function xForIndex(i: number) {
    return PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right)
  }

  function yForVal(v: number) {
    return PAD.top + (1 - v / maxVal) * (H - PAD.top - PAD.bottom)
  }

  // Build path
  const points = data.map((d, i) => `${xForIndex(i)},${yForVal(d.posts)}`)
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `M ${xForIndex(0)},${H - PAD.bottom} L ${points.join(' L ')} L ${xForIndex(data.length - 1)},${H - PAD.bottom} Z`

  // Label tick every N days
  const labelStep = period === '7' ? 1 : period === '30' ? 7 : 30
  const tickLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i === 0 || i === data.length - 1 || i % labelStep === 0)

  function fmtDate(iso: string) {
    const [, mm, dd] = iso.split('-')
    return `${dd}/${mm}`
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H, display: 'block' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ob-amber)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--ob-amber)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((frac) => (
        <line
          key={frac}
          x1={PAD.left}
          y1={yForVal(maxVal * frac)}
          x2={W - PAD.right}
          y2={yForVal(maxVal * frac)}
          stroke="var(--ob-border)"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#actGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--ob-amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on non-zero points */}
      {data.map((d, i) => d.posts > 0 && (
        <circle
          key={i}
          cx={xForIndex(i)}
          cy={yForVal(d.posts)}
          r="2.5"
          fill="var(--ob-amber)"
        />
      ))}

      {/* X-axis tick labels */}
      {tickLabels.map(({ d, i }) => (
        <text
          key={i}
          x={xForIndex(i)}
          y={H - 4}
          textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          fontSize="9"
          fill="var(--ob-text-faint)"
          fontFamily="var(--font-dm-sans), sans-serif"
        >
          {fmtDate(d.date)}
        </text>
      ))}
    </svg>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────
function BarChart({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span
            className="w-28 text-xs flex-shrink-0 text-right truncate"
            style={{ color: 'var(--ob-text-muted)' }}
          >
            {item.label}
          </span>
          <div className="flex-1 relative" style={{ height: 20 }}>
            <div
              className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
              style={{
                width: `${pct(item.value, max)}%`,
                background: item.color,
                minWidth: item.value > 0 ? 4 : 0,
                opacity: 0.85,
              }}
            />
          </div>
          <span
            className="w-8 text-xs font-semibold flex-shrink-0"
            style={{ color: 'var(--ob-text)' }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────
function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string | undefined
  accent?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: accent ? 'var(--ob-navy)' : 'var(--ob-surface)',
        border: `1px solid ${accent ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
      }}
    >
      <p
        className="text-3xl font-bold tracking-tight mb-1"
        style={{ color: accent ? '#fff' : 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
      >
        {value}
      </p>
      <p className="text-sm" style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--ob-text-muted)' }}>
        {label}
      </p>
      {sub && (
        <p
          className="text-xs mt-1"
          style={{ color: accent ? 'rgba(255,255,255,0.4)' : 'var(--ob-text-faint)' }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-5"
          style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)', height: 100 }}
        >
          <div className="h-7 w-16 rounded mb-2" style={{ background: 'var(--ob-border)' }} />
          <div className="h-3.5 w-24 rounded" style={{ background: 'var(--ob-border)' }} />
        </div>
      ))}
    </div>
  )
}

// ─── Client Component ─────────────────────────────────────────
const PERIODS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
]

export function AnalyticsClient({ networkId }: { networkId: string }) {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/networks/${networkId}/analytics?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [networkId, period])

  const totalPosts = data?.posts.total ?? 0
  const engagement = data ? data.engagement.comments + data.engagement.reactions : 0

  return (
    <div className="animate-fade-slide-up max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight mb-0.5"
            style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
          >
            Analytics
          </h1>
          <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
            Engajamento e atividade da rede
          </p>
        </div>

        {/* Period selector */}
        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: period === p.value ? 'var(--ob-navy)' : 'transparent',
                color: period === p.value ? '#fff' : 'var(--ob-text-muted)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : error || !data ? (
        <div className="text-center py-16" style={{ color: 'var(--ob-text-muted)' }}>
          Erro ao carregar dados.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              label="Membros ativos"
              value={data.members.total}
              sub={
                data.members.newInPeriod > 0
                  ? `+${data.members.newInPeriod} nos últimos ${period}d`
                  : undefined
              }
              accent
            />
            <Stat
              label="Posts no período"
              value={data.posts.inPeriod}
              sub={`${totalPosts} total`}
            />
            <Stat
              label="Comentários"
              value={data.engagement.comments}
              sub={`nos últimos ${period} dias`}
            />
            <Stat
              label="Reações"
              value={data.engagement.reactions}
              sub={`nos últimos ${period} dias`}
            />
          </div>

          {/* Daily activity chart */}
          {data.dailyActivity && data.dailyActivity.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                >
                  Publicações por dia
                </h3>
                <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                  últimos {period} dias
                </span>
              </div>
              <ActivityChart data={data.dailyActivity} period={period} />
              <div className="flex items-center justify-between mt-3 text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                <span>
                  Pico: {Math.max(...data.dailyActivity.map((d) => d.posts))} post{Math.max(...data.dailyActivity.map((d) => d.posts)) !== 1 ? 's' : ''}
                </span>
                <span>
                  Média: {(data.posts.inPeriod / data.dailyActivity.length).toFixed(1)}/dia
                </span>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Card title="Publicações por tipo">
              {data.posts.byType.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ob-text-faint)' }}>
                  Nenhum post ainda.
                </p>
              ) : (
                <BarChart
                  items={data.posts.byType.map((t) => ({
                    label: TYPE_LABELS[t.type] ?? t.type,
                    value: t.count,
                    color: TYPE_COLORS[t.type] ?? '#94a3b8',
                  }))}
                />
              )}
            </Card>

            <Card title="Membros por função">
              <BarChart
                items={data.members.byRole.map((r) => ({
                  label: ROLE_LABELS[r.role] ?? r.role,
                  value: r.count,
                  color: ROLE_COLORS[r.role] ?? '#94a3b8',
                }))}
              />
            </Card>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Top posters */}
            <Card title={`Membros mais ativos — últimos ${period} dias`}>
              {data.topPosters.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ob-text-faint)' }}>
                  Nenhuma atividade ainda.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.topPosters.map((p, i) => (
                    <Link
                      key={p.authorId}
                      href={`/profile/${p.authorId}`}
                      className="flex items-center gap-3 transition-opacity hover:opacity-80"
                    >
                      <span
                        className="flex-shrink-0 w-5 text-xs font-bold text-center"
                        style={{
                          color: i === 0 ? 'var(--ob-amber)' : 'var(--ob-text-faint)',
                          fontFamily: 'var(--font-sora)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: 'var(--ob-navy)',
                          color: 'var(--ob-amber)',
                          fontFamily: 'var(--font-sora)',
                        }}
                      >
                        {initials(p.user?.name ?? null)}
                      </div>
                      <span
                        className="flex-1 text-sm truncate"
                        style={{ color: 'var(--ob-text)' }}
                      >
                        {p.user?.name ?? 'Membro'}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                        >
                          {p.postCount}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                          posts
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            {/* Top posts */}
            <Card title={`Posts mais populares — últimos ${period} dias`}>
              {data.topPosts.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--ob-text-faint)' }}>
                  Nenhum post ainda.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.topPosts.map((p, i) => (
                    <div key={p.id} className="flex items-start gap-3">
                      <span
                        className="flex-shrink-0 w-5 text-xs font-bold text-center mt-0.5"
                        style={{
                          color: i === 0 ? 'var(--ob-amber)' : 'var(--ob-text-faint)',
                          fontFamily: 'var(--font-sora)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium mb-0.5 truncate"
                          style={{ color: 'var(--ob-text-muted)' }}
                        >
                          {p.author?.name ?? 'Membro'}
                        </p>
                        <p
                          className="text-sm line-clamp-2 leading-snug"
                          style={{ color: 'var(--ob-text)' }}
                        >
                          {p.content}
                        </p>
                        <div
                          className="flex items-center gap-3 mt-1 text-xs"
                          style={{ color: 'var(--ob-text-faint)' }}
                        >
                          <span>{p.reactionsCount} reações</span>
                          <span>{p.commentsCount} comentários</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Engagement summary */}
          {data.members.total > 0 && data.posts.inPeriod > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
              >
                Resumo de engajamento — últimos {period} dias
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Taxa de posts/membro',
                    value: (data.posts.inPeriod / data.members.total).toFixed(1),
                    suffix: 'posts/membro',
                  },
                  {
                    label: 'Engajamento total',
                    value: engagement,
                    suffix: 'interações',
                  },
                  {
                    label: 'Média reações/post',
                    value:
                      data.posts.inPeriod > 0
                        ? (data.engagement.reactions / data.posts.inPeriod).toFixed(1)
                        : '0',
                    suffix: 'por post',
                  },
                  {
                    label: 'Novos membros',
                    value: data.members.newInPeriod,
                    suffix: `em ${period} dias`,
                  },
                ].map((m) => (
                  <div key={m.label}>
                    <p
                      className="text-2xl font-bold mb-0.5"
                      style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                    >
                      {m.value}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>
                      {m.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                      {m.suffix}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
