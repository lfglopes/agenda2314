<script setup lang="ts">
const { t } = useI18n()

const reqUrl = useRequestURL()
const feedUrl = computed(() => `${reqUrl.origin}/api/calendar.ics`)
const webcalUrl = computed(() => feedUrl.value.replace(/^https?/, 'webcal'))

const copied = ref(false)

async function copyLink() {
  await navigator.clipboard.writeText(feedUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

const items = computed(() => [[
  {
    label: t('calendar.subscribeGoogle'),
    icon: 'i-lucide-calendar',
    class: 'cursor-pointer',
    onSelect: () => window.open(`https://calendar.google.com/calendar/r?cid=${webcalUrl.value}`, '_blank'),
  },
  {
    label: t('calendar.subscribeApple'),
    icon: 'i-lucide-calendar',
    class: 'cursor-pointer',
    onSelect: () => { window.location.href = webcalUrl.value },
  },
  {
    label: t('calendar.subscribeOutlook'),
    icon: 'i-lucide-calendar',
    class: 'cursor-pointer',
    onSelect: () => window.open(`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl.value)}`, '_blank'),
  },
  {
    label: copied.value ? t('calendar.linkCopied') : t('calendar.copyLink'),
    icon: copied.value ? 'i-lucide-check' : 'i-lucide-copy',
    class: 'cursor-pointer',
    onSelect: copyLink,
  },
]])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton icon="i-lucide-rss" variant="ghost" size="sm" class="cursor-pointer text-white/75 hover:text-white hover:bg-white/10 text-sm font-medium">
      {{ $t('calendar.subscribe') }}
    </UButton>
  </UDropdownMenu>
</template>
