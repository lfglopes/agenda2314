<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
</script>

<template>
  <nav class="bg-red-450">
    <div class="container mx-auto px-4 h-14 flex items-center justify-between">
      <NuxtLink to="/" class="flex gap-2 items-center">
        <img src="~/assets/img/2314.webp" class="h-14 w-auto" alt="2314" />
        <span class="text-white text-lg font-bold">Agenda cultural</span>
      </NuxtLink>
      <div class="flex items-center gap-6">
        <NuxtLink to="/" class="text-sm font-medium transition-colors" :class="route.path === '/' ? 'text-white underline underline-offset-4' : 'text-white/75 hover:text-white'">{{ t('nav.calendar') }}</NuxtLink>
        <NuxtLink to="/list" class="text-sm font-medium transition-colors" :class="route.path === '/list' ? 'text-white underline underline-offset-4' : 'text-white/75 hover:text-white'">{{ t('nav.list') }}</NuxtLink>
        <!-- <NuxtLink to="/submit" class="text-sm font-medium text-white/90 hover:text-white transition-colors">{{ t('nav.submit') }}</NuxtLink> -->
        <LangSwitcher />
      </div>
    </div>
  </nav>
</template>
