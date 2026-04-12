import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db, users, verificationTokens } from '@orgbridge/db'
import { sendVerificationEmail } from '@orgbridge/email'
import { randomBytes } from 'crypto'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    if (typeof name !== 'string' || name.length > 100) {
      return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'A senha deve ter entre 8 e 128 caracteres.' }, { status: 400 })
    }

    const passwordHash = await hash(password, 12)

    let user: { id: string; name: string }

    try {
      const [inserted] = await db
        .insert(users)
        .values({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash, emailVerified: false })
        .returning({ id: users.id, name: users.name })
      user = inserted!
    } catch (err: unknown) {
      if (err instanceof Error && err.message.toLowerCase().includes('unique')) {
        return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
      }
      throw err
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await db.insert(verificationTokens).values({
      userId: user.id,
      token,
      type: 'email_verification',
      expiresAt,
    })

    await sendVerificationEmail(email.toLowerCase().trim(), user.name, token)

    return NextResponse.json({ message: 'Cadastro realizado. Verifique seu e-mail.' }, { status: 201 })
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
