import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'
import Link from 'next/link'
import { AnalyticsClient } from './analytics-client'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const membership = await db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.userId, session.user.id),
      eq(networkMembers.status, 'active'),
    ),
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p
          className="text-base font-semibold"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Acesso restrito
        </p>
        <p className="text-sm" style={{ color: 'var(--ob-text-muted)' }}>
          Apenas administradores podem ver esta página.
        </p>
        <Link href="/dashboard" className="text-sm font-medium" style={{ color: 'var(--ob-amber-dim)' }}>
          Voltar ao início →
        </Link>
      </div>
    )
  }

  return <AnalyticsClient networkId={membership.networkId} />
}
