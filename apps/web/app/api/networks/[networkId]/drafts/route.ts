import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, postDrafts } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

// GET /api/networks/[networkId]/drafts — get the current user's draft
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
    if (!member) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })

    const draft = await db.query.postDrafts.findFirst({
      where: and(
        eq(postDrafts.networkId, networkId),
        eq(postDrafts.authorId, userId),
      ),
    })

    return NextResponse.json({ draft: draft ?? null })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/drafts]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// PUT /api/networks/[networkId]/drafts — upsert draft
export async function PUT(req: NextRequest, { params }: Params) {
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
    if (!member) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })

    const { content, type, orgNodeId, recognizedUserId } = await req.json()

    const existing = await db.query.postDrafts.findFirst({
      where: and(
        eq(postDrafts.networkId, networkId),
        eq(postDrafts.authorId, userId),
      ),
    })

    if (existing) {
      await db
        .update(postDrafts)
        .set({
          content: content ?? '',
          type: type ?? 'text',
          orgNodeId: orgNodeId ?? null,
          recognizedUserId: recognizedUserId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(postDrafts.id, existing.id))
    } else {
      await db.insert(postDrafts).values({
        networkId,
        authorId: userId,
        content: content ?? '',
        type: type ?? 'text',
        orgNodeId: orgNodeId ?? null,
        recognizedUserId: recognizedUserId ?? null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/networks/[networkId]/drafts]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// DELETE /api/networks/[networkId]/drafts — clear draft after publishing
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params
    const userId = session.user.id

    await db
      .delete(postDrafts)
      .where(and(
        eq(postDrafts.networkId, networkId),
        eq(postDrafts.authorId, userId),
      ))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/networks/[networkId]/drafts]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
