import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, orgNodes } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string; nodeId: string }>
}

async function assertAdmin(networkId: string, userId: string) {
  const member = await db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.networkId, networkId),
      eq(networkMembers.userId, userId),
      eq(networkMembers.status, 'active'),
    ),
  })
  return member && ['owner', 'admin'].includes(member.role) ? member : null
}

// PATCH /api/networks/[networkId]/org-nodes/[nodeId] — rename node or change color
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, nodeId } = await params

    const actor = await assertAdmin(networkId, session.user.id)
    if (!actor) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const node = await db.query.orgNodes.findFirst({
      where: and(eq(orgNodes.id, nodeId), eq(orgNodes.networkId, networkId)),
    })

    if (!node) {
      return NextResponse.json({ error: 'Área não encontrada.' }, { status: 404 })
    }

    const body = await req.json()
    const updates: { name?: string; color?: string | null } = {}

    if (body.name !== undefined) {
      const name = String(body.name).trim()
      if (name.length < 1 || name.length > 80) {
        return NextResponse.json({ error: 'Nome deve ter entre 1 e 80 caracteres.' }, { status: 400 })
      }
      updates.name = name
    }

    if (body.color !== undefined) {
      updates.color = body.color || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
    }

    const [updated] = await db
      .update(orgNodes)
      .set(updates)
      .where(eq(orgNodes.id, nodeId))
      .returning()

    return NextResponse.json({ node: updated })
  } catch (err) {
    console.error('[PATCH /api/networks/[networkId]/org-nodes/[nodeId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// DELETE /api/networks/[networkId]/org-nodes/[nodeId] — remove node (and re-parent children to its parent)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, nodeId } = await params

    const actor = await assertAdmin(networkId, session.user.id)
    if (!actor) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const node = await db.query.orgNodes.findFirst({
      where: and(eq(orgNodes.id, nodeId), eq(orgNodes.networkId, networkId)),
    })

    if (!node) {
      return NextResponse.json({ error: 'Área não encontrada.' }, { status: 404 })
    }

    // Cannot delete the root node
    if (node.level === 0) {
      return NextResponse.json({ error: 'Não é possível remover a área raiz.' }, { status: 400 })
    }

    // Re-parent direct children to this node's parent before deleting
    await db
      .update(orgNodes)
      .set({ parentId: node.parentId })
      .where(and(eq(orgNodes.parentId, nodeId), eq(orgNodes.networkId, networkId)))

    await db.delete(orgNodes).where(eq(orgNodes.id, nodeId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/networks/[networkId]/org-nodes/[nodeId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
