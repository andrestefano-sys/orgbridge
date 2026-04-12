import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networks, networkMembers, orgNodes } from '@orgbridge/db'
import { eq, and } from 'drizzle-orm'

interface Params {
  params: Promise<{ networkId: string }>
}

async function assertOwner(networkId: string, userId: string) {
  const member = await db.query.networkMembers.findFirst({
    where: and(
      eq(networkMembers.networkId, networkId),
      eq(networkMembers.userId, userId),
      eq(networkMembers.role, 'owner'),
    ),
  })
  return !!member
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params

    const isOwner = await assertOwner(networkId, session.user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { name, parentId, color } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.length > 80) {
      return NextResponse.json({ error: 'Nome da área deve ter entre 1 e 80 caracteres.' }, { status: 400 })
    }

    // Determine level from parent
    let level = 1
    if (parentId) {
      const parent = await db.query.orgNodes.findFirst({
        where: and(eq(orgNodes.id, parentId), eq(orgNodes.networkId, networkId)),
      })
      if (!parent) {
        return NextResponse.json({ error: 'Nó pai não encontrado.' }, { status: 400 })
      }
      level = parent.level + 1
    }

    // Get position (count siblings)
    const siblings = await db.query.orgNodes.findMany({
      where: and(
        eq(orgNodes.networkId, networkId),
        parentId ? eq(orgNodes.parentId, parentId) : eq(orgNodes.level, level),
      ),
    })

    const [node] = await db.insert(orgNodes).values({
      networkId,
      parentId: parentId || null,
      name: name.trim(),
      level,
      color: color || null,
      position: siblings.length,
    }).returning()

    return NextResponse.json({ node }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/networks/[networkId]/org-nodes]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params

    // Check membership (any role)
    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, session.user.id),
      ),
    })
    if (!member) {
      return NextResponse.json({ error: 'Sem acesso a esta rede.' }, { status: 403 })
    }

    const nodes = await db.query.orgNodes.findMany({
      where: eq(orgNodes.networkId, networkId),
    })

    return NextResponse.json({ nodes })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/org-nodes]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
