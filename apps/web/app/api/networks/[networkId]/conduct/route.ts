import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, conductPolicies, conductAcceptances, networkMembers } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

// GET /api/networks/[networkId]/conduct — get policy + viewer acceptance status
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { networkId } = await params

    const member = await db.query.networkMembers.findFirst({
      where: and(eq(networkMembers.networkId, networkId), eq(networkMembers.userId, session.user.id)),
    })
    if (!member) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })

    const policy = await db.query.conductPolicies.findFirst({
      where: eq(conductPolicies.networkId, networkId),
    })

    if (!policy) return NextResponse.json({ policy: null, accepted: true })

    const acceptance = await db.query.conductAcceptances.findFirst({
      where: and(eq(conductAcceptances.policyId, policy.id), eq(conductAcceptances.userId, session.user.id)),
    })

    return NextResponse.json({
      policy: { id: policy.id, title: policy.title, content: policy.content, version: policy.version },
      accepted: !!acceptance,
    })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/conduct]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// POST /api/networks/[networkId]/conduct — upsert policy (owner/admin only)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { networkId } = await params

    const member = await db.query.networkMembers.findFirst({
      where: and(eq(networkMembers.networkId, networkId), eq(networkMembers.userId, session.user.id)),
    })
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { title, content } = await req.json()
    if (!content || typeof content !== 'string' || content.trim().length < 20) {
      return NextResponse.json({ error: 'Política deve ter pelo menos 20 caracteres.' }, { status: 400 })
    }

    const existing = await db.query.conductPolicies.findFirst({
      where: eq(conductPolicies.networkId, networkId),
    })

    if (existing) {
      // Bump version
      const parts = existing.version.split('.')
      const patch = parseInt(parts[1] ?? '0') + 1
      const newVersion = `${parts[0]}.${patch}`

      const [updated] = await db
        .update(conductPolicies)
        .set({
          title: title?.trim() || existing.title,
          content: content.trim(),
          version: newVersion,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(conductPolicies.id, existing.id))
        .returning()

      return NextResponse.json({ policy: updated })
    }

    const [created] = await db.insert(conductPolicies).values({
      networkId,
      title: title?.trim() || 'Diretrizes de Uso da Rede',
      content: content.trim(),
      version: '1.0',
      publishedAt: new Date(),
    }).returning()

    return NextResponse.json({ policy: created }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/networks/[networkId]/conduct]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// PUT /api/networks/[networkId]/conduct/accept — accept policy
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { networkId } = await params

    const member = await db.query.networkMembers.findFirst({
      where: and(eq(networkMembers.networkId, networkId), eq(networkMembers.userId, session.user.id)),
    })
    if (!member) return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })

    const policy = await db.query.conductPolicies.findFirst({
      where: eq(conductPolicies.networkId, networkId),
    })
    if (!policy) return NextResponse.json({ error: 'Nenhuma política publicada.' }, { status: 404 })

    // Upsert acceptance
    const existing = await db.query.conductAcceptances.findFirst({
      where: and(eq(conductAcceptances.policyId, policy.id), eq(conductAcceptances.userId, session.user.id)),
    })

    if (!existing) {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0]?.trim() : null

      await db.insert(conductAcceptances).values({
        policyId: policy.id,
        userId: session.user.id,
        networkId,
        policyVersion: policy.version,
        ip: ip ?? null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/networks/[networkId]/conduct]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
