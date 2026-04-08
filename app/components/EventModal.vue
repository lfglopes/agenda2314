<script setup lang="ts">
const props = defineProps<{ eventId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const open = computed(() => !!props.eventId)
const event = ref<any>(null)

watch(() => props.eventId, async (id) => {
  if (!id) return
  event.value = null
  event.value = await $fetch(`/api/events/${id}`)
})

const { formatDateRange } = useFormatDate()

function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}
</script>

<template>
  <UModal :open="open" @update:open="(v) => { if (!v) emit('close') }">
    <template #content>
      <div class="p-6" v-if="event">
        <div class="flex items-start justify-between mb-2">
          <h2 class="text-2xl font-bold text-stone-900 pr-4">{{ event.title }}</h2>
          <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="sm" class="shrink-0 -mt-1 -mr-2 cursor-pointer" @click="emit('close')" />
        </div>
        <p class="text-sm text-red-600 font-medium mb-3">{{ formatDateRange(event.start_at, event.end_at) }}</p>
        <a v-if="event.location" :href="mapsUrl(event.location)" target="_blank" rel="noopener" class="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition-colors mb-4">
          <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" />
          {{ event.location }}
        </a>
        <p v-if="event.description" class="text-stone-700 whitespace-pre-line mb-6">{{ event.description }}</p>
        <NuxtLink :to="`/event/${event.id}`" class="text-sm text-red-600 hover:underline" @click="emit('close')">
          {{ $t('event.viewDetails') }} →
        </NuxtLink>
      </div>
      <div v-else class="p-6 text-stone-400">Loading…</div>
    </template>
  </UModal>
</template>
