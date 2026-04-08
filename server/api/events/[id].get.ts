import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const [result] = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.id, id!), eq(schema.events.status, 'approved')))
    .limit(1)
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  return result
})
