import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, conversations, directMessages, notifications, users } from '@orgbridge/db'
import { and, asc, eq, isNull, lt } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string; conversationId: string }>
}

async function assertParticipant(conversationId: string, networkId: string, userId: string) {
  const convo = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, conversationId),
      eq(conversations.networkId, networkId),
    ),
  })
  if (!convo) return null
  if (convo.participantAId !== userId && convo.participantBId !== userId) return null
  return convo
}

// GET /api/networks/[networkId]/conversations/[conversationId] — fetch messages
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, conversationId } = await params
    const userId = session.user.id

    const convo = await assertParticipant(conversationId, networkId, userId)
    if (!convo) {
      return NextResponse.json({ error: 'Conversa não encontrada.' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor') // createdAt ISO of oldest message fetched
    const limit = 40

    const messages = await db.query.directMessages.findMany({
      where: and(
        eq(directMessages.conversationId, conversationId),
        cursor ? lt(directMessages.createdAt, new Date(cursor)) : undefined,
      ),
      orderBy: [asc(directMessages.createdAt)],
      limit,
      with: {
        sender: { columns: { id: true, name: true, avatarUrl: true } },
      },
    })

    // Mark messages from the OTHER person as read
    const otherId =
      convo.participantAId === userId ? convo.participantBId : convo.participantAId

    await db
      .update(directMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(directMessages.conversationId, conversationId),
          eq(directMessages.senderId, otherId),
          isNull(directMessages.readAt),
        ),
      )

    const hasMore = messages.length === limit
    const nextCursor = hasMore ? messages[0]?.createdAt?.toISOString() : null

    return NextResponse.json({ messages, nextCursor })
  } catch (err) {
    console.error('[GET conversations/[id]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// POST /api/networks/[networkId]/conversations/[conversationId] — send message
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, conversationId } = await params
    const userId = session.user.id

    const convo = await assertParticipant(conversationId, networkId, userId)
    if (!convo) {
      return NextResponse.json({ error: 'Conversa não encontrada.' }, { status: 404 })
    }

    const { content } = await req.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Mensagem não pode ser vazia.' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Mensagem muito longa (máx. 2000 caracteres).' }, { status: 400 })
    }

    const [msg] = await db
      .insert(directMessages)
      .values({
        conversationId,
        senderId: userId,
        content: content.trim(),
      })
      .returning()

    // Update conversation preview
    await db
      .update(conversations)
      .set({
        lastMessageAt: msg!.createdAt,
        lastMessagePreview: content.trim().slice(0, 120),
      })
      .where(eq(conversations.id, conversationId))

    // Fire notification to the recipient (fire-and-forget)
    const recipientId =
      convo.participantAId === userId ? convo.participantBId : convo.participantAId

    const sender = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { name: true },
    })

    db.insert(notifications).values({
      userId: recipientId,
      networkId,
      type: 'new_message',
      title: `${sender?.name ?? 'Alguém'} enviou uma mensagem`,
      body: content.trim().slice(0, 100),
      actorId: userId,
      targetType: 'conversation',
      targetId: conversationId,
    }).catch(() => null)

    return NextResponse.json({ message: { ...msg, sender: { id: userId } } }, { status: 201 })
  } catch (err) {
    console.error('[POST conversations/[id]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
