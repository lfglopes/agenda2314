export function toIcsDate(iso: string): string {
  return iso.replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildVEvent(e: { id: string; title: string; start_at: string; end_at: string; location?: string | null; description?: string | null }): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${e.id}@2314`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(e.start_at)}`,
    `DTEND:${toIcsDate(e.end_at)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
  ]
  if (e.location)    lines.push(`LOCATION:${escapeIcs(e.location)}`)
  if (e.description) lines.push(`DESCRIPTION:${escapeIcs(e.description)}`)
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

export function wrapCalendar(vevents: string[], calName = 'Agenda Cultural 2314'): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//2314 Agenda Cultural//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n')
}
