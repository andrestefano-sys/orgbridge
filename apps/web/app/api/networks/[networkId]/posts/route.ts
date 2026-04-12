import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, posts, users } from '@orgbridge/db'
import { and, eq, desc, lt, isNull } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

const VALID_TYPES = ['text', 'recognition', 'announcement', 'document'] as const
const VALID_VISIBILITY = ['network', 'area', 'leadership'] as const

async function assertMember(networkId: string, userId: string) {
  return db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.networkId, networkId),
      eq(networkMembers.userId, userId),
      eq(networkMembers.status, 'active'),
    ),
  })
}

// GET /api/networks/[networkId]/posts — paginated feed
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params

    const member = await assertMember(networkId, session.user.id)
    if (!member) {
      return NextResponse.json({ error: 'Sem acesso a esta rede.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor') // ISO date string of last post createdAt
    const limit = Math.min(Number(searchParams.get('limit') ?? 20), 50)
    const orgNodeId = searchParams.get('orgNodeId') // filter by area: 'mine' | nodeId | null

    // Resolve "mine" to the member's own org node
    let nodeIdFilter: string | null | undefined = undefined
    if (orgNodeId === 'mine') {
      nodeIdFilter = member.orgNodeId ?? '__none__'
    } else if (orgNodeId) {
      nodeIdFilter = orgNodeId
    }

    const feed = await db.query.posts.findMany({
      where: and(
        eq(posts.networkId, networkId),
        eq(posts.status, 'published'),
        cursor ? lt(posts.createdAt, new Date(cursor)) : undefined,
        nodeIdFilter !== undefined
          ? nodeIdFilter === '__none__'
            ? isNull(posts.orgNodeId)
            : eq(posts.orgNodeId, nodeIdFilter)
          : undefined,
      ),
      with: {
        author: { columns: { id: true, name: true, avatarUrl: true, jobTitle: true } },
        recognizedUser: { columns: { id: true, name: true, avatarUrl: true } },
        reactions: {
          columns: { userId: true, emoji: true },
        },
        comments: {
          where: eq(posts.status, 'published'),
          limit: 3,
          orderBy: (c, { asc }) => [asc(c.createdAt)],
          with: {
            author: { columns: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: [desc(posts.isPinned), desc(posts.createdAt)],
      limit: limit + 1, // fetch one extra to determine if there's a next page
    })

    const hasMore = feed.length > limit
    const items = hasMore ? feed.slice(0, limit) : feed
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt?.toISOString() : null

    // Annotate each post with viewer's reaction
    const viewerId = session.user.id
    const annotated = items.map((post) => ({
      ...post,
      viewerReaction: post.reactions.find((r) => r.userId === viewerId)?.emoji ?? null,
    }))

    return NextResponse.json({ posts: annotated, nextCursor })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/posts]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// POST /api/networks/[networkId]/posts — create post
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params
    const userId = session.user.id

    const member = await assertMember(networkId, userId)
    if (!member) {
      return NextResponse.json({ error: 'Sem acesso a esta rede.' }, { status: 403 })
    }

    const body = await req.json()
    const { content, type, visibility, orgNodeId, recognizedUserId } = body

    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return NextResponse.json({ error: 'Conteúdo não pode ser vazio.' }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: 'Conteúdo deve ter no máximo 5000 caracteres.' }, { status: 400 })
    }

    const postType = VALID_TYPES.includes(type) ? type : 'text'
    const postVisibility = VALID_VISIBILITY.includes(visibility) ? visibility : 'network'

    // Only owner/admin can post announcements
    if (postType === 'announcement' && !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Apenas admins podem criar comunicados.' }, { status: 403 })
    }

    const [post] = await db.insert(posts).values({
      networkId,
      authorId: userId,
      content: content.trim(),
      type: postType,
      visibility: postVisibility,
      orgNodeId: orgNodeId || null,
      recognizedUserId: recognizedUserId || null,
    }).returning()

    // Re-fetch with author relation
    const full = await db.query.posts.findFirst({
      where: eq(posts.id, post!.id),
      with: {
        author: { columns: { id: true, name: true, avatarUrl: true } },
        recognizedUser: { columns: { id: true, name: true, avatarUrl: true } },
        reactions: { columns: { userId: true, emoji: true } },
        comments: { limit: 0 },
      },
    })

    return NextResponse.json({ post: full }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/networks/[networkId]/posts]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
