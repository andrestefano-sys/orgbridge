import { NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, conversations, directMessages } from '@orgbridge/db'
import { and, count, eq, isNull, or } from 'drizzle-orm'

// GET /api/messages/unread — count of unread DMs for the current user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ unread: 0 })
    }

    const userId = session.user.id

    // Find all conversations where the user participates
    const userConvos = await db.query.conversations.findMany({
      where: or(
        eq(conversations.participantAId, userId),
        eq(conversations.participantBId, userId),
      ),
      columns: { id: true, participantAId: true, participantBId: true },
    })

    if (userConvos.length === 0) return NextResponse.json({ unread: 0 })

    // For each conversation, count unread messages sent by the OTHER person
    let totalUnread = 0
    for (const c of userConvos) {
      const otherId = c.participantAId === userId ? c.participantBId : c.participantAId
      const [row] = await db
        .select({ count: count() })
        .from(directMessages)
        .where(
          and(
            eq(directMessages.conversationId, c.id),
            eq(directMessages.senderId, otherId),
            isNull(directMessages.readAt),
          ),
        )
      totalUnread += row?.count ?? 0
    }

    return NextResponse.json({ unread: totalUnread })
  } catch {
    return NextResponse.json({ unread: 0 })
  }
}
