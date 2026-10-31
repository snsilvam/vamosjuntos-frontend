import { useState, type FormEvent } from 'react'
import { apiFetch } from '../api/client'
import type { Activity, ActivityInput, Itinerary } from '../api/types'
import { Alert, fieldInput, primaryButton, textLink } from '../components/ui'
import { formatDayHeading } from '../format'
import { friendlyMessage } from '../messages'

interface ActivityFormProps {
  // The activity to edit; undefined adds a new one.
  activity?: Activity
  // Valid days of the trip, from GET /api/itinerary.
  days: string[]
  onSaved: (data: Itinerary) => void
  onCancel: () => void
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// timeOrderOk mirrors the backend rule (spec 006, FR-005): without "ends next day" the end comes
// after the start; with it, the activity lasts at most 24 hours.
function timeOrderOk(start: string, end: string, nextDay: boolean): boolean {
  if (end === '') return true
  const duration = minutesOf(end) - minutesOf(start) + (nextDay ? 24 * 60 : 0)
  return duration > 0 && duration <= 24 * 60
}

// ActivityForm adds or edits an activity of the itinerary (spec 006, US2 and US3).
export default function ActivityForm({ activity, days, onSaved, onCancel }: ActivityFormProps) {
  const [title, setTitle] = useState(activity?.title ?? '')
  const [date, setDate] = useState(activity?.date ?? days[0] ?? '')
  const [startTime, setStartTime] = useState(activity?.startTime ?? '')
  const [endTime, setEndTime] = useState(activity?.endTime ?? '')
  const [endsNextDay, setEndsNextDay] = useState(activity?.endsNextDay ?? false)
  const [place, setPlace] = useState(activity?.place ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!days.includes(date)) {
      setError('La actividad debe estar dentro de los días del paseo.')
      return
    }
    if (!timeOrderOk(startTime, endTime, endsNextDay)) {
      setError('La hora de fin debe ser después de la hora de inicio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body: ActivityInput = {
        title,
        date,
        startTime,
        endTime,
        endsNextDay: endTime !== '' && endsNextDay,
        place,
        description,
      }
      const data = activity
        ? await apiFetch<Itinerary>(`/api/itinerary/activities/${encodeURIComponent(activity.id)}`, { method: 'PUT', body })
        : await apiFetch<Itinerary>('/api/itinerary/activities', { method: 'POST', body })
      onSaved(data)
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-md ring-2 ring-orange-100">
      <h2 className="text-xl font-extrabold text-orange-700">{activity ? 'Editar actividad' : 'Agregar actividad'}</h2>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Título
        <input className={fieldInput} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Piscina" required />
      </label>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Día
        <select className={fieldInput} value={date} onChange={(e) => setDate(e.target.value)} required>
          {days.map((d) => (
            <option key={d} value={d}>
              {formatDayHeading(d)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 font-semibold text-stone-600">
          Empieza
          <input className={fieldInput} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 font-semibold text-stone-600">
          Termina (opcional)
          <input className={fieldInput} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </label>
      </div>

      {endTime !== '' && (
        <label className="flex min-h-11 items-center gap-3 font-semibold text-stone-600">
          <input type="checkbox" className="size-6 accent-orange-500" checked={endsNextDay} onChange={(e) => setEndsNextDay(e.target.checked)} />
          Termina al día siguiente
        </label>
      )}

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Lugar (opcional)
        <input className={fieldInput} value={place} onChange={(e) => setPlace(e.target.value)} maxLength={80} placeholder="Hotel, piscina, salón…" />
      </label>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Descripción (opcional)
        <textarea className={fieldInput} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="Qué llevar, quién organiza…" />
      </label>

      {error && <Alert>{error}</Alert>}
      <button type="submit" className={primaryButton} disabled={saving || days.length === 0}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      <button type="button" className={textLink} onClick={onCancel}>
        Cancelar
      </button>
    </form>
  )
}
