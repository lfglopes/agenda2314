import { eq, and } from 'drizzle-orm'

const publicColumns = {
  id: schema.events.id,
  title: schema.events.title,
  description: schema.events.description,
  start_at: schema.events.start_at,
  end_at: schema.events.end_at,
  location: schema.events.location,
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const [result] = await db
    .select(publicColumns)
    .from(schema.events)
    .where(and(eq(schema.events.id, id!), eq(schema.events.status, 'approved')))
    .limit(1)
  if (!result) throw createError({ statusCode: 404 })
  const ics = wrapCalendar([buildVEvent(result)])
  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${result.id}.ics"`)
  return ics
})
