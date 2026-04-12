'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  {
    href: '/dashboard',
    label: 'Visão Geral',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.9" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" fillOpacity="0.5" />
      </svg>
    ),
  },
  {
    href: '/dashboard/networks',
    label: 'Redes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="3" r="2" fill="currentColor" />
        <circle cx="3" cy="12" r="2" fill="currentColor" fillOpacity="0.6" />
        <circle cx="13" cy="12" r="2" fill="currentColor" fillOpacity="0.6" />
        <line x1="8" y1="5" x2="3" y2="10" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
        <line x1="8" y1="5" x2="13" y2="10" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/users',
    label: 'Usuários',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" fill="currentColor" />
        <path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: '#0a111e', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="2.5" fill="#E9A010" />
                <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.5)" />
                <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.5)" />
                <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.4)" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.4)" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>OrgBridge</div>
              <div style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#E9A010' : '#94a3b8',
                  background: active ? 'rgba(233,160,16,0.08)' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: 2,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ color: active ? '#E9A010' : '#64748b' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
