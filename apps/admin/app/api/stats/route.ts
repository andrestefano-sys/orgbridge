import { NextResponse } from 'next/server'
import { db, networks, networkMembers, users, subscriptions } from '@orgbridge/db'
import { count, eq, gte, sql } from 'drizzle-orm'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [[totalNetworks], [totalUsers], [totalMembers], [newUsers30d], allSubs] = await Promise.all([
      db.select({ count: count() }).from(networks),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(networkMembers).where(eq(networkMembers.status, 'active')),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
      db.select({ plan: subscriptions.plan, status: subscriptions.status }).from(subscriptions),
    ])

    // Calculate MRR
    const PLAN_MRR: Record<string, number> = { starter: 99, business: 299, enterprise: 899 }
    const mrr = allSubs
      .filter((s) => s.status === 'active' && s.plan !== 'free')
      .reduce((sum, s) => sum + (PLAN_MRR[s.plan] ?? 0), 0)

    const planCounts = allSubs.reduce<Record<string, number>>((acc, s) => {
      acc[s.plan] = (acc[s.plan] ?? 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      totalNetworks: totalNetworks?.count ?? 0,
      totalUsers: totalUsers?.count ?? 0,
      activeMembers: totalMembers?.count ?? 0,
      newUsersLast30d: newUsers30d?.count ?? 0,
      mrr,
      planCounts,
    })
  } catch (err) {
    console.error('[admin stats]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
