type Locale = 'pt' | 'de'

function getRequestLocale(event: any): Locale {
  const localeCookie = getCookie(event, 'i18n_redirected')
  if (localeCookie === 'de') {
    return 'de'
  }

  const acceptLanguage = getHeader(event, 'accept-language')?.toLowerCase() || ''
  if (acceptLanguage.includes('de')) {
    return 'de'
  }

  return 'pt'
}

const copy = {
  pt: {
    badRequest: 'Pedido inválido',
    missingRequiredFields: 'Faltam campos obrigatórios',
    endAfterStart: 'A data de fim tem de ser posterior à data de início',
    subject: 'Confirma o teu evento — Agenda 2314',
    greeting: (submitterName?: string | null) => `Olá${submitterName ? ` ${submitterName}` : ''}!`,
    thanks: (title: string) => `Obrigado por submeteres o evento <strong>${title}</strong>.`,
    confirm: 'Para confirmar o evento, clica no link abaixo (válido por 48 horas):',
    ignore: 'Se não submeteste este evento, podes ignorar este email.',
  },
  de: {
    badRequest: 'Ungültige Anfrage',
    missingRequiredFields: 'Pflichtfelder fehlen',
    endAfterStart: 'Das Enddatum muss nach dem Startdatum liegen',
    subject: 'Bestätige deine Veranstaltung — Agenda 2314',
    greeting: (submitterName?: string | null) => `Hallo${submitterName ? ` ${submitterName}` : ''}!`,
    thanks: (title: string) => `Danke für das Einreichen der Veranstaltung <strong>${title}</strong>.`,
    confirm: 'Um die Veranstaltung zu bestätigen, klicke auf den folgenden Link (48 Stunden gültig):',
    ignore: 'Falls du diese Veranstaltung nicht eingereicht hast, kannst du diese E-Mail ignorieren.',
  },
} as const

export default defineEventHandler(async (event) => {
  const locale = getRequestLocale(event)
  const t = copy[locale]

  const body = await readBody(event)
  const { title, description, start_at, end_at, location, submitter_email, submitter_name, url } = body

  // Honeypot: bots fill this hidden field
  if (url) {
    throw createError({ statusCode: 400, statusMessage: t.badRequest })
  }

  const modSession = await requireModAuth(event).catch(() => null)
  const isMod = modSession !== null

  if (!title || !start_at || !end_at || (!isMod && !submitter_email)) {
    throw createError({ statusCode: 400, statusMessage: t.missingRequiredFields })
  }

  if (new Date(end_at) <= new Date(start_at)) {
    throw createError({ statusCode: 400, statusMessage: t.endAfterStart })
  }

  const config = useRuntimeConfig()
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const confirmation_token = isMod ? null : crypto.randomUUID()
  const token_expires_at = isMod ? null : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  await db.transaction(async (tx: typeof db) => {
    await tx.insert(schema.events).values({
      id,
      title,
      description: description || null,
      start_at: new Date(start_at).toISOString(),
      end_at: new Date(end_at).toISOString(),
      location: location || null,
      submitter_email: isMod ? modSession!.email : submitter_email,
      submitter_name: submitter_name || null,
      status: isMod ? 'approved' : 'unconfirmed',
      confirmation_token,
      token_expires_at,
      created_at: now,
      updated_at: now,
    })

    if (!isMod && config.resendApiKey) {
      const confirmUrl = `${config.siteUrl}/confirm/${confirmation_token}`
      await $fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          from: 'Agenda 2314 <agenda2314@gendrix.com>',
          to: submitter_email,
          subject: t.subject,
          html: `<p>${t.greeting(submitter_name)}</p>
<p>${t.thanks(title)}</p>
<p>${t.confirm}</p>
<p><a href="${confirmUrl}">${confirmUrl}</a></p>
<p>${t.ignore}</p>`,
        },
      })
    }
  })

  return { ok: true, autoApproved: isMod }
})
