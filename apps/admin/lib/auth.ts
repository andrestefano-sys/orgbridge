import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.ADMIN_JWT_SECRET ?? 'change-me-in-production'
const COOKIE_NAME = 'ob_admin_token'
const EXPIRES_IN = 60 * 60 * 8 // 8 hours

export interface AdminTokenPayload {
  id: string
  email: string
  name: string
  role: string
  iat: number
  exp: number
}

// ── Simple HS256-like token using HMAC ────────────────────────
function sign(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function verify(token: string): AdminTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, sig] = parts as [string, string, string]
  const expected = createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AdminTokenPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

// ── Public helpers ────────────────────────────────────────────
export function createAdminToken(user: { id: string; email: string; name: string; role: string }): string {
  const now = Math.floor(Date.now() / 1000)
  return sign({ ...user, iat: now, exp: now + EXPIRES_IN })
}

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return verify(token)
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  return verify(token)
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME
export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: EXPIRES_IN,
}
