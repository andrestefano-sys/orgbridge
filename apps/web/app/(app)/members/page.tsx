import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import MembersClient from './members-client'

export default async function MembersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: eq(networkMembers.userId, session.user.id),
    with: { network: true },
  })

  if (!membership) redirect('/onboarding')

  return (
    <MembersClient
      networkId={membership.networkId}
      networkName={(membership as any).network?.name ?? ''}
      currentUserRole={membership.role}
      currentUserId={session.user.id}
    />
  )
}
