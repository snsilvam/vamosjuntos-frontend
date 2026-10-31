import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ApiError, apiFetch } from '../api/client'
import type { Activity, Itinerary } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, textLink } from '../components/ui'
import { formatClock, formatDayHeading } from '../format'
import { friendlyMessage } from '../messages'
import ActivityForm from './ActivityForm'

const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-3 font-semibold text-orange-700 ring-2 ring-orange-200 transition hover:bg-orange-50 disabled:opacity-50'

// formatHours returns "10:00 a. m. – 12:00 p. m.", or "hasta la 1:00 a. m. del día siguiente" when
// the activity crosses midnight (spec 006, edge cases).
function formatHours(a: Activity): string {
  const start = formatClock(a.startTime)
  if (!a.endTime) return start
  const end = formatClock(a.endTime)
  // "la 1:00", "las 2:00": the article follows the hour as it is read.
  const article = Number(a.endTime.slice(0, 2)) % 12 === 1 ? 'la' : 'las'
  if (a.endsNextDay) return `${start}, hasta ${article} ${end} del día siguiente`
  return `${start} – ${end}`
}

// ItineraryPage lists the activities by day and in time order, and lets any confirmed guest add,
// edit or delete them (spec 006).
export default function ItineraryPage() {
  const [data, setData] = useState<Itinerary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Activity | 'new' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    apiFetch<Itinerary>('/api/itinerary')
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar el itinerario. Intenta de nuevo en un momento.')
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  async function remove(id: string) {
    setBusy(true)
    setError(null)
    try {
      await apiFetch<undefined>(`/api/itinerary/activities/${encodeURIComponent(id)}`, { method: 'DELETE' })
    } catch (err) {
      // Someone else deleted it first: the list is reloaded either way.
      if (!(err instanceof ApiError && err.code === 'activity_not_found')) setError(friendlyMessage(err, 'list'))
    } finally {
      setBusy(false)
      setDeleting(null)
      reload()
    }
  }

  if (editing && data) {
    return (
      <Screen title="Itinerario">
        <ActivityForm
          activity={editing === 'new' ? undefined : editing}
          days={data.days}
          onSaved={(fresh) => {
            setData(fresh)
            setEditing(null)
          }}
          onCancel={() => {
            setEditing(null)
            reload()
          }}
        />
      </Screen>
    )
  }

  const activities = data?.activities ?? []
  const days = (data?.days ?? []).filter((d) => activities.some((a) => a.date === d))

  return (
    <Screen title="Itinerario" subtitle="Actividades y horarios del paseo, en hora de Colombia.">
      {error && <Alert>{error}</Alert>}

      {data === null && !error && (
        <p className="text-center text-stone-500" aria-busy="true">
          Cargando el itinerario…
        </p>
      )}

      {data && activities.length === 0 && (
        <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-stone-600">El itinerario aún no tiene actividades.</p>
      )}

      {data && (
        <button type="button" className={primaryButton} disabled={busy} onClick={() => setEditing('new')}>
          Agregar actividad
        </button>
      )}

      {days.map((day) => (
        <section key={day} className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold text-orange-700">{formatDayHeading(day)}</h2>
          {activities
            .filter((a) => a.date === day)
            .map((a) => (
              <article key={a.id} className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-md ring-2 ring-orange-100">
                <p className="font-bold text-orange-700">{formatHours(a)}</p>
                <h3 className="text-xl font-extrabold break-words">{a.title}</h3>
                {a.place && <p className="text-stone-600 break-words">📍 {a.place}</p>}
                {a.description && <p className="whitespace-pre-line text-stone-500 break-words">{a.description}</p>}

                {deleting === a.id ? (
                  <div className="flex flex-col gap-2 rounded-2xl bg-rose-50 p-3 text-center">
                    <p className="font-semibold text-rose-800">¿Eliminar esta actividad?</p>
                    <div className="flex justify-center gap-2">
                      <button type="button" className={smallButton} disabled={busy} onClick={() => void remove(a.id)}>
                        Sí, eliminar
                      </button>
                      <button type="button" className={smallButton} disabled={busy} onClick={() => setDeleting(null)}>
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button type="button" className={smallButton} disabled={busy} onClick={() => setEditing(a)}>
                      Editar
                    </button>
                    <button type="button" className={smallButton} disabled={busy} onClick={() => setDeleting(a.id)}>
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            ))}
        </section>
      ))}

      <Link to="/inicio" className={textLink}>
        Volver al inicio
      </Link>
    </Screen>
  )
}
