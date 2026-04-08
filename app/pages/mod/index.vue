<script setup lang="ts">
definePageMeta({ middleware: 'mod' })
useHead({ title: 'Moderação' })

type EventStatus = 'unconfirmed' | 'pending' | 'approved' | 'rejected'

type ModEvent = {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  location: string | null
  submitter_email: string
  submitter_name: string | null
  status: EventStatus
  moderator_notes: string | null
  created_at: string
  updated_at: string
}

const statusFilter = ref<EventStatus | undefined>(undefined)

const { data: events, refresh } = await useFetch<ModEvent[]>('/api/mod/events', {
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
  { accessorKey: 'title', header: 'Título' },
  { accessorKey: 'submitter_email', header: 'Submissor' },
  { accessorKey: 'start_at', header: 'Data' },
  { accessorKey: 'status', header: 'Estado' },
  { id: 'actions', header: 'Ações' },
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

const statusOptions = [
  { label: 'Não confirmado', value: 'unconfirmed' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Rejeitado', value: 'rejected' },
]

// Edit modal
const editingEvent = ref<ModEvent | null>(null)
const isEditOpen = computed({
  get: () => editingEvent.value !== null,
  set: (val) => { if (!val) editingEvent.value = null },
})
const editForm = reactive({
  title: '',
  description: '',
  start_at: '',
  end_at: '',
  location: '',
  status: 'pending' as EventStatus,
  moderator_notes: '',
})
const saving = ref(false)

function toDatetimeLocal(iso: string) {
  return new Date(iso).toISOString().slice(0, 16)
}

function openEdit(event: ModEvent) {
  editingEvent.value = event
  editForm.title = event.title
  editForm.description = event.description ?? ''
  editForm.start_at = toDatetimeLocal(event.start_at)
  editForm.end_at = toDatetimeLocal(event.end_at)
  editForm.location = event.location ?? ''
  editForm.status = event.status
  editForm.moderator_notes = event.moderator_notes ?? ''
}

async function saveEdit() {
  if (!editingEvent.value) return
  saving.value = true
  try {
    await $fetch(`/api/mod/events/${editingEvent.value.id}`, {
      method: 'PATCH',
      body: {
        title: editForm.title,
        description: editForm.description || null,
        start_at: new Date(editForm.start_at).toISOString(),
        end_at: new Date(editForm.end_at).toISOString(),
        location: editForm.location || null,
        status: editForm.status,
        moderator_notes: editForm.moderator_notes || null,
      },
    })
    editingEvent.value = null
    await refresh()
  }
  finally {
    saving.value = false
  }
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
      <UButton variant="solid" color="neutral" @click="logout">
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
        {{ formatDate(row.original.start_at) }}
      </template>

      <template #status-cell="{ row }">
        <UBadge :color="statusColor[row.original.status as EventStatus]" variant="soft">
          {{ statusLabel[row.original.status as EventStatus] ?? row.original.status }}
        </UBadge>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex gap-2">
          <UButton
            size="xs"
            color="neutral"
            variant="outline"
            @click="openEdit(row.original)"
          >
            Editar
          </UButton>
          <UButton
            v-if="row.original.status !== 'approved'"
            size="xs"
            color="success"
            variant="soft"
            @click="updateStatus(row.original.id, 'approved')"
          >
            Aprovar
          </UButton>
          <UButton
            v-if="row.original.status !== 'rejected'"
            size="xs"
            color="error"
            variant="soft"
            @click="updateStatus(row.original.id, 'rejected')"
          >
            Rejeitar
          </UButton>
        </div>
      </template>
    </UTable>

    <UModal v-model:open="isEditOpen" :ui="{ width: 'max-w-lg' }">
      <template #header>
        <h2 class="text-base font-semibold">Editar evento</h2>
      </template>

      <template #body>
        <form class="space-y-4" @submit.prevent="saveEdit">
          <UFormField label="Título">
            <UInput v-model="editForm.title" required class="w-full" />
          </UFormField>

          <UFormField label="Descrição">
            <UTextarea v-model="editForm.description" :rows="3" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Início">
              <UInput v-model="editForm.start_at" type="datetime-local" required class="w-full" />
            </UFormField>
            <UFormField label="Fim">
              <UInput v-model="editForm.end_at" type="datetime-local" required class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Local">
            <UInput v-model="editForm.location" class="w-full" />
          </UFormField>

          <UFormField label="Estado">
            <USelect v-model="editForm.status" :items="statusOptions" value-key="value" label-key="label" class="w-full" />
          </UFormField>

          <UFormField label="Notas do moderador">
            <UTextarea v-model="editForm.moderator_notes" :rows="2" class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="ghost" color="neutral" type="button" @click="editingEvent = null">
              Cancelar
            </UButton>
            <UButton type="submit" :loading="saving">
              Guardar
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
