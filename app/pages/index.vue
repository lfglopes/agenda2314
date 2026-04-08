<script setup lang="ts">
definePageMeta({ layout: 'fullpage' })
const { t, locale } = useI18n()
useHead({ title: t('calendar.title') })
</script>

<template>
  <div class="h-[calc(100dvh-56px)] p-4">
    <ClientOnly>
      <AppCalendar :key="locale" />
    </ClientOnly>
  </div>
</template>
