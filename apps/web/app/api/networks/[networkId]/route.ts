import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networks, networkMembers } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

// GET /api/networks/[networkId] — get network details
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params

    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, session.user.id),
      ),
    })
    if (!member) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })

    const network = await db.query.networks.findFirst({
      where: eq(networks.id, networkId),
    })
    if (!network) return NextResponse.json({ error: 'Rede não encontrada.' }, { status: 404 })

    return NextResponse.json({ network })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// PATCH /api/networks/[networkId] — update network (owner/admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params

    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, session.user.id),
      ),
    })

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, industry, country, city, state, logoUrl } = body

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
        return NextResponse.json({ error: 'Nome deve ter entre 2 e 100 caracteres.' }, { status: 400 })
      }
    }

    if (logoUrl !== undefined && logoUrl !== null && logoUrl !== '') {
      if (typeof logoUrl !== 'string' || logoUrl.length > 500) {
        return NextResponse.json({ error: 'URL do logo inválida.' }, { status: 400 })
      }
      try { new URL(logoUrl) } catch {
        return NextResponse.json({ error: 'URL do logo inválida.' }, { status: 400 })
      }
    }

    const updates: Partial<typeof networks.$inferInsert> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (industry !== undefined) updates.industry = industry?.trim() || null
    if (country !== undefined) updates.country = country?.trim() || null
    if (city !== undefined) updates.city = city?.trim() || null
    if (state !== undefined) updates.state = state?.trim() || null
    if (logoUrl !== undefined) updates.logoUrl = logoUrl?.trim() || null

    const [updated] = await db
      .update(networks)
      .set(updates)
      .where(eq(networks.id, networkId))
      .returning()

    return NextResponse.json({ network: updated })
  } catch (err) {
    console.error('[PATCH /api/networks/[networkId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
