import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networkMembers, users } from '@orgbridge/db'
import { and, eq } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ networkId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params

    // Verify requester is a member
    const requester = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, session.user.id),
      ),
    })

    if (!requester) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const members = await db.query.networkMembers.findMany({
      where: eq(networkMembers.networkId, networkId),
      with: { user: true },
      orderBy: (m, { asc }) => [asc(m.joinedAt)],
    })

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        status: m.status,
        orgNodeId: m.orgNodeId,
        joinedAt: m.joinedAt,
        user: {
          id: (m as any).user?.id,
          name: (m as any).user?.name,
          email: (m as any).user?.email,
          image: (m as any).user?.image,
          jobTitle: (m as any).user?.jobTitle ?? null,
        },
      })),
    })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/members]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
