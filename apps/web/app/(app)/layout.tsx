import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NavLink } from './nav-link'
import { MessagesNavLink } from './messages-nav-link'
import { UserMenu } from './user-menu'
import { MobileNav } from './mobile-nav'
import { ConductGate } from './conduct-gate'
import { NotificationBell } from './notification-bell'
import { GlobalSearch } from './global-search'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  const userName = session.user?.name ?? 'Usuário'
  const userEmail = session.user?.email ?? ''
  const userId = session.user?.id ?? ''

  // Lookup membership + network for conduct gate and logo
  const membership = userId
    ? await db.query.networkMembers.findFirst({
        where: eq(networkMembers.userId, userId),
        with: { network: true },
      })
    : null

  const networkLogoUrl = (membership as any)?.network?.logoUrl as string | null ?? null
  const networkName = (membership as any)?.network?.name as string | null ?? null

  return (
    <div className="min-h-svh" style={{ background: 'var(--ob-surface-alt)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between px-5 sm:px-8"
        style={{
          background: 'var(--ob-surface)',
          borderBottom: '1px solid var(--ob-border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Left — Logo + Desktop Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="OrgBridge — início">
            {networkLogoUrl ? (
              <img
                src={networkLogoUrl}
                alt={networkName ?? 'Logo'}
                width={28}
                height={28}
                className="rounded-lg object-cover flex-shrink-0"
                style={{ width: 28, height: 28 }}
              />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                style={{ background: 'var(--ob-navy)' }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" />
                  <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
                  <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
                  <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
                  <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <span
              className="text-base font-semibold tracking-tight"
              style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
            >
              {networkName ?? 'OrgBridge'}
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <NavLink href="/dashboard" label="Início" />
            <NavLink href="/feed" label="Feed" />
            <NavLink href="/members" label="Membros" />
            <MessagesNavLink />
            <NavLink href="/org-chart" label="Organograma" />
            <NavLink href="/ai" label="AI" />
            {membership && ['owner', 'admin'].includes(membership.role) && (
              <>
                <NavLink href="/analytics" label="Analytics" />
                <NavLink href="/moderation" label="Moderação" />
                <NavLink href="/billing" label="Assinatura" />
              </>
            )}
          </nav>
        </div>

        {/* Right — Desktop: search + notifications + settings + user menu | Mobile: hamburger */}
        <div className="flex items-center gap-2">
          {/* Global search */}
          {membership && (
            <GlobalSearch networkId={membership.networkId} />
          )}

          {/* Notification bell */}
          <div className="hidden sm:block">
            <NotificationBell />
          </div>

          {/* Desktop settings icon */}
          <Link
            href="/settings"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-70"
            style={{ color: 'var(--ob-text-muted)' }}
            aria-label="Configurações"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </Link>

          {/* Desktop user menu (dropdown with sign out) */}
          <div className="hidden sm:block">
            <UserMenu userId={userId} name={userName} email={userEmail} />
          </div>

          {/* Mobile hamburger + drawer */}
          <MobileNav
            userId={userId}
            name={userName}
            isAdmin={!!membership && ['owner', 'admin'].includes(membership.role)}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>

      {/* Code of Conduct gate — shows modal if user hasn't accepted */}
      {membership && <ConductGate networkId={membership.networkId} />}
    </div>
  )
}
