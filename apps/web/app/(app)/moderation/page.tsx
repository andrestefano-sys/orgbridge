import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { ModerationClient } from './moderation-client'

export default async function ModerationPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: eq(networkMembers.userId, session.user.id),
  })

  if (!membership) redirect('/onboarding')
  if (!['owner', 'admin'].includes(membership.role)) redirect('/dashboard')

  return <ModerationClient networkId={membership.networkId} />
}
