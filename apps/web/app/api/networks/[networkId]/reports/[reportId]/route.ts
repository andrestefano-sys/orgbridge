import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, contentReports } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string; reportId: string }>
}

// PATCH /api/networks/[networkId]/reports/[reportId] — resolve or dismiss
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId, reportId } = await params
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

    const report = await db.query.contentReports.findFirst({
      where: and(
        eq(contentReports.id, reportId),
        eq(contentReports.networkId, networkId),
      ),
    })

    if (!report) {
      return NextResponse.json({ error: 'Denúncia não encontrada.' }, { status: 404 })
    }

    const { status, reviewNotes } = await req.json()

    if (!['resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    await db
      .update(contentReports)
      .set({
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes?.trim() || null,
      })
      .where(eq(contentReports.id, reportId))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/networks/[networkId]/reports/[reportId]]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
