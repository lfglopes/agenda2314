import type { H3Event } from 'h3'

interface ModSession {
  id: string
  name: string
  email: string
}

export async function requireModAuth(event: H3Event): Promise<ModSession> {
  const token = getCookie(event, 'mod_session')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const session = await hubKV().get<ModSession>(`mod:session:${token}`)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session
}
