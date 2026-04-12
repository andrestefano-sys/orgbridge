import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, posts, comments } from '@orgbridge/db'
import { and, eq, sql } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string; postId: string; commentId: string }>
}

// DELETE /api/networks/[networkId]/posts/[postId]/comments/[commentId]
// Author can delete their own comment; admins/owners can delete any.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, postId, commentId } = await params
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

    const comment = await db.query.comments.findFirst({
      where: and(eq(comments.id, commentId), eq(comments.postId, postId)),
    })
    if (!comment) {
      return NextResponse.json({ error: 'Comentário não encontrado.' }, { status: 404 })
    }

    const isAuthor = comment.authorId === userId
    const isAdmin = ['owner', 'admin'].includes(member.role)

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Sem permissão para remover este comentário.' }, { status: 403 })
    }

    // Soft-delete: set status to 'removed'
    await db.update(comments).set({ status: 'removed', updatedAt: new Date() }).where(eq(comments.id, commentId))

    // Decrement post comment counter (floor at 0)
    await db
      .update(posts)
      .set({ commentsCount: sql`GREATEST(${posts.commentsCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(posts.id, postId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE comment]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
