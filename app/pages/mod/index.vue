<script setup lang="ts">
definePageMeta({ middleware: 'mod' })
useHead({ title: 'Moderação' })

type EventStatus = 'unconfirmed' | 'pending' | 'approved' | 'rejected'

const statusFilter = ref<EventStatus | undefined>(undefined)

const { data: events, refresh } = await useFetch('/api/mod/events', {
  query: computed(() => statusFilter.value ? { status: statusFilter.value } : {}),
})

const tabs = [
  { label: 'Todos', value: undefined },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Aprovados', value: 'approved' },
  { label: 'Rejeitados', value: 'rejected' },
  { label: 'Não confirmados', value: 'unconfirmed' },
] as const

const columns = [
  { key: 'title', label: 'Título' },
  { key: 'submitter_email', label: 'Submissor' },
  { key: 'start_at', label: 'Data' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Ações' },
]

const statusColor: Record<EventStatus, 'success' | 'error' | 'warning' | 'neutral'> = {
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
  unconfirmed: 'neutral',
}

const statusLabel: Record<EventStatus, string> = {
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  pending: 'Pendente',
  unconfirmed: 'Não confirmado',
}

async function updateStatus(id: string, status: EventStatus) {
  await $fetch(`/api/mod/events/${id}`, { method: 'PATCH', body: { status } })
  await refresh()
}

async function logout() {
  await $fetch('/api/mod/logout', { method: 'POST' })
  await navigateTo('/mod/login')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Moderação</h1>
      <UButton variant="ghost" color="neutral" @click="logout">
        Sair
      </UButton>
    </div>

    <div class="flex gap-2 mb-6 flex-wrap">
      <UButton
        v-for="tab in tabs"
        :key="String(tab.value)"
        :variant="statusFilter === tab.value ? 'solid' : 'outline'"
        color="neutral"
        size="sm"
        @click="statusFilter = tab.value as EventStatus | undefined"
      >
        {{ tab.label }}
      </UButton>
    </div>

    <UTable :data="events ?? []" :columns="columns">
      <template #start_at-cell="{ row }">
        {{ formatDate(row.start_at) }}
      </template>

      <template #status-cell="{ row }">
        <UBadge :color="statusColor[row.status as EventStatus]" variant="soft">
          {{ statusLabel[row.status as EventStatus] ?? row.status }}
        </UBadge>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex gap-2">
          <UButton
            v-if="row.status !== 'approved'"
            size="xs"
            color="success"
            variant="soft"
            @click="updateStatus(row.id, 'approved')"
          >
            Aprovar
          </UButton>
          <UButton
            v-if="row.status !== 'rejected'"
            size="xs"
            color="error"
            variant="soft"
            @click="updateStatus(row.id, 'rejected')"
          >
            Rejeitar
          </UButton>
        </div>
      </template>
    </UTable>
  </div>
</template>
