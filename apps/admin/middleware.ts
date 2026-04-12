import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, ADMIN_COOKIE_NAME } from './lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}

function isIpAllowed(ip: string): boolean {
  const allowed = process.env.ADMIN_ALLOWED_IPS
  if (!allowed) return true // no restriction in dev
  return allowed.split(',').map((s) => s.trim()).includes(ip)
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // IP restriction in production
  if (process.env.NODE_ENV === 'production') {
    const ip = getClientIp(req)
    if (!isIpAllowed(ip)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Public paths: allow unauthenticated
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verify session token
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (!token || !verifyAdminToken(token)) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
