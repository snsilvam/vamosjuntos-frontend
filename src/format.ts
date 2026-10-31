import type { AttendanceSummary } from './api/types'

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

// formatEventDate returns "miércoles 23 de diciembre de 2026, 2:00 p. m.": Intl puts a comma after
// the weekday, which the spec does not (spec 003, research R3).
export function formatEventDate(iso: string): string {
  let afterWeekday = false
  return eventDateFormat
    .formatToParts(new Date(iso))
    .map((part) => {
      const value = afterWeekday && part.type === 'literal' ? ' ' : part.value
      afterWeekday = part.type === 'weekday'
      return value
    })
    .join('')
}

function count(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

// formatAttendance returns "22 invitados · 5 confirmados · 2 no asistirán · 15 pendientes", in
// singular when a number is 1 (spec 003, research R5).
export function formatAttendance(a: AttendanceSummary): string {
  return [
    count(a.invited, 'invitado', 'invitados'),
    count(a.confirmed, 'confirmado', 'confirmados'),
    count(a.declined, 'no asistirá', 'no asistirán'),
    count(a.pending, 'pendiente', 'pendientes'),
  ].join(' · ')
}
