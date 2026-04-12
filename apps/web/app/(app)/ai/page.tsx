import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { AiClient } from './ai-client'

export default async function AiPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.userId, session.user.id),
      eq(networkMembers.status, 'active'),
    ),
    with: { network: true },
  })

  if (!membership) redirect('/onboarding')

  return (
    <AiClient
      networkId={membership.networkId}
      networkName={(membership as any).network?.name ?? ''}
      currentUserName={session.user.name ?? ''}
    />
  )
}
