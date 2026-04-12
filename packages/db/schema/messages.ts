import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { networks } from './networks'
import { users } from './users'
import { createId } from '../utils'

// A conversation is a DM thread between exactly two members of the same network.
// participantAId < participantBId (sorted) to guarantee uniqueness.
export const conversations = pgTable(
  'conversations',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    networkId: text('network_id')
      .notNull()
      .references(() => networks.id, { onDelete: 'cascade' }),
    participantAId: text('participant_a_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    participantBId: text('participant_b_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Denormalized for inbox preview
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    lastMessagePreview: text('last_message_preview'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('conversations_network_participants_unique').on(
      t.networkId,
      t.participantAId,
      t.participantBId,
    ),
  ],
)

export const directMessages = pgTable('direct_messages', {
  id: text('id').primaryKey().$defaultFn(createId),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  // null = unread by recipient
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
