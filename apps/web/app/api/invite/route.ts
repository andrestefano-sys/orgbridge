import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, invitations, networkMembers, networks } from '@orgbridge/db'
import { and, eq, gt } from 'drizzle-orm'
import { createNotification } from '@/lib/notifications'

// GET /api/invite?token= — validate token, return invitation details
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token || typeof token !== 'string' || token.length > 128) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.token, token), gt(invitations.expiresAt, new Date())))
      .limit(1)

    const invitation = rows[0] ?? null

    if (!invitation) {
      return NextResponse.json({ error: 'Convite inválido ou expirado.' }, { status: 404 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Este convite já foi aceito.' }, { status: 409 })
    }

    const networkRows = await db
      .select({ id: networks.id, name: networks.name, slug: networks.slug })
      .from(networks)
      .where(eq(networks.id, invitation.networkId))
      .limit(1)

    const network = networkRows[0] ?? null

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        network,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (err) {
    console.error('[GET /api/invite]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// POST /api/invite — accept invitation (user must be authenticated)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { token } = await req.json()

    if (!token || typeof token !== 'string' || token.length > 128) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 })
    }

    const rows = await db
      .select()
      .from(invitations)
      .where(and(eq(invitations.token, token), gt(invitations.expiresAt, new Date())))
      .limit(1)

    const invitation = rows[0] ?? null

    if (!invitation) {
      return NextResponse.json({ error: 'Convite inválido ou expirado.' }, { status: 404 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: 'Este convite já foi aceito.' }, { status: 409 })
    }

    const userId = session.user.id
    const userEmail = session.user.email?.toLowerCase()
    const emailMismatch = userEmail && invitation.email !== userEmail

    // Check if already a member
    const existingRows = await db
      .select()
      .from(networkMembers)
      .where(and(eq(networkMembers.networkId, invitation.networkId), eq(networkMembers.userId, userId)))
      .limit(1)

    if (existingRows[0]) {
      await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invitation.id))
      return NextResponse.json({ ok: true, alreadyMember: true, networkId: invitation.networkId, emailMismatch })
    }

    // Create membership
    await db.insert(networkMembers).values({
      networkId: invitation.networkId,
      userId,
      role: invitation.role,
      status: 'active',
      orgNodeId: invitation.orgNodeId,
      joinedAt: new Date(),
    })

    // Mark invitation as accepted
    await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invitation.id))

    // Notify admins/owners
    const admins = await db
      .select()
      .from(networkMembers)
      .where(and(eq(networkMembers.networkId, invitation.networkId), eq(networkMembers.status, 'active')))

    const joinerName = session.user.name ?? session.user.email ?? 'Novo membro'
    for (const admin of admins) {
      if (['owner', 'admin'].includes(admin.role)) {
        await createNotification({
          userId: admin.userId,
          networkId: invitation.networkId,
          type: 'new_member',
          title: `${joinerName} entrou na rede`,
          actorId: userId,
          targetType: 'member',
          targetId: userId,
        })
      }
    }

    return NextResponse.json({ ok: true, networkId: invitation.networkId, role: invitation.role, emailMismatch })
  } catch (err) {
    console.error('[POST /api/invite]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
