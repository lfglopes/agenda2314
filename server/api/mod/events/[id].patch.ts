import { eq } from 'drizzle-orm'

const VALID_STATUSES = ['unconfirmed', 'pending', 'approved', 'rejected'] as const

export default defineEventHandler(async (event) => {
  await requireModAuth(event)
  const id = getRouterParam(event, 'id')
  const { status, moderator_notes } = await readBody(event)

  if (status && !VALID_STATUSES.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status value' })
  }

  const updates: Record<string, string> = {
    updated_at: new Date().toISOString(),
  }
  if (status !== undefined) updates.status = status
  if (moderator_notes !== undefined) updates.moderator_notes = moderator_notes

  const [updated] = await db
    .update(schema.events)
    .set(updates)
    .where(eq(schema.events.id, id!))
    .returning()

  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  return updated
})
