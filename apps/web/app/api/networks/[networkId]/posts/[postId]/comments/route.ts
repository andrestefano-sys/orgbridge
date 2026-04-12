import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, posts, comments } from '@orgbridge/db'
import { and, eq, asc, sql } from 'drizzle-orm'
import { createNotification } from '@/lib/notifications'

interface Params {
  params: Promise<{ networkId: string; postId: string }>
}

// GET — all comments for a post
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, postId } = await params

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

    const all = await db.query.comments.findMany({
      where: and(eq(comments.postId, postId), eq(comments.status, 'published')),
      orderBy: [asc(comments.createdAt)],
      with: {
        author: { columns: { id: true, name: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ comments: all })
  } catch (err) {
    console.error('[GET comments]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// POST — add comment
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, postId } = await params
    const userId = session.user.id

    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, userId),
        eq(networkMembers.status, 'active'),
      ),
    })
    if (!member) {
      return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })
    }

    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.networkId, networkId), eq(posts.status, 'published')),
    })
    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado.' }, { status: 404 })
    }

    const { content } = await req.json()
    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return NextResponse.json({ error: 'Comentário não pode ser vazio.' }, { status: 400 })
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comentário deve ter no máximo 2000 caracteres.' }, { status: 400 })
    }

    const [comment] = await db.insert(comments).values({
      postId,
      authorId: userId,
      content: content.trim(),
    }).returning()

    // Increment post comment counter
    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1`, updatedAt: new Date() })
      .where(eq(posts.id, postId))

    // Notify post author
    await createNotification({
      userId: post.authorId,
      networkId,
      type: 'new_comment',
      title: `${session.user.name ?? 'Alguém'} comentou na sua publicação`,
      body: content.trim().slice(0, 80),
      actorId: userId,
      targetType: 'post',
      targetId: postId,
    })

    const full = await db.query.comments.findFirst({
      where: eq(comments.id, comment!.id),
      with: { author: { columns: { id: true, name: true, avatarUrl: true } } },
    })

    return NextResponse.json({ comment: full }, { status: 201 })
  } catch (err) {
    console.error('[POST comments]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
