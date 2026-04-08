<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
</script>

<template>
  <div class="flex gap-1">
    <UButton
      v-for="loc in locales"
      :key="loc.code"
      :variant="locale === loc.code ? 'solid' : 'ghost'"
      :class="locale === loc.code ? 'bg-white text-red-600 hover:bg-white/90' : 'text-white hover:bg-white/20'"
      size="xs"
      @click="setLocale(loc.code as 'pt' | 'de')"
    >
      {{ loc.code.toUpperCase() }}
    </UButton>
  </div>
</template>
