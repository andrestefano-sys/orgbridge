import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : []

// Configuração Edge-safe: sem bcryptjs, sem db, sem Node.js APIs
// Usada pelo middleware e compartilhada com o auth completo
export const authConfig: NextAuthConfig = {
  providers: googleProvider,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify',
        '/auth/',
        '/invite',
        '/api/auth',
        '/api/invite',
        '/api/webhooks',
      ].some((p) => nextUrl.pathname.startsWith(p))

      // Landing page (root) is always public
      if (nextUrl.pathname === '/') return true
      if (isPublic) return true
      return isLoggedIn
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
}
