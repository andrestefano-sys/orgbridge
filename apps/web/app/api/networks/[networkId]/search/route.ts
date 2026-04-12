import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, users, posts } from '@orgbridge/db'
import { and, eq, ilike, or } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params
    const q = req.nextUrl.searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }
    if (q.length > 100) {
      return NextResponse.json({ error: 'Consulta muito longa.' }, { status: 400 })
    }

    // Verify membership
    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, session.user.id),
        eq(networkMembers.status, 'active'),
      ),
    })
    if (!member) {
      return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })
    }

    const pattern = `%${q}%`

    // Search members by name, email, or job title
    const memberResults = await db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        jobTitle: users.jobTitle,
        role: networkMembers.role,
      })
      .from(networkMembers)
      .innerJoin(users, eq(networkMembers.userId, users.id))
      .where(
        and(
          eq(networkMembers.networkId, networkId),
          eq(networkMembers.status, 'active'),
          or(
            ilike(users.name, pattern),
            ilike(users.email, pattern),
            ilike(users.jobTitle, pattern),
          ),
        ),
      )
      .limit(5)

    // Search posts by content
    const postResults = await db.query.posts.findMany({
      where: and(
        eq(posts.networkId, networkId),
        eq(posts.status, 'published'),
        ilike(posts.content, pattern),
      ),
      columns: { id: true, content: true, type: true, createdAt: true },
      with: { author: { columns: { id: true, name: true } } },
      limit: 5,
    })

    const results = [
      ...memberResults.map((m) => ({
        type: 'member' as const,
        id: m.id,
        title: m.name ?? 'Sem nome',
        subtitle: m.jobTitle ?? m.role,
        avatarUrl: m.avatarUrl,
        href: `/profile/${m.id}`,
      })),
      ...postResults.map((p) => ({
        type: 'post' as const,
        id: p.id,
        title: p.content.slice(0, 80) + (p.content.length > 80 ? '…' : ''),
        subtitle: `por ${p.author?.name ?? '?'}`,
        avatarUrl: null,
        href: `/feed`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/search]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
