'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function MessagesNavLink() {
  const pathname = usePathname()
  const active = pathname === '/messages' || pathname.startsWith('/messages')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch('/api/messages/unread')
      .then((r) => r.json())
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => null)

    const interval = setInterval(() => {
      fetch('/api/messages/unread')
        .then((r) => r.json())
        .then((d) => setUnread(d.unread ?? 0))
        .catch(() => null)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Reset badge when visiting messages
  useEffect(() => {
    if (active) setUnread(0)
  }, [active])

  return (
    <Link
      href="/messages"
      className="relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150"
      style={{
        color: active ? 'var(--ob-text)' : 'var(--ob-text-muted)',
        background: active ? 'var(--ob-surface-alt)' : 'transparent',
      }}
    >
      Mensagens
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-0.5"
          style={{ background: '#f43f5e', color: '#fff', fontFamily: 'var(--font-sora)' }}
          aria-label={`${unread} mensagens não lidas`}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
