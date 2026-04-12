'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  targetType: string | null
  targetId: string | null
  createdAt: string
  actor: { id: string; name: string } | null
}

const TYPE_ICONS: Record<string, { path: string; color: string }> = {
  new_reaction:    { path: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z', color: '#f43f5e' },
  new_comment:     { path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', color: '#6366f1' },
  new_message:     { path: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z', color: '#f43f5e' },
  recognition:     { path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z', color: '#E9A010' },
  new_member:      { path: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M11 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6', color: '#22c55e' },
  invite_accepted: { path: 'M5 13l4 4L19 7', color: '#22c55e' },
  announcement:    { path: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', color: '#06b6d4' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getTargetHref(n: Notification): string | null {
  if (n.type === 'new_message') return '/messages'
  if (n.targetType === 'post') return '/feed'
  if (n.targetType === 'member' && n.targetId) return `/profile/${n.targetId}`
  return null
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (!data.error) {
        setItems(data.items ?? [])
        setUnread(data.unread ?? 0)
      }
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [loading])

  // Fetch unread count on mount + poll every 60s
  useEffect(() => {
    fetch('/api/notifications').then((r) => r.json()).then((data) => {
      if (!data.error) setUnread(data.unread ?? 0)
    })
    const interval = setInterval(() => {
      fetch('/api/notifications').then((r) => r.json()).then((data) => {
        if (!data.error) setUnread(data.unread ?? 0)
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  async function handleOpen() {
    setOpen((v) => !v)
    if (!loaded) await fetchNotifications()
  }

  async function markAllRead() {
    if (unread === 0) return
    setUnread(0)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-70"
        style={{ color: 'var(--ob-text-muted)' }}
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-0.5"
            style={{ background: '#f43f5e', color: '#fff', fontFamily: 'var(--font-sora)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50 animate-fade-in"
          style={{
            background: 'var(--ob-surface)',
            border: '1px solid var(--ob-border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
          }}
          role="dialog"
          aria-label="Notificações"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--ob-border)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
              Notificações
            </h2>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--ob-amber-dim)' }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Body */}
          <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
            {loading && !loaded ? (
              <div className="flex items-center justify-center py-10" style={{ color: 'var(--ob-text-faint)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center" style={{ color: 'var(--ob-text-faint)' }}>
                <svg className="mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              items.map((n, i) => {
                const iconInfo = TYPE_ICONS[n.type] ?? TYPE_ICONS['new_comment']!
                const href = getTargetHref(n)
                const content = (
                  <div
                    className="flex items-start gap-3 px-4 py-3 transition-all hover:opacity-80"
                    style={{
                      borderTop: i > 0 ? '1px solid var(--ob-border)' : 'none',
                      background: n.read ? 'transparent' : 'rgba(233,160,16,0.04)',
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full mt-0.5"
                      style={{ background: `${iconInfo.color}15`, color: iconInfo.color }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d={iconInfo.path} />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: 'var(--ob-text)' }}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--ob-text-muted)' }}>
                          {n.body}
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: 'var(--ob-text-faint)' }}>
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div className="flex-shrink-0 mt-2 h-2 w-2 rounded-full" style={{ background: 'var(--ob-amber)' }} />
                    )}
                  </div>
                )

                return href ? (
                  <Link key={n.id} href={href} onClick={() => setOpen(false)} style={{ display: 'block' }}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                )
              })
            )}
          </div>

          {/* Footer — ver todas */}
          <div style={{ borderTop: '1px solid var(--ob-border)' }}>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--ob-amber-dim)' }}
            >
              Ver todas as notificações
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
