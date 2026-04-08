# Community Calendar — Project Brief

## Overview

A shared community calendar website where members can submit events and moderators can approve them before they go live. The calendar should be subscribable via standard formats (iCal) so users can sync events to Google Calendar, Apple Calendar, and other apps.

The interface is bilingual: **Portuguese (European)** and **German**.

---

## Goals

- Provide a single, centralized calendar for community events
- Allow anyone to submit events without needing an account
- Verify submissions via email confirmation before they enter the moderation queue
- Give moderators a simple workflow to review, approve, or reject submissions
- Offer standard calendar subscription (`.ics` feed) for external apps
- Keep the stack simple, low-cost, and maintainable by a small team

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Nuxt 4 | SSR/SSG for public pages, `/server/api/` for backend logic |
| Cloudflare Integration | @nuxthub/core | Unified API for D1, R2, KV; auto-generates wrangler config |
| Database | Cloudflare D1 (via NuxtHub) | SQLite at the edge |
| File Storage | Cloudflare R2 (via NuxtHub) | Event images/flyers |
| Hosting | Cloudflare Pages / Workers | Auto-deploy from Git |
| Server Logic | Nitro (Cloudflare Workers) | Nuxt's built-in server engine |
| UI Components | Nuxt UI v4 | 125+ accessible Tailwind CSS components, includes Calendar, Table, Form, Modal, etc. |
| Email | Resend | Confirmation emails and moderator notifications |
| i18n | @nuxtjs/i18n | Portuguese (PT) and German (DE); Nuxt UI has built-in locale support |

### Why Cloudflare + NuxtHub?

- Single platform: hosting, database, storage, server logic, and DNS in one Cloudflare account
- NuxtHub abstracts Cloudflare bindings — `hub: { database: true, blob: true }` in nuxt.config and you're done
- NuxtHub auto-generates wrangler.json at build time, no manual config file to maintain
- Multi-vendor escape hatch: NuxtHub v0.10+ supports Vercel, AWS, and other providers if you ever migrate
- D1 (SQLite) is more than sufficient for this use case
- Cost-effective: Cloudflare's free tier covers everything for a community project

### Why Nuxt UI?

- 125+ production-ready components (Calendar, Table, Form, Modal, Card, Navigation, etc.)
- Built-in semantic color system — map 2314's red/black/white brand to `primary`, `neutral`, etc. via CSS variables
- Accessible by default (keyboard nav, ARIA), i18n-ready with 30+ locales
- Replaces the need for FullCalendar — Nuxt UI's Calendar component + custom list/month views built with its primitives
- Fully free and open-source since v4 (previously Pro components now included)

---

## Branding

### Identity

The calendar is branded under **2314**, a Portuguese cultural association based in Berlin. The logo features a stylized "2314" with a swallow (andorinha) motif.

### Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary | Red | `#C0392B` | Logo, buttons, active states, accents |
| Dark | Black | `#1A1A1A` | Text, headers, logo alternate |
| Light | White | `#FFFFFF` | Backgrounds, card surfaces |
| Neutral | Warm Gray | `#F5F3F0` | Page background, calendar grid cells |
| Muted | Medium Gray | `#8C8C8C` | Secondary text, borders, inactive states |

### Typography

- **Headings:** A bold sans-serif (e.g., Montserrat Bold or similar geometric sans)
- **Body:** A clean sans-serif (e.g., Inter, Source Sans Pro)
- Final typeface selection to be confirmed during design phase

### Visual Tone

- Clean and minimal — the content (events) should be the focus
- Red accents used sparingly for CTAs and highlights, not as a dominant background color
- Black and white as the structural palette, red as the accent
- The swallow icon can be used as a subtle decorative motif (e.g., empty states, loading indicators)

---

## Data Model

