import Link from 'next/link'

function OrgNetworkPanel() {
  return (
    <div
      className="relative hidden lg:flex lg:w-[440px] xl:w-[520px] flex-shrink-0 flex-col overflow-hidden"
      style={{ background: 'var(--ob-navy)' }}
    >
      {/* Ambient gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 30% 60%, rgba(233,160,16,0.10) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 75% 25%, rgba(30,51,82,0.8) 0%, transparent 60%)',
        }}
      />

      {/* Top logo */}
      <div className="relative z-10 p-8 xl:p-10">
        <Link href="/" aria-label="OrgBridge início">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: 'var(--ob-amber)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="8" cy="3" r="2.5" fill="#0D1929" />
                <circle cx="3" cy="12" r="2.5" fill="#0D1929" />
                <circle cx="13" cy="12" r="2.5" fill="#0D1929" />
                <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="#0D1929" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="#0D1929" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span
              className="text-xl font-semibold tracking-tight"
              style={{ color: 'var(--ob-surface)', fontFamily: 'var(--font-sora)' }}
            >
              OrgBridge
            </span>
          </div>
        </Link>
      </div>

      {/* Network SVG visualization */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <svg
          viewBox="0 0 380 360"
          className="w-full max-w-[360px]"
          aria-hidden
          style={{ overflow: 'visible' }}
        >
          {/* Connection lines — drawn with animation */}
          <line
            x1="190" y1="80" x2="90" y2="170"
            stroke="rgba(233,160,16,0.35)" strokeWidth="1.5" strokeLinecap="round"
            className="line-draw" style={{ animationDelay: '0.2s' }}
          />
          <line
            x1="190" y1="80" x2="290" y2="170"
            stroke="rgba(233,160,16,0.35)" strokeWidth="1.5" strokeLinecap="round"
            className="line-draw" style={{ animationDelay: '0.4s' }}
          />
          <line
            x1="90" y1="170" x2="50" y2="265"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"
            className="line-draw" style={{ animationDelay: '0.6s' }}
          />
          <line
            x1="90" y1="170" x2="150" y2="265"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"
            className="line-draw" style={{ animationDelay: '0.7s' }}
          />
          <line
            x1="290" y1="170" x2="230" y2="265"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"
            className="line-draw" style={{ animationDelay: '0.8s' }}
          />
          <line
            x1="290" y1="170" x2="330" y2="265"
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round"
            className="line-draw" style={{ animationDelay: '0.9s' }}
          />
          <line
            x1="150" y1="265" x2="230" y2="265"
            stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeLinecap="round"
            className="line-draw" style={{ animationDelay: '1.1s' }}
          />

          {/* Root node — CEO/Founder — amber glow */}
          <g className="node-a" style={{ transformOrigin: '190px 80px' }}>
            <circle cx="190" cy="80" r="28" fill="rgba(233,160,16,0.12)" />
            <circle cx="190" cy="80" r="20" fill="rgba(233,160,16,0.22)" />
            <circle cx="190" cy="80" r="14" fill="var(--ob-amber)" />
            {/* Person icon */}
            <circle cx="190" cy="76" r="4" fill="#0D1929" />
            <path d="M183 88 Q190 84 197 88" stroke="#0D1929" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>

          {/* Level 2 — left node */}
          <g className="node-b" style={{ transformOrigin: '90px 170px' }}>
            <circle cx="90" cy="170" r="20" fill="rgba(255,255,255,0.06)" />
            <circle cx="90" cy="170" r="14" fill="rgba(255,255,255,0.14)" />
            <circle cx="90" cy="170" r="8" fill="rgba(255,255,255,0.55)" />
            <circle cx="90" cy="167" r="2.5" fill="#0D1929" />
            <path d="M85.5 174.5 Q90 172 94.5 174.5" stroke="#0D1929" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>

          {/* Level 2 — right node */}
          <g className="node-c" style={{ transformOrigin: '290px 170px' }}>
            <circle cx="290" cy="170" r="20" fill="rgba(255,255,255,0.06)" />
            <circle cx="290" cy="170" r="14" fill="rgba(255,255,255,0.14)" />
            <circle cx="290" cy="170" r="8" fill="rgba(255,255,255,0.55)" />
            <circle cx="290" cy="167" r="2.5" fill="#0D1929" />
            <path d="M285.5 174.5 Q290 172 294.5 174.5" stroke="#0D1929" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>

          {/* Level 3 nodes */}
          {[
            { cx: 50, cy: 265, delay: '1.2s', cls: 'node-a' },
            { cx: 150, cy: 265, delay: '1.3s', cls: 'node-b' },
            { cx: 230, cy: 265, delay: '1.2s', cls: 'node-c' },
            { cx: 330, cy: 265, delay: '1.3s', cls: 'node-a' },
          ].map(({ cx, cy, delay, cls }, i) => (
            <g key={i} className={cls} style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: delay }}>
              <circle cx={cx} cy={cy} r="12" fill="rgba(255,255,255,0.08)" />
              <circle cx={cx} cy={cy} r="7" fill="rgba(255,255,255,0.20)" />
              <circle cx={cx} cy={cy - 1.5} r="2" fill="rgba(255,255,255,0.6)" />
              <path
                d={`M${cx - 3} ${cy + 4} Q${cx} ${cy + 2.5} ${cx + 3} ${cy + 4}`}
                stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none" strokeLinecap="round"
              />
            </g>
          ))}

          {/* Decorative sparkle dots */}
          <circle cx="340" cy="100" r="2" fill="rgba(233,160,16,0.4)" className="glow-pulse" />
          <circle cx="40" cy="130" r="1.5" fill="rgba(255,255,255,0.25)" className="glow-pulse" style={{ animationDelay: '1s' }} />
          <circle cx="355" cy="220" r="1.5" fill="rgba(233,160,16,0.3)" className="glow-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="20" cy="300" r="2" fill="rgba(255,255,255,0.15)" className="glow-pulse" style={{ animationDelay: '1.5s' }} />
        </svg>
      </div>

      {/* Bottom copy */}
      <div className="relative z-10 p-8 xl:p-10">
        <blockquote
          className="border-l-2 pl-4 text-sm leading-relaxed"
          style={{
            borderColor: 'var(--ob-amber)',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          Conecte equipes, cultive liderança e construa uma cultura organizacional que dura.
        </blockquote>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh">
      <OrgNetworkPanel />

      {/* Right — form panel */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10"
        style={{ background: 'var(--ob-surface-alt)' }}
      >
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'var(--ob-amber)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="3" r="2.5" fill="#0D1929" />
              <circle cx="3" cy="12" r="2.5" fill="#0D1929" />
              <circle cx="13" cy="12" r="2.5" fill="#0D1929" />
              <line x1="8" y1="5.5" x2="3" y2="9.5" stroke="#0D1929" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="5.5" x2="13" y2="9.5" stroke="#0D1929" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ color: 'var(--ob-text)', fontFamily: 'var(--font-sora)' }}
          >
            OrgBridge
          </span>
        </div>

        {/* Form card */}
        <div
          className="w-full max-w-md rounded-2xl p-8 sm:p-10 animate-fade-slide-up"
          style={{
            background: 'var(--ob-surface)',
            border: '1px solid var(--ob-border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
