import { NextRequest, NextResponse } from 'next/server'
import { db, users, verificationTokens } from '@orgbridge/db'
import { eq, and } from 'drizzle-orm'
import { sendPasswordResetEmail } from '@orgbridge/email'
import { randomBytes } from 'crypto'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) })

    // Retorna 200 mesmo se não encontrou — evita enumeração de e-mails
    if (user) {
      // Invalidar tokens de reset anteriores do mesmo usuário
      await db.delete(verificationTokens).where(
        and(
          eq(verificationTokens.userId, user.id),
          eq(verificationTokens.type, 'password_reset'),
        ),
      )

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1h

      await db.insert(verificationTokens).values({
        userId: user.id,
        token,
        type: 'password_reset',
        expiresAt,
      })

      await sendPasswordResetEmail(normalizedEmail, user.name, token)
    }

    return NextResponse.json({ message: 'Se o e-mail existir, você receberá as instruções.' })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
