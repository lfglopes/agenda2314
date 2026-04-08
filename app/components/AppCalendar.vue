<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'

const { locale, t } = useI18n()
const selectedEventId = ref<string | null>(null)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
  height: '100%',
  expandRows: true,
  firstDay: 1,
  locale: locale.value,
  buttonText: { today: t('calendar.today') },
  events: async (fetchInfo: { startStr: string; endStr: string }, successCallback: Function, failureCallback: Function) => {
    try {
      const data = await $fetch<any[]>('/api/events', {
        query: { from: fetchInfo.startStr, to: fetchInfo.endStr },
      })
      successCallback(
        data.map(e => ({
          id: e.id,
          title: e.title,
          start: e.start_at,
          end: e.end_at,
          extendedProps: { location: e.location },
        }))
      )
    } catch (e) {
      failureCallback(e)
    }
  },
  eventClick: (info: any) => {
    info.jsEvent.preventDefault()
    selectedEventId.value = info.event.id
  },
}))
</script>

<template>
  <div class="relative h-full">
    <FullCalendar :options="calendarOptions" />
    <EventModal :event-id="selectedEventId" @close="selectedEventId = null" />
  </div>
</template>

<style scoped>
:deep(.fc-event) {
  cursor: pointer;
}
</style>
