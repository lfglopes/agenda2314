import { eq, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { from, to } = getQuery(event)
  const conditions = [eq(schema.events.status, 'approved')]
  if (from) conditions.push(gte(schema.events.start_at, from as string))
  if (to) conditions.push(lte(schema.events.start_at, to as string))
  return db.select().from(schema.events).where(and(...conditions)).orderBy(schema.events.start_at)
})
