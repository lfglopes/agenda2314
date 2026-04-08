import { eq, and } from 'drizzle-orm'

const publicColumns = {
  id: schema.events.id,
  title: schema.events.title,
  description: schema.events.description,
  start_at: schema.events.start_at,
  end_at: schema.events.end_at,
  location: schema.events.location,
  submitter_name: schema.events.submitter_name,
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const [result] = await db
    .select(publicColumns)
    .from(schema.events)
    .where(and(eq(schema.events.id, id!), eq(schema.events.status, 'approved')))
    .limit(1)
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  return result
})
