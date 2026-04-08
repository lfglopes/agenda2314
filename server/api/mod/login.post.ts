import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { kv } from '@nuxthub/kv'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  const [moderator] = await db
    .select()
    .from(schema.moderators)
    .where(eq(schema.moderators.email, email))
    .limit(1)

  if (!moderator || !(await bcrypt.compare(password, moderator.password_hash))) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = crypto.randomUUID()
  await kv.set(
    `mod:session:${token}`,
    { id: moderator.id, name: moderator.name, email: moderator.email },
    { ttl: 60 * 60 * 24 * 7 },
  )

  setCookie(event, 'mod_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { name: moderator.name }
})
