import Link from 'next/link'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.orgbridge.net'

// ─── Design tokens ────────────────────────────────────────────
const navy = '#0D1929'
const navyMid = '#142338'
const amber = '#E9A010'
const amberDim = '#C47F08'
const surface = '#FFFFFF'
const surfaceAlt = '#F9F8F5'
const textMain = '#1A1F2E'
const textMuted = '#6B7382'
const textFaint = '#9CA3AF'
const border = '#E5E2DC'

// ─── Features data ────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
    title: 'Feed corporativo',
    desc: 'Publicações, reconhecimentos, comunicados e documentos em um único feed organizado. Com reações, comentários e fixação de posts.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    title: 'Mensagens diretas',
    desc: 'Chat privado entre membros com entrega em tempo real, indicador de leitura e histórico completo.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 5a3 3 0 100 6 3 3 0 000-6zM5 19a3 3 0 100-6 3 3 0 000 6zM19 19a3 3 0 100-6 3 3 0 000 6zM12 11v2M12 13l-4 4M12 13l4 4" />
      </svg>
    ),
    title: 'Organograma interativo',
    desc: 'Visualize e gerencie a hierarquia da sua organização. Arraste, reorganize e conecte áreas com facilidade.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5zM5 19a7 7 0 0114 0" />
      </svg>
    ),
    title: 'IA integrada',
    desc: 'Assistente inteligente treinado com o contexto da sua empresa. Responde perguntas, resume e cria conteúdo.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    title: 'Analytics',
    desc: 'Acompanhe engajamento, crescimento de membros, posts mais curtidos e atividade diária da rede.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Moderação',
    desc: 'Painel de denúncias, Code of Conduct personalizável e ferramentas de gestão para admins.',
  },
]

// ─── Pricing data ─────────────────────────────────────────────
const PLANS = [
  {
    key: 'free',
    label: 'Free',
    price: 'R$0',
    period: '',
    desc: 'Para começar',
    limit: '10 membros',
    features: ['10 membros', 'Feed e mensagens', 'Organograma básico', 'IA (10 msgs/dia)'],
    cta: 'Começar grátis',
    ctaHref: `${APP_URL}/register`,
    highlight: false,
  },
  {
    key: 'starter',
    label: 'Starter',
    price: 'R$99',
    period: '/mês',
    desc: 'Pequenas equipes',
    limit: '50 membros',
    features: ['50 membros', 'Tudo do Free', 'Analytics básico', 'Moderação', 'IA ilimitada', 'Suporte por email'],
    cta: 'Assinar Starter',
    ctaHref: `${APP_URL}/register`,
    highlight: false,
  },
  {
    key: 'business',
    label: 'Business',
    price: 'R$299',
    period: '/mês',
    desc: 'Empresas em crescimento',
    limit: '200 membros',
    features: ['200 membros', 'Tudo do Starter', 'Analytics avançado', 'Convites em massa', 'Exportação de dados', 'Suporte prioritário'],
    cta: 'Assinar Business',
    ctaHref: `${APP_URL}/register`,
    highlight: true,
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    price: 'R$899',
    period: '/mês',
    desc: 'Grandes organizações',
    limit: 'Ilimitado',
    features: ['Membros ilimitados', 'Tudo do Business', 'SLA garantido', 'Onboarding dedicado', 'Relatórios personalizados', 'Suporte 24/7'],
    cta: 'Falar com vendas',
    ctaHref: 'mailto:sales@orgbridge.net',
    highlight: false,
  },
]

// ─── How it works ─────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Crie sua rede',
    desc: 'Cadastre sua organização, defina o nome, área e configure o organograma em menos de 5 minutos.',
  },
  {
    num: '02',
    title: 'Convide sua equipe',
    desc: 'Envie convites por email com funções definidas. Os membros entram com um clique.',
  },
  {
    num: '03',
    title: 'Conecte e cresça',
    desc: 'Comunique, reconheça talentos e tome decisões com base em dados reais da sua empresa.',
  },
]

