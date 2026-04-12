import { auth } from '@orgbridge/auth'
import { db, networkMembers, users, posts, orgNodes } from '@orgbridge/db'
import { and, eq, desc } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { ProfileHeader } from './profile-header'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  manager: 'Gestor',
  member: 'Membro',
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  owner:   { bg: 'rgba(233,160,16,0.12)', text: '#E9A010', border: 'rgba(233,160,16,0.3)' },
  admin:   { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
  manager: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  member:  { bg: 'var(--ob-surface-alt)', text: 'var(--ob-text-muted)', border: 'var(--ob-border)' },
}

const POST_TYPE_LABELS: Record<string, string> = {
  text: 'Texto',
  recognition: 'Reconhecimento',
  announcement: 'Comunicado',
  document: 'Documento',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId: targetUserId } = await params

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Get the viewer's membership to know which network they belong to
  const viewerMembership = await db.query.networkMembers.findFirst({
    where: eq(networkMembers.userId, session.user.id),
  })
  if (!viewerMembership) redirect('/onboarding')

  // Get target user
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
  })
  if (!targetUser) notFound()

  // Get target's membership in the same network
  const targetMembership = await db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.userId, targetUserId),
      eq(networkMembers.networkId, viewerMembership.networkId),
    ),
  })
  if (!targetMembership) notFound()

  // Get org node
  const orgNode = targetMembership.orgNodeId
    ? await db.query.orgNodes.findFirst({ where: eq(orgNodes.id, targetMembership.orgNodeId) })
    : null

  // Get recent posts by this user in the network (last 10)
  const recentPosts = await db.query.posts.findMany({
    where: and(
      eq(posts.authorId, targetUserId),
      eq(posts.networkId, viewerMembership.networkId),
      eq(posts.status, 'published'),
    ),
    orderBy: [desc(posts.createdAt)],
    limit: 10,
  })

  const isOwnProfile = session.user.id === targetUserId
  const colors = ROLE_COLORS[targetMembership.role] ?? ROLE_COLORS['member']!

  const joinedDate = targetMembership.joinedAt
    ? new Date(targetMembership.joinedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl animate-fade-slide-up">
      {/* Profile header — client component for live edit */}
      <ProfileHeader
        user={{
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          avatarUrl: targetUser.avatarUrl,
          jobTitle: targetUser.jobTitle ?? null,
          bio: targetUser.bio ?? null,
        }}
        role={targetMembership.role}
        roleLabel={ROLE_LABELS[targetMembership.role] ?? targetMembership.role}
        roleColors={colors}
        orgNodeName={orgNode?.name ?? null}
        orgNodeColor={orgNode?.color ?? null}
        joinedDate={joinedDate}
        isOwnProfile={isOwnProfile}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
        >
          <p className="text-2xl font-semibold mb-0.5" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            {recentPosts.length}
          </p>
          <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>publicações recentes</p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
        >
          <p className="text-2xl font-semibold mb-0.5" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            {recentPosts.reduce((s, p) => s + p.reactionsCount, 0)}
          </p>
          <p className="text-xs" style={{ color: 'var(--ob-text-muted)' }}>reações recebidas</p>
        </div>
      </div>

      {/* Recent posts */}
      <div>
        <h2
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--ob-text-muted)', fontFamily: 'var(--font-sora)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}
        >
          Publicações recentes
        </h2>

        {recentPosts.length === 0 ? (
          <div
            className="rounded-xl py-10 text-center"
            style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
          >
            <svg className="mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ob-text-faint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--ob-text-faint)' }}>
              {isOwnProfile ? 'Você ainda não publicou nada.' : 'Nenhuma publicação ainda.'}
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--ob-border)', background: 'var(--ob-surface)' }}
          >
            {recentPosts.map((post, i) => (
              <div
                key={post.id}
                className="px-5 py-4"
                style={{ borderTop: i > 0 ? '1px solid var(--ob-border)' : 'none' }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs rounded-full px-2 py-0.5 font-medium"
                      style={{
                        background: post.type === 'recognition' ? 'rgba(233,160,16,0.12)' : post.type === 'announcement' ? 'rgba(99,102,241,0.1)' : 'var(--ob-surface-alt)',
                        color: post.type === 'recognition' ? 'var(--ob-amber)' : post.type === 'announcement' ? '#818cf8' : 'var(--ob-text-muted)',
                        border: `1px solid ${post.type === 'recognition' ? 'rgba(233,160,16,0.3)' : post.type === 'announcement' ? 'rgba(99,102,241,0.3)' : 'var(--ob-border)'}`,
                      }}
                    >
                      {POST_TYPE_LABELS[post.type] ?? post.type}
                    </span>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--ob-text-faint)' }}>
                    {timeAgo(post.createdAt.toString())}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed line-clamp-3"
                  style={{ color: 'var(--ob-text)' }}
                >
                  {post.content}
                </p>
                {(post.reactionsCount > 0 || post.commentsCount > 0) && (
                  <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'var(--ob-text-faint)' }}>
                    {post.reactionsCount > 0 && <span>{post.reactionsCount} reação{post.reactionsCount !== 1 ? 'ões' : ''}</span>}
                    {post.commentsCount > 0 && <span>{post.commentsCount} comentário{post.commentsCount !== 1 ? 's' : ''}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
