import { auth } from '@orgbridge/auth'
import { db, networkMembers } from '@orgbridge/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import OrgChartClient from './org-chart-client'

export default async function OrgChartPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: eq(networkMembers.userId, session.user.id),
    with: { network: true },
  })

  if (!membership) redirect('/onboarding')

  return (
    <OrgChartClient
      networkId={membership.networkId}
      networkName={(membership as any).network?.name ?? ''}
      currentUserRole={membership.role}
    />
  )
}
