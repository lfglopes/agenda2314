export default defineNuxtRouteMiddleware(() => {
  const session = useCookie('mod_session')
  if (!session.value) {
    return navigateTo('/mod/login')
  }
})
