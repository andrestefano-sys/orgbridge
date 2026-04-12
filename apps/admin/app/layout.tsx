import type { Metadata } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap', weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'OrgBridge Admin',
  description: 'Painel administrativo OrgBridge',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={sora.variable} style={{ fontFamily: 'var(--font-sora), system-ui, sans-serif', background: '#0f172a', color: '#e2e8f0', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
