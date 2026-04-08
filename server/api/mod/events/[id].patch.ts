import { eq } from 'drizzle-orm'

const VALID_STATUSES = ['unconfirmed', 'pending', 'approved', 'rejected'] as const

export default defineEventHandler(async (event) => {
  await requireModAuth(event)
  const id = getRouterParam(event, 'id')
  const { status, moderator_notes, title, description, start_at, end_at, location } = await readBody(event)

  if (status && !VALID_STATUSES.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status value' })
  }

  const updates: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  }
  if (status !== undefined) updates.status = status
  if (moderator_notes !== undefined) updates.moderator_notes = moderator_notes
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (start_at !== undefined) updates.start_at = start_at
  if (end_at !== undefined) updates.end_at = end_at
  if (location !== undefined) updates.location = location

  const [updated] = await db
    .update(schema.events)
    .set(updates)
    .where(eq(schema.events.id, id!))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  return updated
})
