import Link from 'next/link'

// ─── SVG Icons ──────────────────────────────────────────────────────
function IconNetwork() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
      <path d="M12 8v4M12 12l-4 4M12 12l4 4" />
    </svg>
  )
}
function IconFeed() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
function IconMail() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

// ─── Logo ────────────────────────────────────────────────────────────
function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: size, height: size, background: 'var(--ob-navy)' }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="3" r="2.5" fill="var(--ob-amber)" />
        <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
        <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
        <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// ─── Animated org-chart illustration ────────────────────────────────
function HeroIllustration() {
  return (
    <div className="relative w-full max-w-sm mx-auto select-none" aria-hidden>
      <svg viewBox="0 0 340 260" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        {/* Connecting lines */}
        <line x1="170" y1="60" x2="80" y2="150" stroke="rgba(233,160,16,0.25)" strokeWidth="1.5" strokeDasharray="5 4" className="line-draw" />
        <line x1="170" y1="60" x2="170" y2="150" stroke="rgba(233,160,16,0.25)" strokeWidth="1.5" strokeDasharray="5 4" className="line-draw" style={{ animationDelay: '0.2s' }} />
        <line x1="170" y1="60" x2="260" y2="150" stroke="rgba(233,160,16,0.25)" strokeWidth="1.5" strokeDasharray="5 4" className="line-draw" style={{ animationDelay: '0.4s' }} />
        <line x1="80" y1="190" x2="40" y2="240" stroke="rgba(233,160,16,0.15)" strokeWidth="1.5" strokeDasharray="4 3" className="line-draw" style={{ animationDelay: '0.8s' }} />
        <line x1="80" y1="190" x2="120" y2="240" stroke="rgba(233,160,16,0.15)" strokeWidth="1.5" strokeDasharray="4 3" className="line-draw" style={{ animationDelay: '0.9s' }} />
        <line x1="260" y1="190" x2="220" y2="240" stroke="rgba(233,160,16,0.15)" strokeWidth="1.5" strokeDasharray="4 3" className="line-draw" style={{ animationDelay: '1s' }} />
        <line x1="260" y1="190" x2="300" y2="240" stroke="rgba(233,160,16,0.15)" strokeWidth="1.5" strokeDasharray="4 3" className="line-draw" style={{ animationDelay: '1.1s' }} />

        {/* Root node */}
        <g className="node-a">
          <rect x="130" y="20" width="80" height="40" rx="12" fill="var(--ob-navy)" stroke="rgba(233,160,16,0.5)" strokeWidth="1.5" />
          <text x="170" y="44" textAnchor="middle" fill="#E9A010" fontSize="11" fontWeight="700" fontFamily="Sora, sans-serif">OrgBridge</text>
        </g>

        {/* Level 2 */}
        <g className="node-b" style={{ animationDelay: '0.5s' }}>
          <rect x="40" y="150" width="80" height="40" rx="10" fill="#1A2540" stroke="rgba(233,160,16,0.2)" strokeWidth="1" />
          <rect x="40" y="158" width="3" height="24" rx="2" fill="#6366f1" />
          <text x="86" y="174" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontFamily="Sora, sans-serif">Tecnologia</text>
        </g>

        <g className="node-c" style={{ animationDelay: '0.3s' }}>
          <rect x="130" y="150" width="80" height="40" rx="10" fill="#1A2540" stroke="rgba(233,160,16,0.2)" strokeWidth="1" />
          <rect x="130" y="158" width="3" height="24" rx="2" fill="#22c55e" />
          <text x="172" y="174" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontFamily="Sora, sans-serif">Comercial</text>
        </g>

        <g className="node-a" style={{ animationDelay: '0.7s' }}>
          <rect x="220" y="150" width="80" height="40" rx="10" fill="#1A2540" stroke="rgba(233,160,16,0.2)" strokeWidth="1" />
          <rect x="220" y="158" width="3" height="24" rx="2" fill="#f43f5e" />
          <text x="262" y="174" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontFamily="Sora, sans-serif">Marketing</text>
        </g>

        {/* Level 3 dots */}
        {[
          { x: 40, y: 240 }, { x: 120, y: 240 },
          { x: 220, y: 240 }, { x: 300, y: 240 },
        ].map((p, i) => (
          <g key={i} className={i % 2 === 0 ? 'node-b' : 'node-c'} style={{ animationDelay: `${0.4 + i * 0.15}s` }}>
            <circle cx={p.x} cy={p.y} r="14" fill="#1A2540" stroke="rgba(233,160,16,0.15)" strokeWidth="1" />
            <circle cx={p.x} cy={p.y} r="4" fill="rgba(233,160,16,0.4)" className="glow-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: 'var(--ob-surface)', border: '1px solid var(--ob-border)' }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `${color}14`, color }}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1.5 text-base" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--ob-text-muted)' }}>{desc}</p>
      </div>
    </div>
  )
}

// ─── Pricing card ──────────────────────────────────────────────────────
function PricingCard({
  plan, price, desc, features, cta, href, highlight,
}: {
  plan: string; price: string; desc: string; features: string[]; cta: string; href: string; highlight?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-7 flex flex-col gap-5 relative"
      style={{
        background: highlight ? 'var(--ob-navy)' : 'var(--ob-surface)',
        border: highlight ? '2px solid rgba(233,160,16,0.5)' : '1px solid var(--ob-border)',
      }}
    >
      {highlight && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold"
          style={{ background: 'var(--ob-amber)', color: 'var(--ob-navy)', fontFamily: 'var(--font-sora)' }}
        >
          Mais popular
        </div>
      )}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: highlight ? 'var(--ob-amber)' : 'var(--ob-text-muted)' }}>
          {plan}
        </p>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-bold" style={{ color: highlight ? '#fff' : 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            {price}
          </span>
          {price !== 'Grátis' && (
            <span className="text-sm mb-1.5" style={{ color: highlight ? 'rgba(255,255,255,0.5)' : 'var(--ob-text-faint)' }}>/mês</span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--ob-text-muted)' }}>{desc}</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm" style={{ color: highlight ? 'rgba(255,255,255,0.8)' : 'var(--ob-text-muted)' }}>
            <span style={{ color: highlight ? 'var(--ob-amber)' : 'var(--ob-success)', flexShrink: 0, marginTop: '2px' }}>
              <IconCheck />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-auto flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
        style={
          highlight
            ? { background: 'var(--ob-amber)', color: 'var(--ob-navy)' }
            : { background: 'var(--ob-surface-alt)', border: '1.5px solid var(--ob-border)', color: 'var(--ob-text)' }
        }
      >
        {cta}
      </Link>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ background: 'var(--ob-surface)' }}>
      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between px-5 sm:px-10"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--ob-border)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-base font-semibold" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            OrgBridge
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-70"
            style={{ color: 'var(--ob-text-muted)' }}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: 'var(--ob-navy)', color: '#fff' }}
          >
            Começar grátis
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, var(--ob-navy) 0%, #0F2240 55%, #1A1F2E 100%)' }}
      >
        {/* Background ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 70% 40%, rgba(233,160,16,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="animate-fade-slide-up">
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{ background: 'rgba(233,160,16,0.12)', border: '1px solid rgba(233,160,16,0.25)', color: 'var(--ob-amber)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current glow-pulse" />
              Rede social corporativa privada
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-5"
              style={{ color: '#FFFFFF', fontFamily: 'var(--font-sora)' }}
            >
              A rede interna que sua empresa{' '}
              <span style={{ color: 'var(--ob-amber)' }}>merece</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Feed corporativo estruturado pelo organograma real, reconhecimento de colaboradores, Code of Conduct e comunicação hierárquica — tudo em um só lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
                style={{ background: 'var(--ob-amber)', color: 'var(--ob-navy)' }}
              >
                Criar minha rede grátis
                <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold transition-all hover:opacity-80"
                style={{ border: '1.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
              >
                Já tenho conta
              </Link>
            </div>

            <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Sem cartão de crédito. Setup em menos de 2 minutos.
            </p>
          </div>

          {/* Illustration */}
          <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <div
        className="py-5 text-center text-sm"
        style={{ background: 'var(--ob-surface-alt)', borderBottom: '1px solid var(--ob-border)', color: 'var(--ob-text-faint)' }}
      >
        Construído para empresas que valorizam{' '}
        <strong style={{ color: 'var(--ob-text-muted)' }}>comunicação clara</strong>,{' '}
        <strong style={{ color: 'var(--ob-text-muted)' }}>cultura forte</strong> e{' '}
        <strong style={{ color: 'var(--ob-text-muted)' }}>equipes engajadas</strong>
      </div>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--ob-amber-dim)' }}>
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            Tudo o que sua equipe precisa
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--ob-text-muted)' }}>
            Do organograma ao feed de reconhecimento — uma plataforma completa para a vida interna da sua empresa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={<IconNetwork />}
            color="#E9A010"
            title="Organograma vivo"
            desc="Estrutura hierárquica interativa com drill-down por área. Visualize quem é quem e em qual nível estão."
          />
          <FeatureCard
            icon={<IconFeed />}
            color="#6366f1"
            title="Feed corporativo"
            desc="Posts, reconhecimentos, comunicados e documentos — organizados por relevância e hierarquia da empresa."
          />
          <FeatureCard
            icon={<IconStar />}
            color="#E9A010"
            title="Reconhecimento de talentos"
            desc="Kudos públicos para celebrar conquistas de colaboradores com reações e visibilidade ampla."
          />
          <FeatureCard
            icon={<IconShield />}
            color="#22c55e"
            title="Code of Conduct"
            desc="Diretrizes de uso personalizadas com aceite obrigatório. Mantenha o ambiente saudável e seguro."
          />
          <FeatureCard
            icon={<IconUsers />}
            color="#f43f5e"
            title="Gestão de membros"
            desc="Convite por e-mail, papéis hierárquicos (owner, admin, manager, member) e perfis individuais."
          />
          <FeatureCard
            icon={<IconMail />}
            color="#06b6d4"
            title="Convites inteligentes"
            desc="Envie convites em lote com papel e área predefinidos. Link seguro com expiração automática."
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="py-20 sm:py-24"
        style={{ background: 'linear-gradient(160deg, var(--ob-navy) 0%, #0F2240 100%)' }}
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--ob-amber)' }}>
              Como funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#fff', fontFamily: 'var(--font-sora)' }}>
              Setup em 3 passos
            </h2>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Sua rede corporativa funcionando em menos de 5 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Crie a rede',
                desc: 'Defina o nome, identificador e tipo da sua organização. O organograma raiz é criado automaticamente.',
              },
              {
                step: '02',
                title: 'Monte o organograma',
                desc: 'Adicione áreas e subáreas com drag-and-drop. Construa a hierarquia real da sua empresa visualmente.',
              },
              {
                step: '03',
                title: 'Convide a equipe',
                desc: 'Envie convites por e-mail definindo o papel de cada membro. Eles aceitam em um clique.',
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 2 && (
                  <div
                    className="hidden sm:block absolute top-6 left-full w-6 h-px"
                    style={{ background: 'rgba(233,160,16,0.2)', transform: 'translateX(-50%)' }}
                  />
                )}
                <div
                  className="rounded-2xl p-6"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="text-2xl font-bold mb-4"
                    style={{ color: 'var(--ob-amber)', fontFamily: 'var(--font-sora)', opacity: 0.7 }}
                  >
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: '#fff', fontFamily: 'var(--font-sora)' }}>
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 py-20 sm:py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--ob-amber-dim)' }}>
            Planos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            Simples e transparente
          </h2>
          <p className="text-base" style={{ color: 'var(--ob-text-muted)' }}>
            Comece grátis e escale conforme sua empresa cresce.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <PricingCard
            plan="Starter"
            price="Grátis"
            desc="Para equipes pequenas"
            features={['Até 25 membros', 'Organograma básico', 'Feed e reconhecimentos', 'Convites por e-mail']}
            cta="Começar grátis"
            href="/register"
          />
          <PricingCard
            plan="Business"
            price="R$ 149"
            desc="Para empresas em crescimento"
            features={['Até 200 membros', 'Organograma ilimitado', 'Code of Conduct', 'Relatórios de engajamento', 'Suporte prioritário']}
            cta="Assinar Business"
            href="/register"
            highlight
          />
          <PricingCard
            plan="Enterprise"
            price="Custom"
            desc="Para grandes organizações"
            features={['Membros ilimitados', 'SSO / SAML', 'SLA garantido', 'Implementação assistida', 'Contrato personalizado']}
            cta="Falar com vendas"
            href="mailto:contato@orgbridge.com"
          />
        </div>
      </section>

      {/* ── CTA final ── */}
      <section
        className="py-20 sm:py-24"
        style={{ background: 'var(--ob-surface-alt)', borderTop: '1px solid var(--ob-border)' }}
      >
        <div className="mx-auto max-w-2xl px-5 sm:px-8 text-center">
          <Logo size={48} />
          <h2 className="mt-6 text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}>
            Pronto para conectar sua equipe?
          </h2>
          <p className="text-base mb-8" style={{ color: 'var(--ob-text-muted)' }}>
            Crie sua rede corporativa agora. Sem cartão de crédito, sem complicação.
          </p>
          <Link
            href="/register"
            className="inline-flex h-13 items-center justify-center rounded-xl px-8 text-base font-semibold transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: 'var(--ob-navy)', color: '#fff', height: '52px' }}
          >
            Criar minha rede grátis →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t py-10 px-5 sm:px-10"
        style={{ background: 'var(--ob-navy)', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sora)' }}>
              OrgBridge
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-white transition-colors">Cadastrar</Link>
            <a href="mailto:contato@orgbridge.com" className="hover:text-white transition-colors">Contato</a>
          </nav>

          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2026 OrgBridge. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