### `events` table

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | UUID, auto-generated |
| `title` | text | Required |
| `description` | text | Optional, supports basic formatting |
| `start_at` | text (ISO 8601) | Required |
| `end_at` | text (ISO 8601) | Required |
| `location` | text | Optional (venue name or address) |
| `category` | text | Optional (e.g., "cinema", "música", "oficina") |
| `image_key` | text | Optional, R2 object key for uploaded image |
| `submitter_email` | text | Required, used for confirmation |
| `submitter_name` | text | Optional display name |
| `status` | text | `unconfirmed` → `approved` / `rejected` (see Event Lifecycle) |
| `confirmation_token` | text | Unique token for email confirmation link |
| `token_expires_at` | text (ISO 8601) | Confirmation token expiry (e.g., 48h) |
| `moderator_notes` | text | Internal notes, visible only to moderators |
| `created_at` | text (ISO 8601) | Auto-set |
| `updated_at` | text (ISO 8601) | Auto-updated |

### `moderators` table

| Column | Type | Notes |
|---|---|---|
| `id` | text (PK) | UUID |
| `email` | text (unique) | Moderator's email |
| `password_hash` | text | Hashed password for moderator login |
| `name` | text | Display name |
| `created_at` | text (ISO 8601) | Auto-set |

> **Note:** D1 uses SQLite, which stores all values as text, integer, real, or blob. Dates are stored as ISO 8601 text strings. UUIDs are generated in application code. Database access is handled via NuxtHub's `hubDatabase()` server utility, which provides a typed D1 interface with no manual binding setup.

---

## Event Lifecycle

### Default flow (v1): email confirmation → published

```
[User submits form]
        │
        ▼
   ┌──────────┐
   │unconfirmed│  ← Event created, confirmation email sent
   └─────┬────┘
         │  User clicks email link
         ▼
   ┌──────────┐
   │ approved  │  ← Immediately visible on calendar and iCal feed
   └──────────┘
```

Moderators can still manually change any event to `rejected` after the fact (e.g., spam that slipped through).

### Optional future flow: email confirmation → moderation → published

A site-wide config flag (e.g., `REQUIRE_MODERATION=true`) can switch the confirmation endpoint to set status to `pending` instead of `approved`. This enables the full moderation queue:

```
[User submits form]
        │
        ▼
   ┌──────────┐
   │unconfirmed│  ← Event created, confirmation email sent
   └─────┬────┘
         │  User clicks email link
         ▼
   ┌──────────┐
   │  pending  │  ← Visible to moderators only
   └─────┬────┘
        ╱ ╲
       ╱   ╲
      ▼     ▼
┌────────┐ ┌────────┐
│approved│ │rejected│
└────────┘ └────────┘
```

The moderation panel and moderator auth should be built from the start so this switch is trivial.

### Email Confirmation Flow

1. User fills in event form (including their email address)
2. Server creates event with `status: "unconfirmed"` and generates a `confirmation_token`
3. Server sends email via Resend with a link: `https://site.com/confirmar/{token}`
4. User clicks the link within 48 hours
5. Server validates token and expiry, updates status to `"approved"` (or `"pending"` if moderation is enabled)
6. Server sends a notification email to all moderators informing them of the new event

---

## Features & Views

### 1. Public Calendar

- **Month view** — grid layout built with Nuxt UI Calendar component, showing event dots/bars on their dates
- **List view** — chronological list of upcoming events with title, date, location, and optional image (Nuxt UI Card components)
- **Day view** — all events for a selected date
- Clicking an event opens a detail page (title, full description, time, location, image)
- Filter by category (Nuxt UI Select / Tabs)
- SSR-rendered for SEO — each event has its own URL with OpenGraph meta tags

### 2. Event Submission Form (no authentication required)

- Built with Nuxt UI Form components (UInput, UTextarea, USelect, UInputDate, UInputTime) with built-in validation
- Fields: title, description, start date/time, end date/time, location, category (dropdown), image upload (optional), submitter email, submitter name (optional)
- On submit: event is saved as `unconfirmed`, confirmation email is sent
- User sees a message: "Verifique o seu email para confirmar o envio do evento"
- Simple spam prevention: honeypot field + rate limiting on the server route

### 3. Moderation Panel

