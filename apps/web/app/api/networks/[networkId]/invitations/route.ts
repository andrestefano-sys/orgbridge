import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, networks, networkMembers, invitations, users } from '@orgbridge/db'
import { eq, and, gt, isNull, desc } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { sendNetworkInviteEmail } from '@orgbridge/email'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Params {
  params: Promise<{ networkId: string }>
}

// GET /api/networks/[networkId]/invitations — list pending invitations (admin/owner)
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
        eq(networkMembers.status, 'active'),
      ),
    })

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const pending = await db.query.invitations.findMany({
      where: and(
        eq(invitations.networkId, networkId),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date()),
      ),
      orderBy: [desc(invitations.createdAt)],
    })

    return NextResponse.json({ invitations: pending })
  } catch (err) {
    console.error('[GET /api/networks/[networkId]/invitations]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// DELETE /api/networks/[networkId]/invitations?token= — revoke invitation
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório.' }, { status: 400 })
    }

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

    await db
      .delete(invitations)
      .where(and(eq(invitations.networkId, networkId), eq(invitations.token, token)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/networks/[networkId]/invitations]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { networkId } = await params
    const userId = session.user.id

    // Check owner or admin
    const member = await db.query.networkMembers.findFirst({
      where: and(
        eq(networkMembers.networkId, networkId),
        eq(networkMembers.userId, userId),
      ),
    })
    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sem permissão para convidar.' }, { status: 403 })
    }

    const network = await db.query.networks.findFirst({
      where: eq(networks.id, networkId),
    })
    if (!network) {
      return NextResponse.json({ error: 'Rede não encontrada.' }, { status: 404 })
    }

    const { emails: rawEmails, role } = await req.json()

    if (!Array.isArray(rawEmails) || rawEmails.length === 0) {
      return NextResponse.json({ error: 'Informe ao menos um e-mail.' }, { status: 400 })
    }

    if (rawEmails.length > 20) {
      return NextResponse.json({ error: 'Máximo de 20 convites por vez.' }, { status: 400 })
    }

    const validRole = ['admin', 'manager', 'member'].includes(role) ? role : 'member'
    const results: Array<{ email: string; status: 'sent' | 'skipped'; reason?: string }> = []

    for (const raw of rawEmails) {
      const email = String(raw).toLowerCase().trim()

      if (!EMAIL_REGEX.test(email) || email.length > 254) {
        results.push({ email, status: 'skipped', reason: 'e-mail inválido' })
        continue
      }

      // Don't invite self
      if (email === session.user?.email?.toLowerCase()) {
        results.push({ email, status: 'skipped', reason: 'é o próprio remetente' })
        continue
      }

      // Check if already a member
      const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) })
      if (existingUser) {
        const alreadyMember = await db.query.networkMembers.findFirst({
          where: and(
            eq(networkMembers.networkId, networkId),
            eq(networkMembers.userId, existingUser.id),
          ),
        })
        if (alreadyMember) {
          results.push({ email, status: 'skipped', reason: 'já é membro' })
          continue
        }
      }

      // Delete any existing pending invitation for this email+network
      const existing = await db.query.invitations.findFirst({
        where: and(eq(invitations.networkId, networkId), eq(invitations.email, email)),
      })
      if (existing) {
        await db.delete(invitations).where(eq(invitations.id, existing.id))
      }

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      await db.insert(invitations).values({
        networkId,
        email,
        role: validRole,
        token,
        expiresAt,
      })

      await sendNetworkInviteEmail(email, network.name, session.user.name ?? 'Alguém', token)
      results.push({ email, status: 'sent' })
    }

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[POST /api/networks/[networkId]/invitations]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
