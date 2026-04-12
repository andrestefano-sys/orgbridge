import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, posts, comments, reactions, users } from '@orgbridge/db'
import { and, count, eq, gte, desc, sql } from 'drizzle-orm'

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

    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, session.user.id),
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const period = req.nextUrl.searchParams.get('period') ?? '30'
    const days = Math.min(Math.max(Number(period) || 30, 7), 365)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Total members
    const [totalMembersResult] = await db
      .select({ count: count() })
      .from(networkMembers)
      .where(and(eq(networkMembers.networkId, networkId), eq(networkMembers.status, 'active')))

    // New members in period
    const [newMembersResult] = await db
      .select({ count: count() })
      .from(networkMembers)
      .where(and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.status, 'active'),
        gte(networkMembers.joinedAt, since),
      ))

    // Posts in period
    const [postsInPeriodResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(
        eq(posts.networkId, networkId),
        eq(posts.status, 'published'),
        gte(posts.createdAt, since),
      ))

    // Total posts
    const [totalPostsResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(and(eq(posts.networkId, networkId), eq(posts.status, 'published')))

    // Posts by type (all time)
    const postsByType = await db
      .select({ type: posts.type, count: count() })
      .from(posts)
      .where(and(eq(posts.networkId, networkId), eq(posts.status, 'published')))
      .groupBy(posts.type)

    // Comments in period
    const [commentsResult] = await db
      .select({ count: count() })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(
        eq(posts.networkId, networkId),
        eq(comments.status, 'published'),
        gte(comments.createdAt, since),
      ))

    // Reactions in period
    const [reactionsResult] = await db
      .select({ count: count() })
      .from(reactions)
      .innerJoin(posts, eq(reactions.postId, posts.id))
      .where(and(
        eq(posts.networkId, networkId),
        gte(reactions.createdAt, since),
      ))

    // Top posters in period
    const topPosters = await db
      .select({
        authorId: posts.authorId,
        postCount: count(posts.id),
      })
      .from(posts)
      .where(and(
        eq(posts.networkId, networkId),
        eq(posts.status, 'published'),
        gte(posts.createdAt, since),
      ))
      .groupBy(posts.authorId)
      .orderBy(desc(count(posts.id)))
      .limit(5)

    // Fetch user names for top posters
    const topPostersWithNames = await Promise.all(
      topPosters.map(async (p) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, p.authorId),
          columns: { id: true, name: true, avatarUrl: true },
        })
        return { ...p, user }
      })
    )

    // Most reacted posts in period
    const topPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.networkId, networkId),
        eq(posts.status, 'published'),
        gte(posts.createdAt, since),
      ),
      orderBy: [desc(posts.reactionsCount)],
      limit: 5,
      columns: { id: true, content: true, type: true, reactionsCount: true, commentsCount: true, createdAt: true },
      with: { author: { columns: { id: true, name: true } } },
    })

    // Member role breakdown
    const roleBreakdown = await db
      .select({ role: networkMembers.role, count: count() })
      .from(networkMembers)
      .where(and(eq(networkMembers.networkId, networkId), eq(networkMembers.status, 'active')))
      .groupBy(networkMembers.role)

    // Daily activity — posts per day in period
    const dailyRaw = await db
      .select({
        day: sql<string>`DATE(${posts.createdAt})`.as('day'),
        count: count(),
      })
      .from(posts)
      .where(and(
        eq(posts.networkId, networkId),
        eq(posts.status, 'published'),
        gte(posts.createdAt, since),
      ))
      .groupBy(sql`DATE(${posts.createdAt})`)
      .orderBy(sql`DATE(${posts.createdAt})`)

    // Fill in missing days with 0
    const dailyMap: Record<string, number> = {}
    for (const row of dailyRaw) {
      if (row.day) dailyMap[row.day] = row.count
    }
    const dailyActivity: Array<{ date: string; posts: number }> = []
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      dailyActivity.push({ date: key, posts: dailyMap[key] ?? 0 })
    }

    return NextResponse.json({
      period: days,
      since: since.toISOString(),
      members: {
        total: totalMembersResult?.count ?? 0,
        newInPeriod: newMembersResult?.count ?? 0,
        byRole: roleBreakdown,
      },
      posts: {
        total: totalPostsResult?.count ?? 0,
        inPeriod: postsInPeriodResult?.count ?? 0,
        byType: postsByType,
      },
      engagement: {
        comments: commentsResult?.count ?? 0,
        reactions: reactionsResult?.count ?? 0,
      },
      topPosters: topPostersWithNames,
      topPosts,
      dailyActivity,
    })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/analytics]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
