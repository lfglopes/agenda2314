import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const events = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      description: schema.events.description,
      start_at: schema.events.start_at,
      end_at: schema.events.end_at,
      location: schema.events.location,
    })
    .from(schema.events)
    .where(eq(schema.events.status, 'approved'))
    .orderBy(schema.events.start_at)
  const ics = wrapCalendar(events.map(buildVEvent))
  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'inline; filename="agenda-2314.ics"')
  return ics
})
