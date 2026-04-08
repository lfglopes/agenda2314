export function useEvents(params?: Ref<{ from?: string; to?: string }>) {
  return useFetch('/api/events', {
    query: params,
    watch: params ? [params] : undefined,
  })
}
