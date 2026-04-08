<script setup lang="ts">
const { locale } = useI18n()
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
