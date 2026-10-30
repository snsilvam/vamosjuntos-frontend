// Event dates are always shown in Colombia time, whatever the device's time zone.
const eventDateFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export function formatEventDate(iso: string): string {
  return eventDateFormat.format(new Date(iso))
}
