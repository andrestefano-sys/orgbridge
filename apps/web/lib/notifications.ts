import { db, notifications } from '@orgbridge/db'

export async function createNotification({
  userId,
  networkId,
  type,
  title,
  body,
  actorId,
  targetType,
  targetId,
}: {
  userId: string
  networkId: string
  type: string
  title: string
  body?: string
  actorId?: string
  targetType?: string
  targetId?: string
}) {
  // Don't notify yourself
  if (actorId && actorId === userId) return

  try {
    await db.insert(notifications).values({
      userId,
      networkId,
      type,
      title,
      body: body ?? null,
      actorId: actorId ?? null,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
    })
  } catch (err) {
    // Non-critical — don't throw
    console.error('[createNotification]', err)
  }
}
