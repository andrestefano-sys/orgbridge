import { auth } from '@orgbridge/auth'
import { db, networkMembers, networks, posts, contentReports } from '@orgbridge/db'
import { and, count, eq, gte, desc } from 'drizzle-orm'
import Link from 'next/link'
import { OnboardedBanner } from './onboarded-banner'

// ─── Icons ────────────────────────────────────────────────────
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function FeedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
      <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

function OrgChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <rect x="2" y="15" width="6" height="4" rx="1" />
      <rect x="9" y="15" width="6" height="4" rx="1" />
      <rect x="16" y="15" width="6" height="4" rx="1" />
      <path d="M12 6v3M5 15V12H19v3" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sublabel,
  accent,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sublabel?: string
  accent?: boolean
  href?: string
}) {
  const inner = (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5 transition-all duration-150"
      style={{
        background: accent ? 'var(--ob-navy)' : 'var(--ob-surface)',
        border: `1px solid ${accent ? 'var(--ob-navy)' : 'var(--ob-border)'}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{
          background: accent ? 'rgba(233,160,16,0.15)' : 'var(--ob-surface-alt)',
          color: accent ? 'var(--ob-amber)' : 'var(--ob-text-muted)',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-2xl font-bold tracking-tight"
          style={{ color: accent ? '#fff' : 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          {value}
        </p>
        <p
          className="text-sm mt-0.5"
          style={{ color: accent ? 'rgba(255,255,255,0.6)' : 'var(--ob-text-muted)' }}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className="text-xs mt-1"
            style={{ color: accent ? 'rgba(255,255,255,0.4)' : 'var(--ob-text-faint)' }}
          >
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-95 active:scale-[0.99] transition-transform">
        {inner}
      </Link>
    )
  }
  return inner
}

// ─── Recent Post Preview ──────────────────────────────────────
function PostPreview({
  post,
}: {
  post: {
    id: string
    content: string
    type: string
    createdAt: Date
    author: { name: string | null } | null
    recognizedUser: { name: string | null } | null
  }
}) {
  const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
    recognition: { label: 'Reconhecimento', color: 'var(--ob-amber-dim)', bg: 'rgba(233,160,16,0.1)' },
    announcement: { label: 'Comunicado', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    text: { label: 'Publicação', color: 'var(--ob-text-faint)', bg: 'var(--ob-surface-alt)' },
  }
  const badge = typeLabels[post.type] ?? typeLabels.text!

  const diffMs = Date.now() - new Date(post.createdAt).getTime()
  const mins = Math.floor(diffMs / 60000)
  const timeStr = mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`

  return (
    <div
      className="flex items-start gap-3 py-3"
      style={{ borderBottom: '1px solid var(--ob-border)' }}
    >
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5"
        style={{ background: badge.bg }}
      >
        <span className="text-sm" aria-hidden>
          {post.type === 'recognition' ? '🏆' : post.type === 'announcement' ? '📢' : '✏️'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium" style={{ color: 'var(--ob-text-muted)' }}>
            {post.author?.name ?? 'Membro'}
          </span>
          {post.type === 'recognition' && post.recognizedUser && (
            <>
              <span className="text-xs" style={{ color: 'var(--ob-text-faint)' }}>→</span>
              <span className="text-xs font-medium" style={{ color: 'var(--ob-amber-dim)' }}>
                {post.recognizedUser.name}
              </span>
            </>
          )}
          <span className="ml-auto text-xs flex-shrink-0" style={{ color: 'var(--ob-text-faint)' }}>{timeStr}</span>
        </div>
        <p className="text-sm leading-snug line-clamp-2" style={{ color: 'var(--ob-text)' }}>
          {post.content}
        </p>
      </div>
    </div>
  )
}

// ─── Quick Link ───────────────────────────────────────────────
function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:opacity-80"
      style={{ background: 'var(--ob-surface-alt)', border: '1px solid var(--ob-border)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
          style={{ background: 'var(--ob-surface)', color: 'var(--ob-text-muted)' }}
        >
          {icon}
        </div>
        <span className="text-sm font-medium" style={{ color: 'var(--ob-text)' }}>{label}</span>
      </div>
      <span style={{ color: 'var(--ob-text-faint)' }}><ArrowRightIcon /></span>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────
interface DashboardProps {
  searchParams: Promise<{ onboarded?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const sp = await searchParams
  const justOnboarded = sp.onboarded === '1'
  const session = await auth()
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Usuário'
  const userId = session?.user?.id

  const membership = userId
    ? await db.query.networkMembers.findFirst({
        where: eq(networkMembers.userId, userId),
        with: { network: true },
      })
    : null

  const hasNetwork = !!membership
  const networkId = membership?.networkId ?? null
  const isAdmin = membership && ['owner', 'admin'].includes(membership.role)

  // Metrics — only if in a network
  let memberCount = 0
  let postsThisWeek = 0
  let recognitionsTotal = 0
  let pendingReports = 0
  let recentPosts: Array<{
    id: string
    content: string
    type: string
    createdAt: Date
    author: { name: string | null } | null
    recognizedUser: { name: string | null } | null
  }> = []

  if (networkId) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [memberCountResult, postsWeekResult, recognitionsResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(networkMembers)
        .where(and(eq(networkMembers.networkId, networkId), eq(networkMembers.status, 'active'))),
      db
        .select({ count: count() })
        .from(posts)
        .where(and(
          eq(posts.networkId, networkId),
          eq(posts.status, 'published'),
          gte(posts.createdAt, oneWeekAgo),
        )),
      db
        .select({ count: count() })
        .from(posts)
        .where(and(
          eq(posts.networkId, networkId),
          eq(posts.status, 'published'),
          eq(posts.type, 'recognition'),
        )),
    ])

    memberCount = memberCountResult[0]?.count ?? 0
    postsThisWeek = postsWeekResult[0]?.count ?? 0
    recognitionsTotal = recognitionsResult[0]?.count ?? 0

    if (isAdmin) {
      const reportsResult = await db
        .select({ count: count() })
        .from(contentReports)
        .where(and(
          eq(contentReports.networkId, networkId),
          eq(contentReports.status, 'pending'),
        ))
      pendingReports = reportsResult[0]?.count ?? 0
    }

    recentPosts = await db.query.posts.findMany({
      where: and(eq(posts.networkId, networkId), eq(posts.status, 'published')),
      orderBy: [desc(posts.createdAt)],
      limit: 5,
      with: {
        author: { columns: { name: true } },
        recognizedUser: { columns: { name: true } },
      },
      columns: { id: true, content: true, type: true, createdAt: true },
    })
  }

  return (
    <div className="animate-fade-slide-up">
      {/* Onboarded welcome banner */}
      {justOnboarded && <OnboardedBanner networkName={(membership as any)?.network?.name ?? ''} />}

      {/* Greeting */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold tracking-tight mb-1"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Olá, {firstName}
        </h1>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          {hasNetwork
            ? `${(membership as any).network?.name} · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`
            : 'Bem-vindo ao OrgBridge.'}
        </p>
      </div>

      {/* No network CTA */}
      {!hasNetwork && (
        <Link
          href="/onboarding"
          className="mb-8 flex items-start gap-4 rounded-2xl p-5 sm:p-6 transition-opacity hover:opacity-95"
          style={{ background: 'linear-gradient(135deg, var(--ob-navy) 0%, var(--ob-navy-mid) 100%)', display: 'flex' }}
        >
          <div
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--ob-amber-glow)', border: '1px solid rgba(233,160,16,0.3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" stroke="var(--ob-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-0.5" style={{ color: '#fff' }}>Criar minha rede corporativa</p>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Configure o organograma, políticas e identidade da sua organização em menos de 2 minutos.
            </p>
          </div>
          <div className="flex-shrink-0 self-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>
      )}

      {/* Metrics grid */}
      {hasNetwork && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
            <StatCard
              icon={<UsersIcon />}
              label="Membros ativos"
              value={memberCount}
              href="/members"
              accent
            />
            <StatCard
              icon={<FeedIcon />}
              label="Posts esta semana"
              value={postsThisWeek}
              href="/feed"
            />
            <StatCard
              icon={<TrophyIcon />}
              label="Reconhecimentos"
              value={recognitionsTotal}
              sublabel="total na rede"
              href="/feed"
            />
            {isAdmin ? (
              <StatCard
                icon={<FlagIcon />}
                label="Denúncias pendentes"
                value={pendingReports}
                sublabel="aguardando revisão"
                href="/settings"
              />
            ) : (
              <StatCard
                icon={<OrgChartIcon />}
                label="Organograma"
                value="Ver"
                sublabel="estrutura da rede"
                href="/org-chart"
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Recent activity */}
            <div
              className="sm:col-span-2 rounded-2xl p-5"
              style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2
                  className="text-sm font-semibold"
                  style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
                >
                  Atividade recente
                </h2>
                <Link
                  href="/feed"
                  className="text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--ob-amber-dim)' }}
                >
                  Ver feed →
                </Link>
              </div>

              {recentPosts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: 'var(--ob-surface-alt)' }}
                  >
                    <FeedIcon />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
                    Nenhuma publicação ainda.
                  </p>
                  <Link
                    href="/feed"
                    className="text-sm font-medium"
                    style={{ color: 'var(--ob-amber-dim)' }}
                  >
                    Publicar agora →
                  </Link>
                </div>
              ) : (
                <div>
                  {recentPosts.map((p) => (
                    <PostPreview key={p.id} post={p} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="flex flex-col gap-3">
              <h2
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
              >
                Acesso rápido
              </h2>
              <QuickLink href="/feed" icon={<FeedIcon />} label="Feed da rede" />
              <QuickLink href="/members" icon={<UsersIcon />} label="Membros" />
              <QuickLink href="/org-chart" icon={<OrgChartIcon />} label="Organograma" />
              <Link
                href="/ai"
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:opacity-80"
                style={{ background: 'linear-gradient(135deg, var(--ob-navy) 0%, var(--ob-navy-mid) 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                    style={{ background: 'rgba(233,160,16,0.2)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" />
                      <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
                      <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#fff' }}>OrgBridge AI</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}><ArrowRightIcon /></span>
              </Link>
              {isAdmin && (
                <QuickLink href="/moderation" icon={<FlagIcon />} label="Moderação" />
              )}
              {isAdmin && (
                <Link
                  href="/settings#invitations"
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-all hover:opacity-80"
                  style={{
                    background: 'linear-gradient(135deg, var(--ob-navy) 0%, var(--ob-navy-mid) 100%)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(233,160,16,0.2)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ob-amber)" strokeWidth="2" strokeLinecap="round" aria-hidden>
                        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#fff' }}>Convidar membro</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}><ArrowRightIcon /></span>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
