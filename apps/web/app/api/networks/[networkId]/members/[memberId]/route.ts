import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, orgNodes } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string; memberId: string }>
}

const VALID_ROLES = ['admin', 'manager', 'member']

// PATCH /api/networks/[networkId]/members/[memberId] — change role or org node
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, memberId } = await params
    const actorId = session.user.id

    // Check actor is owner or admin
    const actor = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, actorId),
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    // Get target member
    const target = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.id, memberId),
        eq(networkMembers.networkId, networkId),
      ),
    })

    if (!target) {
      return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })
    }

    // Cannot modify the owner
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Não é possível modificar o dono da rede.' }, { status: 403 })
    }

    const body = await req.json()

    // ── Org node assignment ──────────────────────────────────────
    if ('orgNodeId' in body) {
      const { orgNodeId } = body as { orgNodeId: string | null }

      if (orgNodeId !== null) {
        const node = await db.query.orgNodes.findFirst({
          where: and(eq(orgNodes.id, orgNodeId), eq(orgNodes.networkId, networkId)),
        })
        if (!node) {
          return NextResponse.json({ error: 'Área não encontrada.' }, { status: 404 })
        }
      }

      await db
        .update(networkMembers)
        .set({ orgNodeId: orgNodeId ?? null })
        .where(eq(networkMembers.id, memberId))

      return NextResponse.json({ ok: true, orgNodeId })
    }

    // ── Role change ──────────────────────────────────────────────
    const { role } = body

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Função inválida.' }, { status: 400 })
    }

    if (actor.role === 'admin' && role === 'admin') {
      return NextResponse.json({ error: 'Apenas o dono pode promover para administrador.' }, { status: 403 })
    }

    // Cannot change own role
    if (target.userId === actorId) {
      return NextResponse.json({ error: 'Não pode alterar a própria função.' }, { status: 400 })
    }

    await db
      .update(networkMembers)
      .set({ role })
      .where(eq(networkMembers.id, memberId))

    return NextResponse.json({ ok: true, role })
  } catch (err) {
    console.error('[PATCH /api/networks/[networkId]/members/[memberId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// DELETE /api/networks/[networkId]/members/[memberId] — remove member
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, memberId } = await params
    const actorId = session.user.id

    const actor = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, actorId),
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!actor || !['owner', 'admin'].includes(actor.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const target = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.id, memberId),
        eq(networkMembers.networkId, networkId),
      ),
    })

    if (!target) {
      return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })
    }

    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Não é possível remover o dono da rede.' }, { status: 403 })
    }

    if (target.userId === actorId) {
      return NextResponse.json({ error: 'Não pode remover a si mesmo.' }, { status: 400 })
    }

    await db
      .update(networkMembers)
      .set({ status: 'suspended' })
      .where(eq(networkMembers.id, memberId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/networks/[networkId]/members/[memberId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
