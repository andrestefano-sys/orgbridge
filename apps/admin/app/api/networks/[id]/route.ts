import { NextRequest, NextResponse } from 'next/server'
import { db, networks } from '@orgbridge/db'
import { eq } from 'drizzle-orm'
import { getAdminSession } from '@/lib/auth'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  try {
    const { id } = await params
    const { status } = await req.json()

    if (!['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    await db.update(networks).set({ status, updatedAt: new Date() }).where(eq(networks.id, id))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin network patch]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
