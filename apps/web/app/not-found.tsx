import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-svh flex items-center justify-center px-5"
      style={{ background: 'var(--ob-surface-alt)' }}
    >
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        {/* Graphic */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-3xl mb-6"
          style={{ background: 'var(--ob-navy)' }}
        >
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" opacity="0.4" />
            <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.3)" />
            <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.3)" />
            <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.25)" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.25)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Code */}
        <p
          className="text-6xl font-bold mb-2 tabular-nums"
          style={{ color: 'var(--ob-amber)', fontFamily: 'var(--font-sora)', letterSpacing: '-0.04em' }}
        >
          404
        </p>

        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
        >
          Página não encontrada
        </h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>
          O endereço que você acessou não existe ou foi movido.
          Verifique o link ou volte ao início.
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--ob-navy)', color: '#fff', fontFamily: 'var(--font-sora)' }}
          >
            Ir para o início
          </Link>
          <Link
            href="javascript:history.back()"
            className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:opacity-70"
            style={{
              background: 'var(--ob-surface)',
              border: '1px solid var(--ob-border)',
              color: 'var(--ob-text-muted)',
            }}
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  )
}
