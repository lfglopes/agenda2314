<script setup lang="ts">
const props = defineProps<{
  event: {
    id: string
    title: string
    start_at: string
    end_at: string
    location?: string | null
    description?: string | null
  }
}>()

const { t } = useI18n()

function fmt(iso: string) {
  return iso.replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function googleUrl() {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: props.event.title,
    dates: `${fmt(props.event.start_at)}/${fmt(props.event.end_at)}`,
    ...(props.event.description && { details: props.event.description }),
    ...(props.event.location && { location: props.event.location }),
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

const icsUrl = computed(() => `/api/events/${props.event.id}/ical`)

const items = computed(() => [[
  {
    label: t('event.addToGoogle'),
    icon: 'i-lucide-calendar',
    class: 'cursor-pointer',
    onSelect: () => window.open(googleUrl(), '_blank'),
  },
  {
    label: t('event.addToApple'),
    icon: 'i-lucide-calendar',
    class: 'cursor-pointer',
    onSelect: () => { window.location.href = icsUrl.value },
  },
  {
    label: t('event.addToOutlook'),
    icon: 'i-lucide-calendar',
    class: 'cursor-pointer',
    onSelect: () => { window.location.href = icsUrl.value },
  },
  {
    label: t('event.downloadIcs'),
    icon: 'i-lucide-download',
    class: 'cursor-pointer',
    onSelect: () => { window.location.href = icsUrl.value },
  },
]])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton icon="i-lucide-calendar-plus" variant="ghost" color="neutral" size="sm" class="cursor-pointer">
      {{ $t('event.addToCalendar') }}
    </UButton>
  </UDropdownMenu>
</template>
