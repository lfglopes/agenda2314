<script setup lang="ts">
const { t } = useI18n()

const isOpen = defineModel<boolean>('open')

const form = reactive({
  title: '',
  description: '',
  start_at: '',
  end_at: '',
  location: '',
  submitter_email: '',
  submitter_name: '',
  url: '', // honeypot
})

const submitting = ref(false)
const submitted = ref(false)
const error = ref<string | null>(null)

async function submit() {
  error.value = null

  if (form.end_at && form.start_at && new Date(form.end_at) <= new Date(form.start_at)) {
    error.value = t('submit.errorEndBeforeStart')
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/events', {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description || null,
        start_at: form.start_at,
        end_at: form.end_at,
        location: form.location || null,
        submitter_email: form.submitter_email,
        submitter_name: form.submitter_name || null,
        url: form.url,
      },
    })
    submitted.value = true
  }
  catch {
    error.value = t('submit.error')
  }
  finally {
    submitting.value = false
  }
}

function onClose() {
  submitted.value = false
  error.value = null
  Object.assign(form, {
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    submitter_email: '',
    submitter_name: '',
    url: '',
  })
}

watch(isOpen, (val) => {
  if (!val) onClose()
})
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ width: 'max-w-lg' }">
    <template #header>
      <h2 class="text-base font-semibold">{{ t('submit.title') }}</h2>
    </template>

    <template #body>
      <div v-if="submitted" class="py-4 text-center space-y-3">
        <div class="text-4xl">✓</div>
        <p class="font-semibold">{{ t('submit.successTitle') }}</p>
        <p class="text-sm text-muted">{{ t('submit.successMessage') }}</p>
        <UButton variant="outline" color="neutral" class="mt-2" @click="isOpen = false">
          Fechar
        </UButton>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <UAlert v-if="error" color="error" variant="soft" :description="error" />

        <!-- Honeypot: hidden from real users -->
        <div class="absolute -left-[9999px] -top-[9999px] overflow-hidden" aria-hidden="true">
          <label for="url">Website</label>
          <input id="url" v-model="form.url" type="text" name="url" tabindex="-1" autocomplete="off" />
        </div>

        <UFormField :label="t('submit.eventTitle')" required>
          <UInput v-model="form.title" required class="w-full" />
        </UFormField>

        <UFormField :label="t('submit.description')">
          <UTextarea v-model="form.description" :rows="3" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField :label="t('submit.startAt')" required>
            <UInput v-model="form.start_at" type="datetime-local" required class="w-full" />
          </UFormField>
          <UFormField :label="t('submit.endAt')" required>
            <UInput v-model="form.end_at" type="datetime-local" required class="w-full" />
          </UFormField>
        </div>

        <UFormField :label="t('submit.location')">
          <UInput v-model="form.location" class="w-full" />
        </UFormField>

        <UFormField :label="t('submit.email')" required>
          <UInput v-model="form.submitter_email" type="email" required class="w-full" />
        </UFormField>

        <UFormField :label="t('submit.name')">
          <UInput v-model="form.submitter_name" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton variant="ghost" color="neutral" type="button" @click="isOpen = false">
            Cancelar
          </UButton>
          <UButton type="submit" :loading="submitting">
            {{ t('submit.send') }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
