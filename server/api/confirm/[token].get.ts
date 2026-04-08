import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const config = useRuntimeConfig()

  const [row] = await db
    .select()
    .from(schema.events)
    .where(and(eq(schema.events.confirmation_token, token!), eq(schema.events.status, 'unconfirmed')))

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Token not found or already used' })
  }

  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'Token expired' })
  }

  const newStatus = config.requireModeration === 'true' ? 'pending' : 'approved'

  await db
    .update(schema.events)
    .set({
      status: newStatus,
      confirmation_token: null,
      token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.events.id, row.id))

  return { ok: true, eventId: row.id }
})