- Protected by moderator login (email + password, simple session/cookie auth)
- Nuxt UI Table component with events filtered by status (default view: all events, sortable by status)
- Each row shows: title, submitter email, date, category, submission date, status badge (Nuxt UI Badge)
- Actions per event: **Aprovar**, **Rejeitar**, **Editar** (via Nuxt UI Modal), add moderator notes
- Approving/rejecting optionally sends a notification email to the submitter

### 4. iCal Subscription Feed

- Nuxt server route at `/api/calendar.ics`
- Outputs all approved events in iCalendar format (RFC 5545)
- Users subscribe via URL in Google Calendar / Apple Calendar
- Feed auto-updates as events are approved
- Use `ical-generator` npm package or build the text output manually

### 5. Moderator Authentication

- Simple email + password login (no public registration — moderators are added manually or seeded)
- Session managed via secure HTTP-only cookie
- No OAuth or third-party auth needed — keep it minimal

---

## Pages / Routes

### Public

| Route | View |
|---|---|
| `/` | Calendar (month view, default) |
| `/lista` | List view of upcoming events |
| `/event/:id` | Event detail page (SSR with OG meta) |
| `/enviar` | Event submission form |
| `/confirmar/:token` | Email confirmation handler |
| `/api/calendar.ics` | iCal feed (server route) |

### Moderator

| Route | View |
|---|---|
| `/mod/login` | Moderator login |
| `/mod` | Moderation dashboard (pending events) |
| `/mod/evento/:id` | Edit/review single event |

---

## API Routes (Nuxt `/server/api/`)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/events` | List approved events (with optional date range and category filters) |
| `GET` | `/api/events/:id` | Single event detail |
| `POST` | `/api/events` | Submit new event (creates as unconfirmed, sends email) |
| `GET` | `/api/confirm/:token` | Confirm event via email token |
| `GET` | `/api/calendar.ics` | iCal feed of approved events |
| `POST` | `/api/mod/login` | Moderator login |
| `GET` | `/api/mod/events` | List events by status (requires mod auth) |
| `PATCH` | `/api/mod/events/:id` | Update event status/details (requires mod auth) |
| `DELETE` | `/api/mod/events/:id` | Delete event (requires mod auth) |

---

## Development Phases

### Phase 1 — Foundation
- Cloudflare account setup (D1, R2 created via dashboard)
- Nuxt project scaffold with NuxtHub (`npx nuxthub init`)
- Nuxt UI installation and theme configuration (map 2314 brand colors to semantic tokens)
- D1 schema and migrations
- i18n setup with @nuxtjs/i18n (Portuguese and German)
- Basic calendar page using Nuxt UI Calendar + custom month/list views pulling from `/api/events`

### Phase 2 — Submission Flow
- Event submission form (Nuxt UI Form components with validation) with image upload via NuxtHub blob (`hubBlob()`)
- Resend integration for confirmation emails
- Email confirmation endpoint
- Moderator notification email on new confirmed event
- Spam prevention (honeypot field + rate limiting on server route)

### Phase 3 — Moderation
- Moderator login and session management
- Moderation dashboard using Nuxt UI Table (list, filter by status, sortable)
- Approve / reject / edit workflow (Nuxt UI Modal for event editing)
- Optional: email notifications to submitters on status change

### Phase 4 — Subscriptions & Polish
- iCal feed server route
- Category filtering on public views
- Responsive design and mobile optimization
- OpenGraph meta tags per event page
- Empty states, loading states, error handling

### Phase 5 — Nice-to-Haves
- Search functionality
- Event sharing buttons
- Multi-day events support

---

## Open Questions

- [ ] Are there predefined categories, or should moderators be able to manage them?
- [ ] Should submitters receive email notifications when their event is approved or rejected?
- [ ] Should the confirmation link allow the submitter to also edit their event before it goes to moderation?
- [ ] Domain name — is there an existing domain for this project?
- [ ] Will there be multiple moderators, and should moderation actions be logged with who did what?
- [ ] Which language should be the default (PT or DE)? Should it auto-detect from browser locale?
