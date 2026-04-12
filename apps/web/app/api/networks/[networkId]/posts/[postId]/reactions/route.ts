import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, posts, reactions } from '@orgbridge/db'
import { and, eq, sql } from 'drizzle-orm'
import { createNotification } from '@/lib/notifications'

interface Params {
  params: Promise<{ networkId: string; postId: string }>
}

const VALID_EMOJIS = ['like', 'celebrate', 'support', 'insightful', 'done', 'urgent'] as const

// POST — toggle reaction on a post
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

    const { emoji } = await req.json()
    const validEmoji = VALID_EMOJIS.includes(emoji) ? emoji : 'like'

    // Check existing reaction from this user on this post
    const existing = await db.query.reactions.findFirst({
      where: and(eq(reactions.userId, userId), eq(reactions.postId, postId)),
    })

    if (existing) {
      if (existing.emoji === validEmoji) {
        // Toggle off — remove reaction
        await db.delete(reactions).where(eq(reactions.id, existing.id))
        await db
          .update(posts)
          .set({ reactionsCount: sql`${posts.reactionsCount} - 1`, updatedAt: new Date() })
          .where(eq(posts.id, postId))
        return NextResponse.json({ action: 'removed', emoji: validEmoji })
      } else {
        // Change emoji
        await db.update(reactions).set({ emoji: validEmoji }).where(eq(reactions.id, existing.id))
        return NextResponse.json({ action: 'changed', emoji: validEmoji })
      }
    }

    // New reaction
    await db.insert(reactions).values({ userId, postId, emoji: validEmoji })
    await db
      .update(posts)
      .set({ reactionsCount: sql`${posts.reactionsCount} + 1`, updatedAt: new Date() })
      .where(eq(posts.id, postId))

    // Notify post author
    const EMOJI_LABELS: Record<string, string> = {
      like: 'curtiu', celebrate: 'celebrou', support: 'apoiou',
      insightful: 'achou relevante', done: 'marcou como feito', urgent: 'marcou como urgente',
    }
    await createNotification({
      userId: post.authorId,
      networkId,
      type: 'new_reaction',
      title: `${session.user.name ?? 'Alguém'} ${EMOJI_LABELS[validEmoji] ?? 'reagiu a'} sua publicação`,
      body: post.content.slice(0, 80),
      actorId: userId,
      targetType: 'post',
      targetId: postId,
    })

    return NextResponse.json({ action: 'added', emoji: validEmoji })
  } catch (err) {
    console.error('[POST reactions]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
