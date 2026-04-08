<script setup lang="ts">
definePageMeta({ layout: 'fullpage' })
</script>

<template>
  <div class="h-[calc(100dvh-56px)] p-4">
    <ClientOnly>
      <AppCalendar />
    </ClientOnly>
  </div>
</template>
