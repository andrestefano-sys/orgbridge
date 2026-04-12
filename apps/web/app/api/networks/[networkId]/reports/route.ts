import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, contentReports } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

const VALID_REASONS = ['harassment', 'spam', 'inappropriate', 'misinformation', 'other']
const VALID_TARGET_TYPES = ['post', 'comment']

// POST /api/networks/[networkId]/reports — submit a content report
export async function POST(req: NextRequest, { params }: Params) {
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
    if (!member) {
      return NextResponse.json({ error: 'Sem acesso.' }, { status: 403 })
    }

    const body = await req.json()
    const { targetType, targetId, reason, description } = body

    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
    }
    if (!targetId || typeof targetId !== 'string' || targetId.length > 128) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
    }
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Motivo inválido.' }, { status: 400 })
    }
    if (description && (typeof description !== 'string' || description.length > 500)) {
      return NextResponse.json({ error: 'Descrição muito longa.' }, { status: 400 })
    }

    // Prevent duplicate pending reports from same user for same content
    const existing = await db.query.contentReports.findFirst({
      where: and(
        eq(contentReports.networkId, networkId),
        eq(contentReports.reporterId, userId),
        eq(contentReports.targetId, targetId),
        eq(contentReports.status, 'pending'),
      ),
    })
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true })
    }

    await db.insert(contentReports).values({
      networkId,
      reporterId: userId,
      targetType,
      targetId,
      reason,
      description: description?.trim() || null,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/networks/[networkId]/reports]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// GET /api/networks/[networkId]/reports — list reports (admin/owner only)
export async function GET(req: NextRequest, { params }: Params) {
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
        eq(networkMembers.status, 'active'),
      ),
    })
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const status = req.nextUrl.searchParams.get('status') ?? 'pending'

    const reports = await db.query.contentReports.findMany({
      where: and(
        eq(contentReports.networkId, networkId),
        eq(contentReports.status, status),
      ),
      with: {
        reporter: { columns: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    })

    return NextResponse.json({ reports })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/reports]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
