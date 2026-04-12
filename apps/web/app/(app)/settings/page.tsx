import { auth } from '@orgbridge/auth'
import { db, networkMembers, networks, orgNodes } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await db.query.networkMembers.findFirst({
    where: eq(networkMembers.userId, session.user.id),
    with: { network: true },
  })

  if (!membership) redirect('/onboarding')

  const isAdmin = ['owner', 'admin'].includes(membership.role)
  if (!isAdmin) redirect('/dashboard')

  const network = (membership as any).network as typeof networks.$inferSelect

  // Count members and nodes
  const allMembers = await db.query.networkMembers.findMany({
    where: eq(networkMembers.networkId, network.id),
  })
  const allNodes = await db.query.orgNodes.findMany({
    where: eq(orgNodes.networkId, network.id),
  })

  return (
    <SettingsClient
      network={network}
      memberCount={allMembers.length}
      nodeCount={allNodes.length}
      currentUserRole={membership.role}
    />
  )
}
