import { NextRequest, NextResponse } from 'next/server'
import { db, networks, networkMembers, subscriptions } from '@orgbridge/db'
import { count, desc, eq, ilike, or } from 'drizzle-orm'
import { getAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
    const limit = 20
    const offset = (page - 1) * limit

    const rows = await db
      .select({
        id: networks.id,
        name: networks.name,
        slug: networks.slug,
        status: networks.status,
        type: networks.type,
        industry: networks.industry,
        createdAt: networks.createdAt,
      })
      .from(networks)
      .where(q ? or(ilike(networks.name, `%${q}%`), ilike(networks.slug, `%${q}%`)) : undefined)
      .orderBy(desc(networks.createdAt))
      .limit(limit)
      .offset(offset)

    // Attach member counts and plan
    const enriched = await Promise.all(
      rows.map(async (n) => {
        const [[memberRow], sub] = await Promise.all([
          db.select({ count: count() }).from(networkMembers).where(eq(networkMembers.networkId, n.id)),
          db.query.subscriptions.findFirst({ where: eq(subscriptions.networkId, n.id) }),
        ])
        return { ...n, memberCount: memberRow?.count ?? 0, plan: sub?.plan ?? 'free', subStatus: sub?.status ?? 'active' }
      }),
    )

    return NextResponse.json({ networks: enriched, page, hasMore: rows.length === limit })
  } catch (err) {
    console.error('[admin networks]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
