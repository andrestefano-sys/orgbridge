'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  targetType: string | null
  targetId: string | null
  createdAt: string
  actor: { id: string; name: string | null } | null
}

// ─── Type config ──────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  new_comment:   { icon: '💬', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  new_reaction:  { icon: '⭐', color: 'var(--ob-amber)', bg: 'rgba(233,160,16,0.1)' },
  new_member:    { icon: '👋', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  recognition:   { icon: '🏆', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  announcement:  { icon: '📢', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  invite_accepted: { icon: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
}

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: '🔔', color: 'var(--ob-text-muted)', bg: 'var(--ob-surface-alt)' }
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
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function targetHref(item: NotificationItem): string | null {
  if (item.targetType === 'post') return '/feed'
  if (item.targetType === 'member' && item.targetId) return `/profile/${item.targetId}`
  return null
}

// ─── Notification Row ─────────────────────────────────────────
function NotifRow({
  item,
  onMarkRead,
}: {
  item: NotificationItem
  onMarkRead: (id: string) => void
}) {
  const cfg = getConfig(item.type)
  const href = targetHref(item)

  const content = (
    <div
      className="flex items-start gap-4 px-5 py-4 transition-colors"
      style={{
        background: item.read ? 'transparent' : 'rgba(233,160,16,0.04)',
        borderLeft: item.read ? '3px solid transparent' : '3px solid var(--ob-amber)',
      }}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: cfg.bg }}
        aria-hidden
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug mb-0.5"
          style={{
            color: 'var(--ob-text)',
            fontFamily: 'var(--font-sora)',
            fontWeight: item.read ? 400 : 600,
          }}
        >
          {item.title}
        </p>
        {item.body && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--ob-text-muted)' }}>
            {item.body}
          </p>
        )}
        <p className="mt-1 text-xs" style={{ color: 'var(--ob-text-faint)' }}>
          {timeAgo(item.createdAt)}
          {item.actor?.name && (
            <> · <span style={{ color: 'var(--ob-text-muted)' }}>{item.actor.name}</span></>
          )}
        </p>
      </div>

      {/* Unread dot + mark read */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {!item.read && (
          <>
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: 'var(--ob-amber)' }}
              aria-label="Não lida"
            />
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(item.id) }}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--ob-text-faint)' }}
              aria-label="Marcar como lida"
            >
              Lida
            </button>
          </>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block hover:bg-black/[0.02] transition-colors">
        {content}
      </Link>
    )
  }
  return <div>{content}</div>
}

// ─── Empty State ──────────────────────────────────────────────
function Empty() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          Tudo em dia
        </p>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Você não tem notificações ainda.
        </p>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="flex flex-col gap-0">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-start gap-4 px-5 py-4 animate-pulse"
          style={{ borderBottom: '1px solid var(--ob-border)' }}
        >
          <div className="h-10 w-10 rounded-xl flex-shrink-0" style={{ background: 'var(--ob-border)' }} />
          <div className="flex-1">
            <div className="h-3.5 w-2/3 rounded mb-2" style={{ background: 'var(--ob-border)' }} />
            <div className="h-3 w-1/3 rounded" style={{ background: 'var(--ob-border)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Filter Tabs ──────────────────────────────────────────────
const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'new_comment', label: 'Comentários' },
  { key: 'new_reaction', label: 'Reações' },
  { key: 'recognition', label: 'Reconhecimentos' },
  { key: 'new_member', label: 'Membros' },
]

// ─── Page ─────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifs = useCallback(async (cursor?: string) => {
    const url = `/api/notifications${cursor ? `?cursor=${cursor}` : ''}`
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json() as Promise<{ items: NotificationItem[]; nextCursor: string | null; unread: number }>
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchNotifs().then((data) => {
      if (data) {
        setItems(data.items)
        setNextCursor(data.nextCursor)
      }
      setLoading(false)
    })
  }, [fetchNotifs])

  async function loadMore() {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const data = await fetchNotifs(nextCursor)
    if (data) {
      setItems((prev) => [...prev, ...data.items])
      setNextCursor(data.nextCursor)
    }
    setLoadingMore(false)
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })
  }

  async function markAllRead() {
    setMarkingAll(true)
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setMarkingAll(false)
  }

  const filtered = items.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const unreadCount = items.filter((n) => !n.read).length

  return (
    <div className="max-w-2xl mx-auto animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight mb-0.5"
            style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
          >
            Notificações
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
              {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
            style={{ border: '1px solid var(--ob-border)', color: 'var(--ob-text-muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {markingAll ? 'Marcando...' : 'Marcar todas como lidas'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => {
          const count = f.key === 'unread'
            ? items.filter((n) => !n.read).length
            : f.key === 'all'
            ? undefined
            : items.filter((n) => n.type === f.key).length

          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: filter === f.key ? 'var(--ob-navy)' : 'var(--ob-surface)',
                color: filter === f.key ? '#fff' : 'var(--ob-text-muted)',
                border: `1px solid ${filter === f.key ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
              }}
            >
              {f.label}
              {count !== undefined && count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                  style={{
                    background: filter === f.key ? 'rgba(255,255,255,0.2)' : 'var(--ob-surface-alt)',
                    color: filter === f.key ? '#fff' : 'var(--ob-text-faint)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
      >
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <Empty />
        ) : (
          <>
            <div>
              {filtered.map((item, i) => (
                <div
                  key={item.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--ob-border)' : 'none' }}
                >
                  <NotifRow item={item} onMarkRead={markRead} />
                </div>
              ))}
            </div>

            {nextCursor && filter === 'all' && (
              <div
                className="flex items-center justify-center py-4"
                style={{ borderTop: '1px solid var(--ob-border)' }}
              >
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ color: 'var(--ob-amber-dim)' }}
                >
                  {loadingMore ? 'Carregando...' : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
