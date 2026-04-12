import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '../utils'

export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey().$defaultFn(createId),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('support'), // 'owner' | 'support' | 'developer' | 'finance'
  twoFaSecret: text('two_fa_secret'),
  twoFaEnabled: boolean('two_fa_enabled').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(createId),
  actorId: text('actor_id').notNull(),
  actorType: text('actor_type').notNull(), // 'admin' | 'user'
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  metadata: text('metadata'), // JSON string
  ip: text('ip'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
