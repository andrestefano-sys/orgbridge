import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { networks } from './networks'
import { createId } from '../utils'

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(createId),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' })
    .unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  plan: text('plan').notNull().default('free'), // 'free' | 'starter' | 'business' | 'enterprise'
  status: text('status').notNull().default('active'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
