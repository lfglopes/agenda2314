<script setup lang="ts">
const route = useRoute()
const { data: event } = await useFetch(`/api/events/${route.params.id}`)
if (!event.value) throw createError({ statusCode: 404 })

useSeoMeta({
  title: event.value.title,
  ogTitle: event.value.title,
  description: event.value.description?.slice(0, 160),
})

const { formatDateRange } = useFormatDate()
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <NuxtLink to="/" class="text-sm text-muted hover:text-primary mb-6 inline-block">
      ← {{ $t('nav.calendar') }}
    </NuxtLink>
    <h1 class="text-3xl font-bold mb-4">{{ event?.title }}</h1>
    <p class="text-muted mb-4">{{ formatDateRange(event!.start_at, event!.end_at) }}</p>
    <a v-if="event?.location" :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`" target="_blank" rel="noopener" class="mb-4 flex items-center gap-1 text-stone-500 hover:text-red-600 transition-colors">
      <UIcon name="i-lucide-map-pin" class="size-4" />
      {{ event.location }}
    </a>
    <p v-if="event?.description" class="mb-6 whitespace-pre-line">{{ event.description }}</p>
    <p v-if="event?.submitter_name" class="text-sm text-muted mb-6">
      {{ $t('event.organiser') }}: {{ event.submitter_name }}
    </p>
    <UButton to="/api/calendar.ics" variant="outline">
      {{ $t('calendar.subscribe') }}
    </UButton>
  </div>
</template>
