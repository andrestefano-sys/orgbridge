import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { networks } from './networks'
import { users } from './users'
import { createId } from '../utils'

// ─── Post Drafts ──────────────────────────────────────────────
// One active draft per user per network (upserted on save).
export const postDrafts = pgTable(
  'post_drafts',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    networkId: text('network_id')
      .notNull()
      .references(() => networks.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull().default(''),
    type: text('type').notNull().default('text'),
    orgNodeId: text('org_node_id'),
    recognizedUserId: text('recognized_user_id').references(() => users.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('post_drafts_network_author_unique').on(t.networkId, t.authorId),
  ],
)

// ─── Posts ────────────────────────────────────────────────────
export const posts = pgTable('posts', {
  id: text('id').primaryKey().$defaultFn(createId),
  networkId: text('network_id')
    .notNull()
    .references(() => networks.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  // 'text' | 'recognition' | 'announcement' | 'document'
  type: text('type').notNull().default('text'),
  // 'published' | 'draft' | 'removed'
  status: text('status').notNull().default('published'),
  // Visibility: 'network' | 'area' (org node) | 'leadership'
  visibility: text('visibility').notNull().default('network'),
  orgNodeId: text('org_node_id'), // if visibility = 'area'
  // For recognition posts: the person being recognized
  recognizedUserId: text('recognized_user_id').references(() => users.id),
  // Aggregated counters (denormalized for performance)
  reactionsCount: integer('reactions_count').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  // Pinned by admin/owner
  isPinned: boolean('is_pinned').notNull().default(false),
  pinnedAt: timestamp('pinned_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Comments ─────────────────────────────────────────────────
export const comments = pgTable('comments', {
  id: text('id').primaryKey().$defaultFn(createId),
  postId: text('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  // 'published' | 'removed'
  status: text('status').notNull().default('published'),
  reactionsCount: integer('reactions_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Reactions ────────────────────────────────────────────────
// emoji: 'like' | 'celebrate' | 'support' | 'insightful' | 'done' | 'urgent'
export const reactions = pgTable(
  'reactions',
  {
    id: text('id').primaryKey().$defaultFn(createId),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // target: post OR comment (only one is set)
    postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }),
    commentId: text('comment_id').references(() => comments.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull().default('like'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('reactions_user_post_unique').on(t.userId, t.postId),
    uniqueIndex('reactions_user_comment_unique').on(t.userId, t.commentId),
  ],
)
