import { kv } from '@nuxthub/kv'

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'mod_session')
  if (token) {
    await kv.del(`mod:session:${token}`)
  }
  deleteCookie(event, 'mod_session')
  return { ok: true }
})
