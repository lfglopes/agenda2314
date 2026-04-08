<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

useHead({ title: t('confirm.successTitle') })

const { data, error } = await useFetch(`/api/confirm/${route.params.token}`)
</script>

<template>
  <div class="container mx-auto px-4 py-16 max-w-lg text-center">
    <template v-if="error">
      <div class="text-5xl mb-6">✗</div>
      <h1 class="text-2xl font-bold mb-3">
        {{ error.statusCode === 410 ? t('confirm.errorExpired') : t('confirm.errorInvalid') }}
      </h1>
      <NuxtLink to="/" class="text-sm text-primary underline underline-offset-4">
        {{ t('confirm.backToCalendar') }}
      </NuxtLink>
    </template>
    <template v-else-if="data">
      <div class="text-5xl mb-6">✓</div>
      <h1 class="text-2xl font-bold mb-3">{{ t('confirm.successTitle') }}</h1>
      <p class="text-muted mb-6">{{ t('confirm.successMessage') }}</p>
      <NuxtLink to="/" class="text-sm text-primary underline underline-offset-4">
        {{ t('confirm.backToCalendar') }}
      </NuxtLink>
    </template>
  </div>
</template>
