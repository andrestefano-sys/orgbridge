import { integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'
import { createId } from '../utils'

export const networks = pgTable('networks', {
  id: text('id').primaryKey().$defaultFn(createId),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  industry: text('industry'),
  country: text('country'),
  state: text('state'),
  city: text('city'),
  description: text('description'),
  type: text('type').notNull().default('vertical'), // 'vertical' | 'horizontal'
  status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'trial'
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const networkMembers = pgTable(
  'network_members',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    networkId: text('network_id')
      .notNull()
      .references(() => networks.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'owner' | 'admin' | 'manager' | 'member'
    status: text('status').notNull().default('active'), // 'active' | 'invited' | 'suspended'
    orgNodeId: text('org_node_id'),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('network_members_network_user_unique').on(t.networkId, t.userId),
  ],
)

export const orgNodes = pgTable('org_nodes', {
  id: text('id').primaryKey().$defaultFn(createId),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'), // self-reference — added as FK in migration
  name: text('name').notNull(),
  level: integer('level').notNull().default(0),
  color: text('color'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey().$defaultFn(createId),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  orgNodeId: text('org_node_id'),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
