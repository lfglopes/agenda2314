<script setup lang="ts">
const error = useError()
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-6xl font-bold mb-4">{{ error?.statusCode }}</h1>
        <p class="text-muted mb-6">{{ error?.statusMessage || $t('errors.notFound') }}</p>
        <UButton to="/">Voltar ao início</UButton>
      </div>
    </div>
  </UApp>
</template>
