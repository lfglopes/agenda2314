# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Community cultural calendar for **2314**, a Portuguese association in Berlin. Events are submitted by anyone, confirmed via email, and moderated before going live. The interface is bilingual: Portuguese (default) and German.

## Commands

```bash
bun dev          # Start dev server (localhost:3000)
bun build        # Build for production
bun preview      # Preview production build
```

### Database migrations

Migrations are generated and applied via NuxtHub's drizzle integration. The drizzle config is auto-generated at `.nuxt/hub/db/drizzle.config.ts` during `nuxt prepare`. Run migrations with:

```bash
bunx drizzle-kit generate   # Generate migration from schema changes
bunx drizzle-kit migrate    # Apply migrations (local .data/db/sqlite.db)
```

Seed data is in `server/db/queries/seed.sql` — apply manually via the D1/sqlite CLI.

### Creating a moderator account

Moderators are not self-registered. Use the bootstrap script (requires the dev server to have run at least once to create the local DB):

```bash
bun scripts/create-mod.ts <email> <name> <password>
```

## Architecture

### Nuxt 4 app directory

The project uses the Nuxt 4 `app/` directory convention (not the older root-level `pages/`/`components/` layout).

- `app/pages/` — public routes + `mod/` for moderation panel
- `app/components/` — `AppCalendar` (FullCalendar wrapper), `EventModal`, `AddToCalendar`, `SubscribeCalendar`, `AppNav`, `LangSwitcher`
- `app/composables/` — `useEvents` (fetches `/api/events` with optional date range), `useFormatDate`
- `app/middleware/mod.ts` — client-side route guard; redirects to `/mod/login` if `mod_session` cookie is absent
- `app/layouts/` — `default.vue` (with nav), `fullpage.vue` (used for mod login)
- `i18n/locales/pt.json` and `de.json` — translation strings

### Server

- `server/db/schema.ts` — Drizzle schema; single source of truth for `events` and `moderators` tables
- `server/api/` — Nitro route handlers (file-based routing: `[id].get.ts`, `index.post.ts`, etc.)
- `server/utils/mod-auth.ts` — `requireModAuth(event)` utility; validates `mod_session` cookie against KV store, throws 401 if invalid
- `server/utils/ics.ts` — iCal feed generation

### Auto-imported server globals (NuxtHub)

In server API handlers, `db` (Drizzle instance) and `schema` (all table exports) are **auto-imported globals** provided by NuxtHub — no explicit import needed. Use them directly:

```ts
db.select().from(schema.events).where(eq(schema.events.status, 'approved'))
```

`hubKV()` and `hubBlob()` are similarly auto-imported NuxtHub utilities.

### Auth flow

Moderator sessions use a random UUID token stored in NuxtHub KV under `mod:session:<token>` (7-day TTL). The token is set as an `httpOnly` cookie `mod_session`. The client-side middleware checks cookie presence; the server-side `requireModAuth()` validates the KV entry.

### Event lifecycle

```
unconfirmed → approved   (default: email confirmation auto-approves)
unconfirmed → pending    (if REQUIRE_MODERATION=true)
pending     → approved | rejected  (moderator action)
approved    → rejected   (moderator can reject after the fact)
```

### iCal feed

`/api/calendar.ics` serves all `approved` events as RFC 5545 iCalendar. Per-event iCal at `/api/events/[id]/ical`.

## Key configuration

`nuxt.config.ts` — modules: `@nuxt/ui`, `@nuxtjs/i18n`, `@nuxthub/core`, `@nuxt/eslint`. Hub config enables `db: 'sqlite'` and `kv: true`. NuxtHub auto-generates `wrangler.json` at build time.

`runtimeConfig.siteUrl` — used to build confirmation email links; set to the deployed URL in production via environment variable `NUXT_SITE_URL`.

## Branding / CSS

Brand colors are defined as Tailwind theme overrides in `app/assets/css/main.css`:

- Primary red: `#C0392B` → `red-500`
- Dark: `#1A1A1A` → `stone-950`

FullCalendar CSS variables are also overridden there to match the brand palette. Nuxt UI semantic color tokens (`primary`, `neutral`) map to these via the Tailwind theme.
