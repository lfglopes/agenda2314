<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <AppNav />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
  </UApp>
</template>
