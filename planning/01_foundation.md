# Community Calendar — Public Calendar Implementation Plan

## Context
Build the public-facing calendar for the 2314 community calendar app. The Nuxt 4 project already exists with `@nuxt/ui`, `@nuxthub/core`, and `@nuxtjs/i18n` installed. This plan covers Foundation + public calendar views only. Categories are out of scope. Cloudflare/deployment setup is deferred.

---

## Step 1 — Update `nuxt.config.ts`

Modify `/home/luis/src/agenda/nuxt.config.ts`:
- Add `hub: { db: 'sqlite' }` (enables NuxtHub D1 with Drizzle, local SQLite in dev)
- Add `css: ['~/assets/css/main.css']`
- Add `i18n` block: locales PT (default) + DE, `strategy: 'no_prefix'`, `langDir: 'locales'`, browser locale detection via cookie (single URL set — no `/de/` prefix)
- Add `runtimeConfig` keys: `siteUrl: 'http://localhost:3000'`

---

## Step 3 — Theme: `app.config.ts` + `app/assets/css/main.css`

**`app.config.ts`** (new file at project root):
```ts
export default defineAppConfig({
  ui: { colors: { primary: 'red', neutral: 'stone' } }
})
```

**`app/assets/css/main.css`** (new):
```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --color-red-500: #C0392B;
  --color-red-400: #E74C3C;
  --color-red-600: #A93226;
  --color-stone-950: #1A1A1A;
}
```

---

## Step 4 — DB Schema + Migration

**`server/db/schema.ts`** (new):

```ts
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  start_at: text('start_at').notNull(),
  end_at: text('end_at').notNull(),
  location: text('location'),
  image_key: text('image_key'),
  submitter_email: text('submitter_email').notNull(),
  submitter_name: text('submitter_name'),
  status: text('status', {
    enum: ['unconfirmed', 'pending', 'approved', 'rejected'],
  }).notNull().default('unconfirmed'),
  confirmation_token: text('confirmation_token'),
  token_expires_at: text('token_expires_at'),
  moderator_notes: text('moderator_notes'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
})

export const moderators = sqliteTable('moderators', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  created_at: text('created_at').notNull(),
})
```

Run `npx nuxt db generate` to produce `server/db/migrations/sqlite/0001_initial.sql` (auto-generated, do not hand-write). Note: `@nuxthub/core` bundles Drizzle ORM and Drizzle Kit — no separate install needed.

**`server/db/queries/seed.sql`** (new) — dev seed with a few approved test events:
```sql
INSERT OR IGNORE INTO events (id, title, description, start_at, end_at, location, status, submitter_email, created_at, updated_at)
VALUES
  ('evt-001', 'Fado Night', 'Uma noite de fado português.', '2026-04-15T20:00:00.000Z', '2026-04-15T23:00:00.000Z', 'Zur Wilden Renate, Berlin', 'approved', 'test@example.com', '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('evt-002', 'Cinema Português', 'Sessão de cinema com filmes portugueses.', '2026-04-22T19:00:00.000Z', '2026-04-22T22:00:00.000Z', 'Babylon Kino, Berlin', 'approved', 'test@example.com', '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z');
```

---

## Step 5 — i18n Locale Files

**`app/locales/pt.json`** (new) — Portuguese (default):
Keys: `nav.calendar`, `nav.list`, `nav.submit`, `calendar.title`, `calendar.noEvents`, `calendar.subscribe`, `event.location`, `event.starts`, `event.ends`, `event.addToCalendar`, `errors.notFound`

**`app/locales/de.json`** (new) — German mirror of all PT keys.

---

## Step 6 — App Shell

