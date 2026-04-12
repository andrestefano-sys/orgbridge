/**
 * Seed script — creates the first super-admin user for the admin panel.
 *
 * Usage:
 *   pnpm --filter @orgbridge/db seed:admin
 *
 * Or with custom credentials via env:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpassword pnpm --filter @orgbridge/db seed:admin
 *
 * Requires DATABASE_URL in root .env
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../.env') })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import { hashSync } from 'bcryptjs'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

const email = (process.env.ADMIN_EMAIL ?? 'admin@orgbridge.net').toLowerCase().trim()
const password = process.env.ADMIN_PASSWORD ?? 'Admin@1234!'
const name = process.env.ADMIN_NAME ?? 'Super Admin'

async function main() {
  const existing = await db.query.adminUsers.findFirst({
    where: eq(schema.adminUsers.email, email),
  })

  if (existing) {
    console.log(`⚠️  Admin already exists: ${email}`)
    console.log('   Use the admin panel to change password if needed.')
    return
  }

  const passwordHash = hashSync(password, 12)

  const [user] = await db
    .insert(schema.adminUsers)
    .values({ email, passwordHash, name, role: 'owner' })
    .returning({ id: schema.adminUsers.id, email: schema.adminUsers.email })

  console.log('✅ Admin user created:')
  console.log(`   Email:    ${user.email}`)
  console.log(`   Password: ${password}`)
  console.log(`   ID:       ${user.id}`)
  console.log()
  console.log('⚠️  Change the default password after first login!')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
