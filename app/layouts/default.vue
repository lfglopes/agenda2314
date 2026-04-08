<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <AppNav />
      <main class="flex-1">
        <slot />
      </main>
      <footer class="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-muted">
        © 2314
      </footer>
    </div>
  </UApp>
</template>
