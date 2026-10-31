import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type { EventResponse } from '../api/types'
import { formatAttendance, formatEventDate } from '../format'

type CardState = { kind: 'loading' } | { kind: 'ready'; data: EventResponse } | { kind: 'unavailable' }

const cardClass = 'rounded-3xl bg-white p-5 shadow-md ring-2 ring-orange-100'

// TripCard is the "Próximo viaje" card of the home page (spec 003). Any failure shows one
// friendly message inside the card (FR-006); a 403 is still handled by the API client, which asks
// /api/me again. The counts are as of loading; reloading updates them (FR-005).
export default function TripCard() {
  const [state, setState] = useState<CardState>({ kind: 'loading' })

  useEffect(() => {
    let active = true
    apiFetch<EventResponse>('/api/event')
      .then((data) => {
        if (active) setState({ kind: 'ready', data })
      })
      .catch(() => {
        if (active) setState({ kind: 'unavailable' })
      })
    return () => {
      active = false
    }
  }, [])

  if (state.kind === 'loading') {
    return (
      <section className={cardClass} aria-busy="true">
        <p className="text-center text-stone-500">Cargando los datos del viaje…</p>
      </section>
    )
  }

  if (state.kind === 'unavailable') {
    return (
      <section className={cardClass}>
        <p className="text-center text-stone-600">La información del viaje no está disponible por ahora.</p>
      </section>
    )
  }

  const { event, attendance } = state.data
  return (
    <section className={cardClass} aria-labelledby="trip-card-title">
      <p className="text-sm font-semibold tracking-widest text-orange-600 uppercase">Próximo viaje</p>
      <h2 id="trip-card-title" className="mt-1 text-xl font-extrabold text-balance text-orange-700">
        {event.name}
      </h2>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-sm font-semibold text-stone-500">Salida desde</dt>
          <dd className="text-lg">{event.departurePlaces.join(' · ')}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-stone-500">Destino</dt>
          <dd className="text-lg">{event.destination}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-stone-500">Inicio</dt>
          <dd className="text-lg first-letter:uppercase">{formatEventDate(event.startsAt)}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-stone-500">Fin</dt>
          <dd className="text-lg first-letter:uppercase">{formatEventDate(event.endsAt)}</dd>
        </div>
      </dl>
      <p className="mt-4 border-t border-orange-100 pt-4 font-semibold text-stone-700">
        {formatAttendance(attendance)}
      </p>
    </section>
  )
}
