import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { networks } from './networks'
import { createId } from '../utils'

// Notification types:
// 'new_member'       — someone joined the network
// 'new_reaction'     — someone reacted to your post
// 'new_comment'      — someone commented on your post
// 'recognition'      — you were recognized in a post
// 'invite_accepted'  — someone accepted your invitation
// 'announcement'     — new announcement post (for all members)
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  targetType: text('target_type'), // 'post' | 'comment' | 'member'
  targetId: text('target_id'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
