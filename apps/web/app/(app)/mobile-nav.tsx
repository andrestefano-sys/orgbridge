'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const BASE_NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Início',
    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  },
  {
    href: '/feed',
    label: 'Feed',
    icon: 'M4 6h16M4 12h16M4 18h7',
  },
  {
    href: '/members',
    label: 'Membros',
    icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  },
  {
    href: '/messages',
    label: 'Mensagens',
    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  },
  {
    href: '/org-chart',
    label: 'Organograma',
    icon: 'M12 5a3 3 0 100 6 3 3 0 000-6zM5 19a3 3 0 100-6 3 3 0 000 6zM19 19a3 3 0 100-6 3 3 0 000 6zM12 11v2M12 13l-4 4M12 13l4 4',
  },
  {
    href: '/ai',
    label: 'OrgBridge AI',
    icon: 'M12 2a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5zM5 19a7 7 0 0114 0',
  },
  {
    href: '/notifications',
    label: 'Notificações',
    icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  },
  {
    href: '/settings',
    label: 'Configurações',
    icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  },
]

const ADMIN_NAV_ITEMS = [
  {
    href: '/analytics',
    label: 'Analytics',
    icon: 'M18 20V10M12 20V4M6 20v-6',
  },
  {
    href: '/moderation',
    label: 'Moderação',
    icon: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  },
  {
    href: '/billing',
    label: 'Assinatura',
    icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  },
]

interface Props {
  userId: string
  name: string
  isAdmin?: boolean
}

export function MobileNav({ userId, name, isAdmin = false }: Props) {
  const [open, setOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const pathname = usePathname()
  const NAV_ITEMS = isAdmin ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS] : BASE_NAV_ITEMS

  // Poll unread DM count
  useEffect(() => {
    fetch('/api/messages/unread').then((r) => r.json()).then((d) => setUnreadMessages(d.unread ?? 0)).catch(() => null)
    const iv = setInterval(() => {
      fetch('/api/messages/unread').then((r) => r.json()).then((d) => setUnreadMessages(d.unread ?? 0)).catch(() => null)
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  // Reset badge when visiting messages
  useEffect(() => {
    if (pathname === '/messages' || pathname.startsWith('/messages/')) setUnreadMessages(0)
  }, [pathname])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-70"
        style={{ color: 'var(--ob-text-muted)' }}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.4)', top: '56px' }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <nav
        className="sm:hidden fixed left-0 right-0 z-40 flex flex-col"
        style={{
          top: '56px',
          background: 'var(--ob-surface)',
          borderBottom: '1px solid var(--ob-border)',
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: open ? 'auto' : 'none',
          boxShadow: open ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
        }}
        aria-hidden={!open}
      >
        {/* User identity strip */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid var(--ob-border)' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold select-none flex-shrink-0"
            style={{ background: 'var(--ob-amber)', color: 'var(--ob-navy)', fontFamily: 'var(--font-sora)' }}
          >
            {name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
              {name}
            </p>
            <Link
              href={`/profile/${userId}`}
              className="text-xs hover:underline"
              style={{ color: 'var(--ob-amber-dim)' }}
            >
              Ver meu perfil →
            </Link>
          </div>
        </div>

        {/* Nav links */}
        <div className="py-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium transition-all"
                style={{
                  color: active ? 'var(--ob-text)' : 'var(--ob-text-muted)',
                  background: active ? 'var(--ob-surface-alt)' : 'transparent',
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={item.icon} />
                </svg>
                {item.label}
                {item.href === '/messages' && unreadMessages > 0 && !active && (
                  <span
                    className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold px-1"
                    style={{ background: '#f43f5e', color: '#fff', fontFamily: 'var(--font-sora)' }}
                  >
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
                {active && (
                  <div
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--ob-amber)' }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Sign out */}
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--ob-border)' }}>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 text-sm font-medium w-full transition-all hover:opacity-70"
            style={{ color: 'var(--ob-error)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sair da conta
          </button>
        </div>
      </nav>
    </>
  )
}
