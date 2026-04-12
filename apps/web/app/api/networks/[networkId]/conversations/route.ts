import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, conversations, directMessages } from '@orgbridge/db'
import { and, desc, eq, or } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

// GET /api/networks/[networkId]/conversations — list conversations for current user
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params
    const userId = session.user.id

    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, userId),
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!member) {
      return NextResponse.json({ error: 'Sem acesso a esta rede.' }, { status: 403 })
    }

    const convos = await db.query.conversations.findMany({
      where: and(
        eq(conversations.networkId, networkId),
        or(
          eq(conversations.participantAId, userId),
          eq(conversations.participantBId, userId),
        ),
      ),
      orderBy: [desc(conversations.lastMessageAt), desc(conversations.createdAt)],
      with: {
        participantA: { columns: { id: true, name: true, avatarUrl: true } },
        participantB: { columns: { id: true, name: true, avatarUrl: true } },
      },
    })

    const annotated = convos.map((c) => {
      const other = c.participantAId === userId ? c.participantB : c.participantA
      return {
        id: c.id,
        other,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        createdAt: c.createdAt,
      }
    })

    return NextResponse.json({ conversations: annotated })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/conversations]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// POST /api/networks/[networkId]/conversations — start or get existing conversation
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params
    const userId = session.user.id

    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, userId),
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!member) {
      return NextResponse.json({ error: 'Sem acesso a esta rede.' }, { status: 403 })
    }

    const { recipientId } = await req.json()

    if (!recipientId || typeof recipientId !== 'string') {
      return NextResponse.json({ error: 'recipientId obrigatório.' }, { status: 400 })
    }

    if (recipientId === userId) {
      return NextResponse.json({ error: 'Não pode conversar consigo mesmo.' }, { status: 400 })
    }

    // Verify recipient is a member of the same network
    const recipientMember = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, recipientId),
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!recipientMember) {
      return NextResponse.json({ error: 'Destinatário não encontrado.' }, { status: 404 })
    }

    // Sort IDs to ensure uniqueness
    const [aId, bId] = [userId, recipientId].sort()

    // Find existing or create
    let convo = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.networkId, networkId),
        eq(conversations.participantAId, aId!),
        eq(conversations.participantBId, bId!),
      ),
    })

    if (!convo) {
      const [created] = await db
        .insert(conversations)
        .values({
          networkId,
          participantAId: aId!,
          participantBId: bId!,
        })
        .returning()
      convo = created
    }

    return NextResponse.json({ conversationId: convo!.id })
  } catch (err) {
    console.error('[POST /api/networks/[networkId]/conversations]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
