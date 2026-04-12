import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { BillingClient } from './billing-client'

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.userId, session.user.id),
      eq(networkMembers.status, 'active'),
    ),
  })

  if (!membership) redirect('/onboarding')
  if (!['owner', 'admin'].includes(membership.role)) redirect('/dashboard')

  return (
    <BillingClient
      networkId={membership.networkId}
      isOwner={membership.role === 'owner'}
    />
  )
}