**`app/app.vue`** — replace `<NuxtWelcome />` with:
```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**`app/layouts/default.vue`** (new):
- `UApp` wrapping everything (required for toasts/overlays)
- Top nav with logo ("2314"), links: Calendário / Lista / Enviar evento
- `LangSwitcher` component (PT | DE)
- `<slot />` for page content
- Simple footer

**`app/components/AppNav.vue`** (new) — nav bar extracted from layout.

**`app/components/LangSwitcher.vue`** (new):
```ts
const { locale, locales, setLocale } = useI18n()
```
Renders two `UButton` links switching between PT and DE.

---

## Step 7 — Events Read API

**`server/api/events/index.get.ts`** (new):
- Query params: `from`, `to` (ISO date strings)
- Uses auto-imported `db` and `schema` from NuxtHub
- Returns approved events ordered by `start_at`

```ts
import { eq, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { from, to } = getQuery(event)
  const conditions = [eq(schema.events.status, 'approved')]
  if (from) conditions.push(gte(schema.events.start_at, from as string))
  if (to) conditions.push(lte(schema.events.start_at, to as string))
  return db.select().from(schema.events).where(and(...conditions)).orderBy(schema.events.start_at)
})
```

**`server/api/events/[id].get.ts`** (new):
- Returns single approved event or 404

---

## Step 8 — Shared Composables + Types

**`app/composables/useEvents.ts`** (new):
```ts
export function useEvents(params?: Ref<{ from?: string; to?: string }>) {
  return useFetch('/api/events', { query: params, watch: params ? [params] : undefined })
}
```

**`app/composables/useFormatDate.ts`** (new):
- Locale-aware date formatting via `Intl.DateTimeFormat` using `useI18n().locale`
- Exports `formatDate(iso: string)` and `formatDateRange(start: string, end: string)`

---

## Step 9 — Public Pages

Routes use English names (no locale prefixes with `no_prefix` strategy):
- `/` — calendar
- `/list` — list view
- `/event/:id` — event detail

### `app/pages/index.vue` — Calendar month view (home)

Uses `UCalendar` with the `#day` slot to render a dot on days with events.

```vue
<UCalendar v-model="selectedDate" @update:placeholder="onMonthChange">
  <template #day="{ day }">
    <span class="relative">
      {{ day.day }}
      <span v-if="hasDayEvents(day)"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-500" />
    </span>
  </template>
</UCalendar>
```

Below the calendar: a day-panel slot showing `EventCard` components for the selected date.

State:
- `selectedDate` — the clicked date (today by default)
- `currentMonthRange` — `{ from, to }` computed from `UCalendar`'s `@update:placeholder`
- `{ data: events }` — from `useEvents(currentMonthRange)`
- `dayEvents` — computed: events filtered to `selectedDate`

### `app/pages/list.vue` — Chronological list view

Fetches events from today onwards, groups them by month heading, renders each as `EventCard`.

### `app/pages/event/[id].vue` — Event detail (SSR)

```ts
const { data: event } = await useFetch(`/api/events/${route.params.id}`)
if (!event.value) throw createError({ statusCode: 404 })

useSeoMeta({
  title: event.value.title,
  ogTitle: event.value.title,
  description: event.value.description?.slice(0, 160),
})
```

Renders: title, formatted date/time range, location, description, organiser name. Subscribe link pointing to `/api/calendar.ics` (placeholder for now).

### `app/components/EventCard.vue` (new)

Reusable `UCard` for list and day-panel views:
- Title as `NuxtLink` to `/event/:id`
- Formatted date/time
- Location (if present)

---

## Step 10 — Error Page

**`app/error.vue`** (new) — minimal error page using `useError()` showing the status code and message, with a link back to home.

---

## File Summary

| Path | Action |
|------|--------|
| `nuxt.config.ts` | Modify |
| `app.config.ts` | Create |
| `app/assets/css/main.css` | Create |
| `app/app.vue` | Modify |
| `app/layouts/default.vue` | Create |
| `app/components/AppNav.vue` | Create |
| `app/components/LangSwitcher.vue` | Create |
| `app/components/EventCard.vue` | Create |
| `app/locales/pt.json` | Create |
| `app/locales/de.json` | Create |
| `app/pages/index.vue` | Create |
| `app/pages/list.vue` | Create |
| `app/pages/event/[id].vue` | Create |
| `app/error.vue` | Create |
| `server/db/schema.ts` | Create |
| `server/db/queries/seed.sql` | Create |
| `server/api/events/index.get.ts` | Create |
| `server/api/events/[id].get.ts` | Create |
| `app/composables/useEvents.ts` | Create |
| `app/composables/useFormatDate.ts` | Create |

---

## Verification

1. `bun dev` starts without errors
2. `curl http://localhost:3000/api/events` returns the two seeded events as JSON
3. `/` shows the calendar with dots on April 15 and 22
4. Clicking April 15 shows the "Fado Night" event card in the day panel
5. Clicking the card navigates to `/event/evt-001` with correct content
6. `/list` shows both events in chronological order
7. Switching locale via `LangSwitcher` updates UI strings without changing the URL
8. View-source on `/event/evt-001` shows populated OG meta tags
