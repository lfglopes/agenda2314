export function useFormatDate() {
  const { locale } = useI18n()

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  }

  function formatDateRange(start: string, end: string) {
    return `${formatDate(start)} – ${formatDate(end)}`
  }

  return { formatDate, formatDateRange }
}
