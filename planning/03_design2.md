# Calendar UX Polish — Full-page grid, event modal, red header with logo

## Context
Three UX improvements on top of the FullCalendar integration already in place:
1. The calendar should fill the full viewport like Google Calendar (not sit inside a padded container)
2. Clicking an event should open an inline detail modal rather than navigating away from the calendar
3. The `AppNav` header should use the brand red background and show the `2314.webp` logo

---

## Change 1 — Full-page calendar (`app/pages/index.vue` + `app/components/AppCalendar.vue`)

The goal is a layout identical to Google Calendar: calendar grid fills the entire viewport below the nav bar with no title, no padding, no footer visible.

### `app/pages/index.vue`
- Remove the `container`/padding wrapper and the `<h1>` title (FullCalendar's toolbar already shows the month)
- Make the wrapping div stretch edge-to-edge and fill the remaining viewport height
- Use `definePageMeta({ layout: 'fullpage' })` — a new minimal layout that omits the footer

```vue
<script setup lang="ts">
definePageMeta({ layout: 'fullpage' })
</script>

<template>
  <div class="h-[calc(100dvh-56px)] p-4">
    <ClientOnly>
      <AppCalendar />
    </ClientOnly>
  </div>
</template>
```

### `app/components/AppCalendar.vue`
- Change `height` from `'auto'` to `'100%'`
- Add `expandRows: true` so rows stretch to fill the height evenly
- Change `eventClick` to emit `'event-click'` with the event id instead of routing (see Change 2)

### `app/layouts/fullpage.vue` *(new file)*
Layout without footer — same as `default.vue` minus the `<footer>`:

```vue
<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <AppNav />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
  </UApp>
</template>
```

---

## Change 2 — Event detail modal (`app/components/AppCalendar.vue` + new `app/components/EventModal.vue`)

Instead of routing on click, show a `UModal` with the event's full details fetched from `/api/events/:id`.

### `app/components/EventModal.vue` *(new file)*
- Props: `eventId: string | null`
- Computed `open` = `!!eventId`; emit `'close'` on modal dismiss
- Fetches `/api/events/:id` via `useFetch` (re-runs when `eventId` changes)
- Displays: title, formatted date range (`useFormatDate().formatDateRange`), location (with pin icon), description, "View details" link to `/event/:id`

```vue
<script setup lang="ts">
const props = defineProps<{ eventId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const open = computed(() => !!props.eventId)
const { data: event } = useFetch(() => `/api/events/${props.eventId}`, {
  watch: [() => props.eventId],
  immediate: false,
  enabled: open,
})
const { formatDateRange } = useFormatDate()
</script>

<template>
  <UModal :open="open" @close="emit('close')">
    <template #content>
      <div class="p-6" v-if="event">
        <h2 class="text-2xl font-bold text-stone-900 mb-2">{{ event.title }}</h2>
        <p class="text-sm text-red-600 font-medium mb-3">{{ formatDateRange(event.start_at, event.end_at) }}</p>
        <p v-if="event.location" class="flex items-center gap-1.5 text-sm text-stone-500 mb-4">
          <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
          {{ event.location }}
        </p>
        <p v-if="event.description" class="text-stone-700 whitespace-pre-line mb-6">{{ event.description }}</p>
        <NuxtLink :to="`/event/${event.id}`" class="text-sm text-red-600 hover:underline" @click="emit('close')">
          {{ $t('event.viewDetails') }} →
        </NuxtLink>
      </div>
      <div v-else class="p-6 text-stone-400">Loading…</div>
    </template>
  </UModal>
</template>
```

### `app/components/AppCalendar.vue` changes
- Add `const selectedEventId = ref<string | null>(null)`
- Change `eventClick` handler: `selectedEventId.value = info.event.id` (remove `router.push`)
- Remove `url` from event objects (no longer needed for navigation)
- Add `<EventModal :event-id="selectedEventId" @close="selectedEventId = null" />` after `<FullCalendar>`
- Wrap both in a `<div class="relative h-full">`

### i18n — add missing key
`event.viewDetails` needs to be added to both locale files:
- `i18n/pt.json`: `"viewDetails": "Ver detalhes"`
- `i18n/de.json`: `"viewDetails": "Details anzeigen"`

---

## Change 3 — Red header with logo (`app/components/AppNav.vue`)

Replace the current neutral nav with a red bar matching `--color-red-500: #C0392B`.

- Background: `bg-red-500`
- Remove the `border-b`
- Replace the `"2314"` text link with `<img src="~/assets/img/2314.webp" class="h-8 w-auto" alt="2314" />`
- Nav links: `text-white/90 hover:text-white font-medium`
- LangSwitcher: the UButton `solid` variant needs white text — pass `color="neutral"` or override; simplest fix is change the `solid` variant button to use explicit white styling via `class`

```vue
<template>
  <nav class="bg-red-500">
    <div class="container mx-auto px-4 h-14 flex items-center justify-between">
      <NuxtLink to="/">
        <img src="~/assets/img/2314.webp" class="h-8 w-auto" alt="2314" />
      </NuxtLink>
      <div class="flex items-center gap-6">
        <NuxtLink to="/" class="text-sm font-medium text-white/90 hover:text-white transition-colors">{{ t('nav.calendar') }}</NuxtLink>
        <NuxtLink to="/list" class="text-sm font-medium text-white/90 hover:text-white transition-colors">{{ t('nav.list') }}</NuxtLink>
        <NuxtLink to="/submit" class="text-sm font-medium text-white/90 hover:text-white transition-colors">{{ t('nav.submit') }}</NuxtLink>
        <LangSwitcher />
      </div>
    </div>
  </nav>
</template>
```

For `LangSwitcher.vue`: change the active `solid` variant to `outline` with explicit white text/border so it's legible on red:
```vue
:variant="locale === loc.code ? 'solid' : 'ghost'"
:class="locale === loc.code ? 'bg-white text-red-600 hover:bg-white/90' : 'text-white hover:bg-white/20'"
```

The layout `default.vue` nav height is now `h-14` (56px), matching the `calc(100dvh-56px)` used in the fullpage layout.

---

## Files Modified

| File | Action |
|------|--------|
| `app/pages/index.vue` | Use `fullpage` layout, stretch div, remove h1 |
| `app/layouts/fullpage.vue` | **Create** — layout without footer |
| `app/components/AppCalendar.vue` | `height: '100%'`, `expandRows: true`, emit-based eventClick, add EventModal |
| `app/components/EventModal.vue` | **Create** — UModal with event details |
| `app/components/AppNav.vue` | Red bg, logo img, white links |
| `app/components/LangSwitcher.vue` | White styling on red bg |
| `i18n/pt.json` | Add `event.viewDetails` |
| `i18n/de.json` | Add `event.viewDetails` |

**Not changed:** `app/pages/list.vue`, `app/pages/event/[id].vue`, `app/layouts/default.vue`, `app/assets/css/main.css`, `server/`, composables

---

## Verification

1. `/` — calendar fills the full viewport (no footer, no title, no side margins); rows expand to fill height evenly
2. Clicking an event pill opens a modal with title, time, location, description — no page navigation
3. Modal "View details →" link goes to `/event/:id` and closes the modal
4. Header is red (`#C0392B`) with the `2314.webp` logo on the left and white nav links
5. PT/DE switcher buttons are legible on red background
6. `/list` and `/event/:id` pages are unaffected and still show the red header
