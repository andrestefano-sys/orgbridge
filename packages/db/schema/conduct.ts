import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { networks } from './networks'
import { users } from './users'
import { createId } from '../utils'

// Políticas de uso (Code of Conduct) por rede
export const conductPolicies = pgTable('conduct_policies', {
  id: text('id').primaryKey().$defaultFn(createId),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' })
    .unique(),
  title: text('title').notNull().default('Diretrizes de Uso da Rede'),
  content: text('content').notNull(), // Markdown
  version: text('version').notNull().default('1.0'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Registro de aceite do Code of Conduct por usuário
export const conductAcceptances = pgTable(
  'conduct_acceptances',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    policyId: text('policy_id')
      .notNull()
      .references(() => conductPolicies.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    networkId: text('network_id')
      .notNull()
      .references(() => networks.id, { onDelete: 'cascade' }),
    policyVersion: text('policy_version').notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
    ip: text('ip'),
  },
  (t) => [
    uniqueIndex('conduct_acceptance_unique').on(t.policyId, t.userId),
  ],
)

// Denúncias de conteúdo impróprio
export const contentReports = pgTable('content_reports', {
  id: text('id').primaryKey().$defaultFn(createId),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' }),
  reporterId: text('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(), // 'post' | 'comment' | 'message' | 'user'
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(), // 'harassment' | 'spam' | 'inappropriate' | 'misinformation' | 'other'
  description: text('description'),
  status: text('status').notNull().default('pending'), // 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Métricas de engajamento da liderança por rede/área
export const leadershipEngagement = pgTable('leadership_engagement', {
  id: text('id').primaryKey().$defaultFn(createId),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  postsCount: integer('posts_count').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  reactionsCount: integer('reactions_count').notNull().default(0),
  recognitionsGiven: integer('recognitions_given').notNull().default(0),
  leadershipScore: integer('leadership_score').notNull().default(0), // 0–100
  alertSent: boolean('alert_sent').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
