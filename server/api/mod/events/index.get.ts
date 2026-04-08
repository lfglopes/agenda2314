import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireModAuth(event)
  const { status } = getQuery(event)

  if (status) {
    return db
      .select()
      .from(schema.events)
      .where(eq(schema.events.status, status as string))
      .orderBy(desc(schema.events.created_at))
  }

  return db.select().from(schema.events).orderBy(desc(schema.events.created_at))
})
