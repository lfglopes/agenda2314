# Calendar Redesign — FullCalendar + Editorial List View

## Context
The current calendar uses NuxtUI's `UCalendar` (a compact date-picker widget), which is mismatched for the desired full-month grid aesthetic. The list view uses generic `UCard` components instead of the editorial row style seen in the reference screenshot (MaisBerlim). NuxtUI stays — it provides Tailwind v4, icons, and `UApp`; only the calendar component and list row design change.

---

## Step 1 — Install FullCalendar

```bash
bun add @fullcalendar/vue3 @fullcalendar/core @fullcalendar/daygrid
```

---

## Step 2 — Add FullCalendar CSS + branding overrides

**`app/assets/css/main.css`** — add FullCalendar imports before Tailwind, then override CSS variables to match red/stone branding:

```css
@import "@fullcalendar/core/index.global.css";
@import "@fullcalendar/daygrid/index.global.css";
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --color-red-500: #C0392B;
  --color-red-400: #E74C3C;
  --color-red-600: #A93226;
  --color-stone-950: #1A1A1A;
}

/* FullCalendar theme overrides */
:root {
  --fc-border-color: #e7e5e4;           /* stone-200 */
  --fc-today-bg-color: #fef2f2;         /* red-50 */
  --fc-event-bg-color: #C0392B;         /* red-500 */
  --fc-event-border-color: #A93226;     /* red-600 */
  --fc-event-text-color: #ffffff;
  --fc-button-bg-color: #C0392B;
  --fc-button-border-color: #A93226;
  --fc-button-hover-bg-color: #A93226;
  --fc-button-active-bg-color: #922B21;
  --fc-page-bg-color: transparent;
}
```

---

## Step 3 — New `app/components/AppCalendar.vue` (FullCalendar wrapper)

Client-only component (no SSR). Fetches events from `/api/events` via FullCalendar's events function, maps `start_at`/`end_at` → `start`/`end`, attaches `url: /event/:id`. Uses `useRouter().push()` on eventClick for SPA navigation.

```vue
<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useRouter } from 'vue-router'

const router = useRouter()

const calendarOptions = {
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
  height: 'auto',
  firstDay: 1,             // Monday first
  locale: useI18n().locale.value,
  events: async (fetchInfo, successCallback, failureCallback) => {
    try {
      const data = await $fetch('/api/events', {
        query: { from: fetchInfo.startStr, to: fetchInfo.endStr },
      })
      successCallback(
        data.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start_at,
          end: e.end_at,
          url: `/event/${e.id}`,
          extendedProps: { location: e.location },
        }))
      )
    } catch (e) {
      failureCallback(e)
    }
  },
  eventClick: (info) => {
    info.jsEvent.preventDefault()
    router.push(info.event.url)
  },
}
</script>

<template>
  <FullCalendar :options="calendarOptions" />
</template>
```

---

## Step 4 — Rewrite `app/pages/index.vue`

Replace the UCalendar + day-panel layout with a full-width FullCalendar grid wrapped in `<ClientOnly>`:

```vue
<script setup lang="ts">
// no data fetching needed — AppCalendar handles it internally
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">{{ $t('calendar.title') }}</h1>
    <ClientOnly>
      <AppCalendar />
    </ClientOnly>
  </div>
</template>
```

---

## Step 5 — Rewrite `app/pages/list.vue` (editorial style)

Match the MaisBerlim aesthetic: month heading as a separator, each event row has weekday abbreviation + big day number on the left, title + time + location on the right. No images (skip for now). No cards.

```vue
<script setup lang="ts">
const { locale } = useI18n()
const todayIso = new Date().toISOString().split('T')[0]
const { data: events } = useEvents(ref({ from: todayIso }))

const grouped = computed(() => { /* same grouping logic as before */ })

function weekday(iso: string) {
  return new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
    .format(new Date(iso)).toUpperCase()
}
function dayNum(iso: string) {
  return new Date(iso).getUTCDate()
}
function timeRange(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' })
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <p v-if="events?.length === 0" class="text-stone-400">{{ $t('calendar.noEvents') }}</p>

    <div v-for="group in grouped" :key="group.label" class="mb-10">
      <!-- Month heading -->
      <div class="flex items-center gap-4 mb-6">
        <span class="text-sm font-medium uppercase tracking-widest text-stone-400">{{ group.label }}</span>
        <div class="flex-1 h-px bg-stone-200" />
      </div>

      <!-- Event rows -->
      <div v-for="event in group.events" :key="event.id">
        <NuxtLink :to="`/event/${event.id}`" class="flex gap-6 py-5 border-b border-stone-100 hover:bg-stone-50 transition-colors group">
          <!-- Left: day -->
          <div class="w-14 shrink-0 text-center">
            <div class="text-xs font-semibold text-stone-400 uppercase tracking-wide">{{ weekday(event.start_at) }}</div>
            <div class="text-3xl font-bold text-stone-800 leading-none mt-0.5">{{ dayNum(event.start_at) }}</div>
          </div>
          <!-- Right: details -->
          <div class="flex-1 min-w-0">
            <p class="text-xs text-red-600 font-medium mb-1">{{ timeRange(event.start_at, event.end_at) }}</p>
            <h3 class="text-lg font-bold text-stone-900 group-hover:text-red-600 transition-colors truncate">{{ event.title }}</h3>
            <p v-if="event.location" class="text-sm text-stone-500 mt-1">{{ event.location }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
```

---

## Step 6 — Clean up `app/components/EventCard.vue`

EventCard is no longer used (list.vue inlines its rows; index.vue uses FullCalendar). Delete the file.

---

## Files Modified

| File | Action |
|------|--------|
| `app/assets/css/main.css` | Add FC CSS imports + CSS variable overrides |
| `app/components/AppCalendar.vue` | **Create** — FullCalendar client-only component |
| `app/pages/index.vue` | Rewrite — `<ClientOnly><AppCalendar /></ClientOnly>` |
| `app/pages/list.vue` | Rewrite — editorial row layout |
| `app/components/EventCard.vue` | Delete (unused) |

**Not changed:** `nuxt.config.ts`, `app.config.ts`, `server/`, `layouts/`, `AppNav.vue`, `LangSwitcher.vue`, `composables/`

---

## Verification

1. `bun dev` starts without errors
2. `/` shows a full month grid (Monday-first) with "Fado Night" visible on Apr 15 and "Cinema Português" on Apr 22 in red pills
3. Clicking an event navigates to `/event/:id` (SPA nav, no full reload)
4. `/list` shows events in editorial row format: weekday abbreviation + large day number on left, time + title + location on right
5. Month headings appear as thin separator rows ("abril 2026")
6. PT/DE lang switcher still works; nav links function correctly
