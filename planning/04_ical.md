# Drop Detail Page + Calendar Subscription & Add-to-Calendar

## Context
The event detail page is redundant now that the list view shows all event info inline and the modal provides quick access from the calendar. The next step is to add calendar integration: a subscribable ICS feed for the full agenda, and per-event "Add to calendar" actions covering the major calendar apps. No new npm dependencies — ICS format is simple enough to build manually.

---

## Change 1 — Delete detail page

- **Delete** `app/pages/event/[id].vue`
- **Modify** `app/components/EventModal.vue`: remove the `<NuxtLink … event.viewDetails>` line at the bottom (it linked to the now-deleted page)
- The `event.viewDetails` i18n key can stay (harmless) or be cleaned up — clean it up for tidiness

---

## Change 2 — ICS server infrastructure

### `server/utils/ics.ts` *(new)*
Shared helpers used by both feed and single-event endpoints:

```ts
export function toIcsDate(iso: string): string {
  // "2026-04-15T20:00:00.000Z" → "20260415T200000Z"
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
```

### `server/api/calendar.ics.get.ts` *(new)*
Full feed of all approved events:

```ts
import { eq } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const events = await db.select({ id, title, description, start_at, end_at, location })
    .from(schema.events).where(eq(schema.events.status, 'approved'))
    .orderBy(schema.events.start_at)
  const ics = wrapCalendar(events.map(buildVEvent))
  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'inline; filename="agenda-2314.ics"')
  return ics
})
```

### `server/api/events/[id]/ical.get.ts` *(new)*
Single-event ICS download (route: `/api/events/:id/ical`):

```ts
import { eq, and } from 'drizzle-orm'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const [result] = await db.select(…publicColumns…).from(schema.events)
    .where(and(eq(schema.events.id, id!), eq(schema.events.status, 'approved'))).limit(1)
  if (!result) throw createError({ statusCode: 404 })
  const ics = wrapCalendar([buildVEvent(result)])
  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${result.id}.ics"`)
  return ics
})
```

---

## Change 3 — `AddToCalendar.vue` component *(new)*

Reusable dropdown used in the modal and list view. Props: the event object.

Options shown (UDropdown or UPopover with a list):
1. **Google Calendar** — opens `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=…/…&details=…&location=…` in new tab (no server round-trip needed, all data is URL-encoded)
2. **Apple Calendar / iCal** — downloads `/api/events/:id/ical` (`.ics` file; macOS/iOS open it in Calendar automatically)
3. **Outlook** — downloads same `.ics` file (Outlook handles it natively)
4. **Other (.ics)** — same `.ics` download, labeled generically

Google Calendar date format: `YYYYMMDDTHHMMSSZ` (same as ICS).

Helper to build the Google URL:
```ts
function googleUrl(e) {
  const fmt = (iso) => iso.replace(/[-:]/g, '').split('.')[0] + 'Z'
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${fmt(e.start_at)}/${fmt(e.end_at)}`,
    ...(e.details && { details: e.description }),
    ...(e.location && { location: e.location }),
  })
  return `https://calendar.google.com/calendar/render?${p}`
}
```

Trigger: a small `UButton` with `icon="i-lucide-calendar-plus"` and label `$t('event.addToCalendar')`.

---

## Change 4 — `SubscribeCalendar.vue` component *(new)*

Dropdown for subscribing to the full feed. Uses `useRequestURL()` to build absolute URLs:

```ts
const reqUrl = useRequestURL()
const feedUrl = computed(() => `${reqUrl.origin}/api/calendar.ics`)
const webcalUrl = computed(() => feedUrl.value.replace(/^https?/, 'webcal'))
```

Options:
1. **Google Calendar** — `https://calendar.google.com/calendar/r?cid=${webcalUrl}`
2. **Apple Calendar / webcal** — `webcalUrl` (clicking opens Calendar app via `webcal://` protocol)
3. **Outlook** — `https://outlook.live.com/calendar/0/addfromweb?url=${feedUrl}`
4. **Copy link** — copies `feedUrl` to clipboard; label toggles to "Copied!" for 2s

Trigger: `UButton` with `icon="i-lucide-rss"` and label `$t('calendar.subscribe')`.

---

## Change 5 — Wire up in UI

### `app/components/EventModal.vue`
- Remove `<NuxtLink … viewDetails>` footer
- Add `<AddToCalendar :event="event" />` in its place

### `app/pages/list.vue`
- Add `<SubscribeCalendar />` as a right-aligned button in a small header bar above the event groups
- Add `<AddToCalendar :event="event" />` at the bottom of each event row (right side)

---

## Change 6 — i18n

Add to both `i18n/locales/pt.json` and `de.json`:

```json
// pt
"event": {
  "addToGoogle": "Google Calendar",
  "addToApple": "Apple Calendar",
  "addToOutlook": "Outlook",
  "downloadIcs": "Ficheiro .ics"
},
"calendar": {
  "subscribeGoogle": "Google Calendar",
  "subscribeApple": "Apple Calendar / webcal",
  "subscribeOutlook": "Outlook",
  "copyLink": "Copiar link",
  "linkCopied": "Link copiado!"
}

// de
"event": {
  "addToGoogle": "Google Kalender",
  "addToApple": "Apple Kalender",
  "addToOutlook": "Outlook",
  "downloadIcs": ".ics-Datei"
},
"calendar": {
  "subscribeGoogle": "Google Kalender",
  "subscribeApple": "Apple Kalender / webcal",
  "subscribeOutlook": "Outlook",
  "copyLink": "Link kopieren",
  "linkCopied": "Link kopiert!"
}
```

---

## Files Summary

| File | Action |
|------|--------|
| `app/pages/event/[id].vue` | **Delete** |
| `app/components/EventModal.vue` | Remove viewDetails link, add `<AddToCalendar>` |
| `app/components/AddToCalendar.vue` | **Create** — per-event calendar dropdown |
| `app/components/SubscribeCalendar.vue` | **Create** — full feed subscribe dropdown |
| `app/pages/list.vue` | Add subscribe header + per-row `<AddToCalendar>` |
| `server/utils/ics.ts` | **Create** — ICS generation helpers |
| `server/api/calendar.ics.get.ts` | **Create** — full ICS feed |
| `server/api/events/[id]/ical.get.ts` | **Create** — single-event ICS |
| `i18n/locales/pt.json` | Add calendar app keys |
| `i18n/locales/de.json` | Add calendar app keys |

---

## Verification

1. `GET /api/calendar.ics` returns a valid `text/calendar` response with all approved events
2. `GET /api/events/:id/ical` returns a `.ics` file for a single event; 404 for unknown id
3. Clicking "Add to calendar" on an event in the modal shows a dropdown with 4 options; Google Calendar link opens with pre-filled fields; `.ics` download works
4. "Subscribe" button in the list view shows webcal/Google/Outlook/copy options; copy button writes to clipboard
5. `/event/:id` is gone — no 404 page, links to it removed
6. List and calendar pages unaffected otherwise
