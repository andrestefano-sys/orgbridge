'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

interface Props {
  userId: string
  name: string
  email: string
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold select-none flex-shrink-0"
      style={{ background: 'var(--ob-amber)', color: 'var(--ob-navy)', fontFamily: 'var(--font-sora)' }}
      aria-hidden
    >
      {initials}
    </div>
  )
}

export function UserMenu({ userId, name, email }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const firstName = name.split(' ')[0] ?? name

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-all hover:opacity-80"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
      >
        <span className="hidden text-sm md:block" style={{ color: 'var(--ob-text-muted)' }}>
          {firstName}
        </span>
        <Avatar name={name} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl py-1 z-50 animate-fade-in"
          style={{
            background: 'var(--ob-surface)',
            border: '1px solid var(--ob-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
          role="menu"
        >
          {/* User identity */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--ob-border)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
              {name}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ob-text-muted)' }}>{email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href={`/profile/${userId}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:opacity-70"
              style={{ color: 'var(--ob-text)' }}
              role="menuitem"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Meu perfil
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all hover:opacity-70"
              style={{ color: 'var(--ob-text)' }}
              role="menuitem"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
              Configurações
            </Link>
          </div>

          <div style={{ borderTop: '1px solid var(--ob-border)' }} className="py-1">
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/login' }) }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-all hover:opacity-70"
              style={{ color: 'var(--ob-error)' }}
              role="menuitem"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sair da conta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
