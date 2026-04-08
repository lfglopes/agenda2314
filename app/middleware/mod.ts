export default defineNuxtRouteMiddleware(() => {
  if (import.meta.client) return
  const session = useCookie('mod_session')
  if (!session.value) {
    return navigateTo('/mod/login')
  }
})
