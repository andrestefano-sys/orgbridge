import { NextRequest, NextResponse } from 'next/server'
import { db, users, networkMembers } from '@orgbridge/db'
import { desc, eq, ilike, or, count } from 'drizzle-orm'
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
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset)

    const enriched = await Promise.all(
      rows.map(async (u) => {
        const [memberRow] = await db
          .select({ count: count() })
          .from(networkMembers)
          .where(eq(networkMembers.userId, u.id))
        return { ...u, networksCount: memberRow?.count ?? 0 }
      }),
    )

    return NextResponse.json({ users: enriched, page, hasMore: rows.length === limit })
  } catch (err) {
    console.error('[admin users]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