// ─── Check icon ───────────────────────────────────────────────
function CheckIcon({ color = '#4ade80' }: { color?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

// ─── Logo ─────────────────────────────────────────────────────
function Logo({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: light ? 'rgba(255,255,255,0.15)' : navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="3" r="2.5" fill={amber} />
          <circle cx="3" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
          <circle cx="13" cy="12" r="2.5" fill="rgba(233,160,16,0.6)" />
          <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="rgba(233,160,16,0.5)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-sora)', color: light ? '#fff' : textMain, letterSpacing: '-0.02em' }}>
        OrgBridge
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: surfaceAlt, color: textMain, minHeight: '100vh' }}>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(249,248,245,0.92)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: textMuted, padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}>
              Funcionalidades
            </a>
            <a href="#pricing" style={{ fontSize: 14, fontWeight: 500, color: textMuted, padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}>
              Preços
            </a>
            <a href={`${APP_URL}/login`} style={{ fontSize: 14, fontWeight: 500, color: textMuted, padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}>
              Entrar
            </a>
            <a
              href={`${APP_URL}/register`}
              style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: navy, padding: '7px 18px', borderRadius: 10, textDecoration: 'none', fontFamily: 'var(--font-sora)' }}
            >
              Começar grátis
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px 72px', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `rgba(233,160,16,0.1)`, border: `1px solid rgba(233,160,16,0.3)`, borderRadius: 999, padding: '4px 14px', marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: amber, display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: amberDim, fontFamily: 'var(--font-sora)', letterSpacing: '0.02em' }}>
            REDE SOCIAL CORPORATIVA COM IA
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, fontFamily: 'var(--font-sora)', lineHeight: 1.08, letterSpacing: '-0.03em', color: textMain, maxWidth: 840, margin: '0 auto 24px' }}>
          Conecte sua empresa.{' '}
          <span style={{ color: amber }}>Potencialize</span>{' '}
          com IA.
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: textMuted, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.65 }}>
          Rede social privada para organizações. Feed, mensagens, organograma interativo e IA integrada — tudo em um só lugar.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a
            href={`${APP_URL}/register`}
            style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-sora)', color: navy, background: amber, padding: '13px 28px', borderRadius: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Criar minha rede grátis
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href={`${APP_URL}/login`}
            style={{ fontSize: 15, fontWeight: 500, color: textMuted, background: surface, border: `1px solid ${border}`, padding: '13px 28px', borderRadius: 12, textDecoration: 'none' }}
          >
            Já tenho conta
          </a>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: textFaint }}>
          Grátis para até 10 membros · Sem cartão de crédito
        </p>
      </section>

      {/* ── Mock preview ─────────────────────────────────────── */}
      <section style={{ maxWidth: 1000, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(13,25,41,0.12)', background: surface }}>
          {/* Fake browser chrome */}
          <div style={{ background: navyMid, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80' }} />
            <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginLeft: 12, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>app.orgbridge.net/feed</span>
            </div>
          </div>
          {/* Fake app UI */}
          <div style={{ display: 'flex', height: 320, background: surfaceAlt }}>
            {/* Sidebar */}
            <div style={{ width: 200, borderRight: `1px solid ${border}`, background: surface, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              <Logo />
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {['Início', 'Feed', 'Membros', 'Mensagens', 'Organograma', 'AI'].map((item, i) => (
                  <div key={item} style={{ padding: '7px 10px', borderRadius: 8, background: i === 1 ? surfaceAlt : 'transparent', fontSize: 13, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? textMain : textMuted }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {/* Feed preview */}
            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
              {[
                { name: 'Ana Silva', role: 'CEO', text: '🏆 Parabenizo toda a equipe pelo lançamento incrível desta semana!', tag: 'Reconhecimento', tagColor: amber },
                { name: 'Bruno Costa', role: 'Dev Lead', text: 'Publicamos a nova versão da API. Verifiquem a documentação atualizada.', tag: 'Comunicado', tagColor: '#818cf8' },
              ].map((post) => (
                <div key={post.name} style={{ background: surface, borderRadius: 12, padding: '14px 16px', border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: amber, fontFamily: 'var(--font-sora)', flexShrink: 0 }}>
                      {post.name.split(' ').map((w: string) => w[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: textMain, fontFamily: 'var(--font-sora)' }}>{post.name}</div>
                      <div style={{ fontSize: 11, color: textFaint }}>{post.role}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, background: `rgba(233,160,16,0.1)`, color: post.tagColor, border: `1px solid ${post.tagColor}30`, padding: '2px 8px', borderRadius: 999 }}>
                      {post.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: textMain, lineHeight: 1.5, margin: 0 }}>{post.text}</p>
                  <div style={{ marginTop: 10, display: 'flex', gap: 12 }}>
                    {['👍 12', '💬 3', '⭐ 7'].map((r) => (
                      <span key={r} style={{ fontSize: 11, color: textFaint }}>{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: amberDim, fontFamily: 'var(--font-sora)', marginBottom: 12 }}>FUNCIONALIDADES</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, fontFamily: 'var(--font-sora)', letterSpacing: '-0.025em', color: textMain, margin: '0 auto', maxWidth: 600, lineHeight: 1.15 }}>
            Tudo que sua empresa precisa em uma única plataforma
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{ background: surface, border: `1px solid ${border}`, borderRadius: 16, padding: '24px 24px 28px' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `rgba(13,25,41,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: navy, marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-sora)', color: textMain, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section style={{ background: navy, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: amber, fontFamily: 'var(--font-sora)', marginBottom: 12 }}>COMO FUNCIONA</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, fontFamily: 'var(--font-sora)', letterSpacing: '-0.025em', color: '#fff', margin: 0, lineHeight: 1.15 }}>
              Em funcionamento em minutos
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{ position: 'relative' }}>
                <div style={{ fontSize: 56, fontWeight: 800, fontFamily: 'var(--font-sora)', color: 'rgba(233,160,16,0.15)', lineHeight: 1, marginBottom: 12 }}>{step.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-sora)', color: '#fff', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: amberDim, fontFamily: 'var(--font-sora)', marginBottom: 12 }}>PREÇOS</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, fontFamily: 'var(--font-sora)', letterSpacing: '-0.025em', color: textMain, margin: '0 auto 16px', maxWidth: 600, lineHeight: 1.15 }}>
            Plano para cada tamanho de empresa
          </h2>
          <p style={{ fontSize: 16, color: textMuted, margin: 0 }}>Cancele a qualquer momento. Sem letras miúdas.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              style={{
                background: plan.highlight ? navy : surface,
                border: plan.highlight ? `1.5px solid rgba(233,160,16,0.4)` : `1px solid ${border}`,
                borderRadius: 20,
                padding: '28px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {plan.highlight && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: amber, fontFamily: 'var(--font-sora)', marginBottom: 12 }}>⭐ MAIS POPULAR</div>
              )}
              <p style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sora)', color: plan.highlight ? amber : amberDim, marginBottom: 4 }}>{plan.label}</p>
              <p style={{ fontSize: 12, color: plan.highlight ? 'rgba(255,255,255,0.5)' : textFaint, marginBottom: 16 }}>{plan.desc}</p>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-sora)', color: plan.highlight ? '#fff' : textMain }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.4)' : textFaint }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.75)' : textMuted }}>
                    <CheckIcon color={plan.highlight ? amber : '#4ade80'} />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaHref}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '11px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sora)',
                  textDecoration: 'none',
                  background: plan.highlight ? amber : 'transparent',
                  color: plan.highlight ? navy : textMuted,
                  border: plan.highlight ? 'none' : `1.5px solid ${border}`,
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            background: navy,
            borderRadius: 24,
            padding: '56px 40px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow */}
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, background: 'rgba(233,160,16,0.15)', filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />

          <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, fontFamily: 'var(--font-sora)', color: '#fff', marginBottom: 16, position: 'relative', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Pronto para conectar sua empresa?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 36, position: 'relative' }}>
            Configure sua rede em minutos. Grátis para até 10 membros.
          </p>
          <a
            href={`${APP_URL}/register`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-sora)', color: navy, background: amber, padding: '14px 32px', borderRadius: 12, textDecoration: 'none', position: 'relative' }}
          >
            Criar minha rede agora
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${border}`, background: surface, padding: '40px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <Logo />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href="#features" style={{ fontSize: 13, color: textFaint, textDecoration: 'none' }}>Funcionalidades</a>
            <a href="#pricing" style={{ fontSize: 13, color: textFaint, textDecoration: 'none' }}>Preços</a>
            <a href={`${APP_URL}/login`} style={{ fontSize: 13, color: textFaint, textDecoration: 'none' }}>Entrar</a>
            <a href="mailto:contato@orgbridge.net" style={{ fontSize: 13, color: textFaint, textDecoration: 'none' }}>Contato</a>
          </div>
          <p style={{ fontSize: 12, color: textFaint, margin: 0 }}>© {new Date().getFullYear()} OrgBridge. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
