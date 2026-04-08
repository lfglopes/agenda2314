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
