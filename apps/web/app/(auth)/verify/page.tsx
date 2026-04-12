import { db, users, verificationTokens } from '@orgbridge/db'
import { eq, and, gt } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { sendWelcomeEmail } from '@orgbridge/email'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    return <ErrorState message="Link de verificação inválido ou ausente." />
  }

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.token, token),
      eq(verificationTokens.type, 'email_verification'),
      gt(verificationTokens.expiresAt, new Date()),
    ),
  })

  if (!record) {
    return <ErrorState message="Link expirado ou já utilizado. Solicite um novo cadastro." />
  }

  const [user] = await db
    .update(users)
    .set({ emailVerified: true, updatedAt: new Date() })
    .where(eq(users.id, record.userId))
    .returning({ email: users.email, name: users.name })

  await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id))

  if (user) {
    await sendWelcomeEmail(user.email, user.name)
  }

  redirect('/login?verified=1')
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-4 text-center animate-fade-in">
      <div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: 'var(--ob-error-bg)', border: '1px solid var(--ob-error-border)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 18L18 6M6 6l12 12"
            stroke="var(--ob-error)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h2
        className="mb-2 text-xl font-semibold"
        style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
      >
        Verificação falhou
      </h2>
      <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>
        {message}
      </p>
      <Link
        href="/login"
        className="text-sm font-medium hover:underline underline-offset-2"
        style={{ color: 'var(--ob-amber-dim)' }}
      >
        ← Voltar para o login
      </Link>
    </div>
  )
}
