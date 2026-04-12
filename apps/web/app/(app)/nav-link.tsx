'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150"
      style={{
        color: active ? 'var(--ob-text)' : 'var(--ob-text-muted)',
        background: active ? 'var(--ob-surface-alt)' : 'transparent',
      }}
    >
      {label}
    </Link>
  )
}
