import type { Metadata } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'OrgBridge — Rede Social Corporativa com IA',
  description:
    'A plataforma privada que une comunicação interna, organograma interativo e IA integrada em uma única rede corporativa.',
  openGraph: {
    title: 'OrgBridge — Rede Social Corporativa com IA',
    description:
      'A plataforma privada que une comunicação interna, organograma interativo e IA integrada em uma única rede corporativa.',
    url: 'https://orgbridge.net',
    siteName: 'OrgBridge',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${dmSans.variable}`} style={{ fontFamily: 'var(--font-dm), system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
