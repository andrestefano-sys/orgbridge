import { auth } from '@orgbridge/auth'
import { db, networkMembers, orgNodes } from '@orgbridge/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import FeedClient from './feed-client'

export default async function FeedPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: eq(networkMembers.userId, session.user.id),
    with: { network: true },
  })

  if (!membership) {
    redirect('/onboarding')
  }

  const nodes = await db.query.orgNodes.findMany({
    where: eq(orgNodes.networkId, membership.networkId),
    columns: { id: true, name: true, color: true, level: true, position: true },
  })

  return (
    <FeedClient
      networkId={membership.networkId}
      networkName={(membership as any).network?.name ?? ''}
      currentUser={{
        id: session.user.id,
        name: session.user.name ?? '',
        avatarUrl: session.user.image ?? null,
        role: membership.role,
      }}
      currentUserOrgNodeId={membership.orgNodeId ?? null}
      orgNodes={nodes}
    />
  )
}
