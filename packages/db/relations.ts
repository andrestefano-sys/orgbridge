import { relations } from 'drizzle-orm'
import { users, accounts, sessions, verificationTokens } from './schema/users'
import { networks, networkMembers, orgNodes, invitations } from './schema/networks'
import { conductPolicies, conductAcceptances, contentReports, leadershipEngagement } from './schema/conduct'
import { posts, comments, reactions, postDrafts } from './schema/feed'
import { notifications } from './schema/notifications'
import { conversations, directMessages } from './schema/messages'

// ─── Users ───────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  verificationTokens: many(verificationTokens),
  networkMemberships: many(networkMembers),
  ownedNetworks: many(networks, { relationName: 'owner' }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({
  user: one(users, { fields: [verificationTokens.userId], references: [users.id] }),
}))

// ─── Networks ─────────────────────────────────────────────────
export const networksRelations = relations(networks, ({ one, many }) => ({
  owner: one(users, { fields: [networks.ownerId], references: [users.id], relationName: 'owner' }),
  members: many(networkMembers),
  orgNodes: many(orgNodes),
  invitations: many(invitations),
  conductPolicy: many(conductPolicies),
}))

export const networkMembersRelations = relations(networkMembers, ({ one }) => ({
  network: one(networks, { fields: [networkMembers.networkId], references: [networks.id] }),
  user: one(users, { fields: [networkMembers.userId], references: [users.id] }),
  orgNode: one(orgNodes, { fields: [networkMembers.orgNodeId], references: [orgNodes.id] }),
}))

export const orgNodesRelations = relations(orgNodes, ({ one, many }) => ({
  network: one(networks, { fields: [orgNodes.networkId], references: [networks.id] }),
  parent: one(orgNodes, { fields: [orgNodes.parentId], references: [orgNodes.id], relationName: 'parent' }),
  children: many(orgNodes, { relationName: 'parent' }),
  members: many(networkMembers),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  network: one(networks, { fields: [invitations.networkId], references: [networks.id] }),
}))

// ─── Conduct ──────────────────────────────────────────────────
export const conductPoliciesRelations = relations(conductPolicies, ({ one, many }) => ({
  network: one(networks, { fields: [conductPolicies.networkId], references: [networks.id] }),
  acceptances: many(conductAcceptances),
}))

export const conductAcceptancesRelations = relations(conductAcceptances, ({ one }) => ({
  policy: one(conductPolicies, { fields: [conductAcceptances.policyId], references: [conductPolicies.id] }),
  user: one(users, { fields: [conductAcceptances.userId], references: [users.id] }),
  network: one(networks, { fields: [conductAcceptances.networkId], references: [networks.id] }),
}))

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  network: one(networks, { fields: [contentReports.networkId], references: [networks.id] }),
  reporter: one(users, { fields: [contentReports.reporterId], references: [users.id] }),
  reviewer: one(users, { fields: [contentReports.reviewedBy], references: [users.id] }),
}))

export const leadershipEngagementRelations = relations(leadershipEngagement, ({ one }) => ({
  network: one(networks, { fields: [leadershipEngagement.networkId], references: [networks.id] }),
  user: one(users, { fields: [leadershipEngagement.userId], references: [users.id] }),
}))

// ─── Feed ─────────────────────────────────────────────────────
export const postsRelations = relations(posts, ({ one, many }) => ({
  network: one(networks, { fields: [posts.networkId], references: [networks.id] }),
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  recognizedUser: one(users, { fields: [posts.recognizedUserId], references: [users.id], relationName: 'recognized' }),
  comments: many(comments),
  reactions: many(reactions),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  reactions: many(reactions),
}))

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
  post: one(posts, { fields: [reactions.postId], references: [posts.id] }),
  comment: one(comments, { fields: [reactions.commentId], references: [comments.id] }),
}))

export const postDraftsRelations = relations(postDrafts, ({ one }) => ({
  network: one(networks, { fields: [postDrafts.networkId], references: [networks.id] }),
  author: one(users, { fields: [postDrafts.authorId], references: [users.id] }),
}))

// ─── Notifications ────────────────────────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  network: one(networks, { fields: [notifications.networkId], references: [networks.id] }),
  actor: one(users, { fields: [notifications.actorId], references: [users.id], relationName: 'actor' }),
}))

// ─── Messages ─────────────────────────────────────────────────
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  network: one(networks, { fields: [conversations.networkId], references: [networks.id] }),
  participantA: one(users, { fields: [conversations.participantAId], references: [users.id], relationName: 'participantA' }),
  participantB: one(users, { fields: [conversations.participantBId], references: [users.id], relationName: 'participantB' }),
  messages: many(directMessages),
}))

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  conversation: one(conversations, { fields: [directMessages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [directMessages.senderId], references: [users.id] }),
}))
