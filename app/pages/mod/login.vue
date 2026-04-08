<script setup lang="ts">
definePageMeta({ layout: 'fullpage', middleware: [] })
useHead({ title: 'Moderação — Entrar' })

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/mod/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await navigateTo('/mod')
  }
  catch {
    error.value = 'Email ou palavra-passe incorretos'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-lg font-semibold">Moderação</h1>
      </template>

      <form class="space-y-4" @submit.prevent="login">
        <UFormField label="Email">
          <UInput v-model="email" type="email" autocomplete="email" required class="w-full" />
        </UFormField>

        <UFormField label="Palavra-passe">
          <UInput v-model="password" type="password" autocomplete="current-password" required class="w-full" />
        </UFormField>

        <UAlert v-if="error" color="error" variant="soft" :description="error" />

        <UButton type="submit" :loading="loading" block>
          Entrar
        </UButton>
      </form>
    </UCard>
  </div>
</template>
