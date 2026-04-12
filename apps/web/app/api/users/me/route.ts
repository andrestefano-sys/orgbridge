import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@orgbridge/auth'
import { db, users } from '@orgbridge/db'
import { eq } from 'drizzle-orm'

// GET /api/users/me
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true, bio: true, createdAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[GET /api/users/me]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

// PATCH /api/users/me — update name and/or avatarUrl
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await req.json()
    const { name, avatarUrl, jobTitle, bio } = body

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Nome deve ter ao menos 2 caracteres.' }, { status: 400 })
      }
      if (name.trim().length > 100) {
        return NextResponse.json({ error: 'Nome muito longo.' }, { status: 400 })
      }
    }

    if (avatarUrl !== undefined && avatarUrl !== null) {
      if (typeof avatarUrl !== 'string' || avatarUrl.length > 500) {
        return NextResponse.json({ error: 'URL do avatar inválida.' }, { status: 400 })
      }
      try {
        new URL(avatarUrl)
      } catch {
        return NextResponse.json({ error: 'URL do avatar inválida.' }, { status: 400 })
      }
    }

    if (jobTitle !== undefined && jobTitle !== null) {
      if (typeof jobTitle !== 'string' || jobTitle.length > 100) {
        return NextResponse.json({ error: 'Cargo deve ter no máximo 100 caracteres.' }, { status: 400 })
      }
    }

    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string' || bio.length > 300) {
        return NextResponse.json({ error: 'Bio deve ter no máximo 300 caracteres.' }, { status: 400 })
      }
    }

    const updates: {
      name?: string
      avatarUrl?: string | null
      jobTitle?: string | null
      bio?: string | null
      updatedAt: Date
    } = { updatedAt: new Date() }

    if (name !== undefined) updates.name = name.trim()
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl || null
    if (jobTitle !== undefined) updates.jobTitle = (jobTitle as string)?.trim() || null
    if (bio !== undefined) updates.bio = (bio as string)?.trim() || null

    await db.update(users).set(updates).where(eq(users.id, session.user.id))

    const updated = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true, bio: true },
    })

    return NextResponse.json({ user: updated })
  } catch (err) {
    console.error('[PATCH /api/users/me]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
