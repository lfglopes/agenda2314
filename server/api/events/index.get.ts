import { eq, and, gte, lte } from 'drizzle-orm'

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
  const { from, to } = getQuery(event)
  const conditions = [eq(schema.events.status, 'approved')]
  if (from) conditions.push(gte(schema.events.start_at, from as string))
  if (to) conditions.push(lte(schema.events.start_at, to as string))
  return db.select(publicColumns).from(schema.events).where(and(...conditions)).orderBy(schema.events.start_at)
})
