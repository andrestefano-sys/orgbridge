import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, posts } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string; postId: string }>
}

// PATCH /api/networks/[networkId]/posts/[postId] — pin/unpin (admin/owner only)
export async function PATCH(req: NextRequest, { params }: Params) {
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

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.networkId, networkId)),
    })

    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado.' }, { status: 404 })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'pin' || action === 'unpin') {
      const isPinned = action === 'pin'
      await db
        .update(posts)
        .set({
          isPinned,
          pinnedAt: isPinned ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId))

      return NextResponse.json({ ok: true, isPinned })
    }

    if (action === 'edit') {
      // Authors can edit their own posts; admins/owners can edit any
      const canEdit =
        post.authorId === userId || ['owner', 'admin'].includes(member.role)

      if (!canEdit) {
        return NextResponse.json({ error: 'Sem permissão para editar.' }, { status: 403 })
      }

      const { content } = body
      if (!content || typeof content !== 'string' || !content.trim()) {
        return NextResponse.json({ error: 'Conteúdo não pode ser vazio.' }, { status: 400 })
      }
      if (content.length > 5000) {
        return NextResponse.json({ error: 'Conteúdo muito longo.' }, { status: 400 })
      }

      await db
        .update(posts)
        .set({ content: content.trim(), updatedAt: new Date() })
        .where(eq(posts.id, postId))

      return NextResponse.json({ ok: true, content: content.trim() })
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (err) {
    console.error('[PATCH /api/networks/[networkId]/posts/[postId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// DELETE /api/networks/[networkId]/posts/[postId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, postId } = await params
    const userId = session.user.id

    const post = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.networkId, networkId)),
    })

    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado.' }, { status: 404 })
    }

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

    const canDelete =
      post.authorId === userId || ['owner', 'admin'].includes(member.role)

    if (!canDelete) {
      return NextResponse.json({ error: 'Sem permissão para remover este post.' }, { status: 403 })
    }

    await db
      .update(posts)
      .set({ status: 'removed', updatedAt: new Date() })
      .where(eq(posts.id, postId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/networks/[networkId]/posts/[postId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
