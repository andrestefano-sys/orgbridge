import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, notifications, networkMembers } from '@orgbridge/db'
import { and, desc, eq, lt } from 'drizzle-orm'

// GET /api/notifications — paginated, newest first
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const cursor = req.nextUrl.searchParams.get('cursor')
    const limit = 20

    const membership = await db.query.networkMembers.findFirst({
      where: eq(networkMembers.userId, session.user.id),
    })
    if (!membership) return NextResponse.json({ items: [], unread: 0 })

    const where = cursor
      ? and(
          eq(notifications.userId, session.user.id),
          eq(notifications.networkId, membership.networkId),
          lt(notifications.createdAt, new Date(cursor)),
        )
      : and(
          eq(notifications.userId, session.user.id),
          eq(notifications.networkId, membership.networkId),
        )

    const items = await db.query.notifications.findMany({
      where,
      orderBy: [desc(notifications.createdAt)],
      limit: limit + 1,
      with: { actor: true },
    })

    const hasMore = items.length > limit
    if (hasMore) items.pop()

    // Count unread
    const allUnread = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, session.user.id),
        eq(notifications.networkId, membership.networkId),
        eq(notifications.read, false),
      ),
    })

    return NextResponse.json({
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        targetType: n.targetType,
        targetId: n.targetId,
        createdAt: n.createdAt,
        actor: n.actorId ? {
          id: (n as any).actor?.id,
          name: (n as any).actor?.name,
        } : null,
      })),
      unread: allUnread.length,
      nextCursor: hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null,
    })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const membership = await db.query.networkMembers.findFirst({
      where: eq(networkMembers.userId, session.user.id),
    })
    if (!membership) return NextResponse.json({ ok: true })

    const { ids } = await req.json().catch(() => ({ ids: null }))

    if (ids && Array.isArray(ids)) {
      // Mark specific notifications
      for (const id of ids) {
        await db.update(notifications)
          .set({ read: true })
          .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))
      }
    } else {
      // Mark all
      await db.update(notifications)
        .set({ read: true })
        .where(and(
          eq(notifications.userId, session.user.id),
          eq(notifications.networkId, membership.networkId),
          eq(notifications.read, false),
        ))
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/notifications]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
