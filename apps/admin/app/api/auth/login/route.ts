import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { db, adminUsers } from '@orgbridge/db'
import { eq } from 'drizzle-orm'
import { createAdminToken, ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPTIONS } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 })
    }

    const user = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email.toLowerCase().trim()),
    })

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    const valid = await compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    // Update last login
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id))

    const token = createAdminToken({ id: user.id, email: user.email, name: user.name, role: user.role })

    const res = NextResponse.json({ ok: true, name: user.name, role: user.role })
    res.cookies.set(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTIONS)
    return res
  } catch (err) {
    console.error('[admin login]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
