<script setup lang="ts">
const { locale, t } = useI18n()
useHead({ title: t('nav.list') })
const todayIso = new Date().toISOString().split('T')[0]

const { data: events } = useEvents(ref({ from: todayIso }))

const grouped = computed(() => {
  if (!events.value) return []
  const map = new Map<string, { label: string; events: typeof events.value }>()
  for (const event of events.value) {
    const d = new Date(event.start_at)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) {
      const label = new Intl.DateTimeFormat(locale.value, {
        month: 'long',
        year: 'numeric',
      }).format(d)
      map.set(key, { label, events: [] })
    }
    map.get(key)!.events.push(event)
  }
  return [...map.values()]
})

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

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
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
      <div v-for="event in group.events" :key="event.id" class="flex gap-6 py-6 border-b border-stone-100">
        <!-- Left: day -->
        <div class="w-14 shrink-0 text-center pt-1">
          <div class="text-xs font-semibold text-stone-400 uppercase tracking-wide">{{ weekday(event.start_at) }}</div>
          <div class="text-3xl font-bold text-stone-800 leading-none mt-0.5">{{ dayNum(event.start_at) }}</div>
        </div>

        <!-- Right: details -->
        <div class="flex-1 min-w-0">
          <p class="text-xs text-red-600 font-medium mb-1">{{ timeRange(event.start_at, event.end_at) }}</p>
          <h3 class="text-lg font-bold text-stone-900 mb-2">{{ event.title }}</h3>

          <a v-if="event.location" :href="mapsUrl(event.location)" target="_blank" rel="noopener"
            class="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition-colors mb-3">
            <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
            {{ event.location }}
          </a>

          <p v-if="event.description" class="text-sm text-stone-600 whitespace-pre-line mb-3">{{ event.description }}</p>

          <p v-if="event.submitter_name" class="text-xs text-stone-400">
            {{ $t('event.organiser') }}: {{ event.submitter_name }}
          </p>
          <div class="mt-3">
            <AddToCalendar :event="event" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
