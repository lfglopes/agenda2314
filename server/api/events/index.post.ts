export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, description, start_at, end_at, location, submitter_email, submitter_name, url } = body

  // Honeypot: bots fill this hidden field
  if (url) {
    throw createError({ statusCode: 400, statusMessage: 'Bad request' })
  }

  if (!title || !start_at || !end_at || !submitter_email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  if (new Date(end_at) <= new Date(start_at)) {
    throw createError({ statusCode: 400, statusMessage: 'End date must be after start date' })
  }

  const config = useRuntimeConfig()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const confirmation_token = crypto.randomUUID()
  const token_expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  await db.insert(schema.events).values({
    id,
    title,
    description: description || null,
    start_at: new Date(start_at).toISOString(),
    end_at: new Date(end_at).toISOString(),
    location: location || null,
    submitter_email,
    submitter_name: submitter_name || null,
    status: 'unconfirmed',
    confirmation_token,
    token_expires_at,
    created_at: now,
    updated_at: now,
  })

  if (config.resendApiKey) {
    const confirmUrl = `${config.siteUrl}/confirm/${confirmation_token}`
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        from: 'Agenda 2314 <noreply@2314.pt>',
        to: submitter_email,
        subject: 'Confirma o teu evento — Agenda 2314',
        html: `<p>Olá${submitter_name ? ` ${submitter_name}` : ''}!</p>
<p>Obrigado por submeteres o evento <strong>${title}</strong>.</p>
<p>Para confirmar o evento, clica no link abaixo (válido por 48 horas):</p>
<p><a href="${confirmUrl}">${confirmUrl}</a></p>
<p>Se não submeteste este evento, podes ignorar este email.</p>`,
      },
    }).catch(() => {
      // Don't fail the request if email sending fails
    })
  }

  return { ok: true }
})
