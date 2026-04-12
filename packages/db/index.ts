import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'
import * as relations from './relations'

type DbInstance = ReturnType<typeof drizzle<typeof schema & typeof relations>>

let _db: DbInstance | null = null

function getDb(): DbInstance {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    const sql = neon(url)
    _db = drizzle(sql, { schema: { ...schema, ...relations } }) as DbInstance
  }
  return _db
}

export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_, prop) {
    return (getDb() as any)[prop]
  },
})

export * from './schema'
export * from './relations'
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
