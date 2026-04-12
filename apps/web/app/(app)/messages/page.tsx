import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'
import { MessagesClient } from './messages-client'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ with?: string }>
}

export default async function MessagesPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.userId, session.user.id),
      eq(networkMembers.status, 'active'),
    ),
  })

  if (!membership) redirect('/onboarding')

  const sp = await searchParams
  const openWithUserId = sp.with ?? null

  return (
    <MessagesClient
      networkId={membership.networkId}
      currentUserId={session.user.id}
      openWithUserId={openWithUserId}
    />
  )
}
