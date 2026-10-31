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

// formatClock turns "06:30" into "6:30 a. m.", as Colombians read it. The text is already Colombia
// time, so nothing is converted.
export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

// A calendar day is read at noon UTC so no device time zone can move it (spec 006, research R6).
const weekdayFormat = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', weekday: 'long' })
const monthFormat = new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', month: 'long' })

// formatDayHeading turns "2026-12-23" into "Miércoles 23 de diciembre".
export function formatDayHeading(date: string): string {
  const noon = new Date(`${date}T12:00:00Z`)
  const weekday = weekdayFormat.format(noon)
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${Number(date.slice(8, 10))} de ${monthFormat.format(noon)}`
}
