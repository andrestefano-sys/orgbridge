import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db, users, verificationTokens } from '@orgbridge/db'
import { eq, and, gt } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== 'string' || token.length > 128) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'A senha deve ter entre 8 e 128 caracteres.' }, { status: 400 })
    }

    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, 'password_reset'),
        gt(verificationTokens.expiresAt, new Date()),
      ),
    })

    if (!record) {
      return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 400 })
    }

    const passwordHash = await hash(password, 12)

    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, record.userId))
    await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id))

    return NextResponse.json({ message: 'Senha redefinida com sucesso.' })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
