import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login']
const COOKIE_NAME = 'ob_admin_token'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}

function isIpAllowed(ip: string): boolean {
  const allowed = process.env.ADMIN_ALLOWED_IPS
  if (!allowed) return true
  return allowed.split(',').map((s) => s.trim()).includes(ip)
}

// Web Crypto HMAC-SHA256 verify (Edge Runtime compatible)
async function verifyToken(token: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const [header, body, sig] = parts as [string, string, string]

    const secret = process.env.ADMIN_JWT_SECRET ?? 'change-me-in-production'
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )

    // Convert base64url sig to ArrayBuffer
    const b64 = sig.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4)
    const sigBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(`${header}.${body}`),
    )
    if (!valid) return false

    // Check expiry
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
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
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token || !(await verifyToken(token))) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
