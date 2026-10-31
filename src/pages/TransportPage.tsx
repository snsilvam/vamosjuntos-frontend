import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../api/client'
import type { Departure, Guest, TransportResponse, Vehicle } from '../api/types'
import Screen from '../components/Screen'
import { Alert, fieldInput, primaryButton, secondaryButton, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useMe } from '../session/useMe'
import VehicleForm from './VehicleForm'

const departures: { id: Departure; label: string }[] = [
  { id: 'bogota', label: 'Sale de Bogotá' },
  { id: 'tocancipa', label: 'Sale de Tocancipá' },
]

const smallButton =
  'inline-flex min-h-11 items-center justify-center rounded-xl px-3 font-semibold text-orange-700 ring-2 ring-orange-200 transition hover:bg-orange-50 disabled:opacity-50'

// formatClock turns "06:30" into "6:30 a. m.", as Colombians read it.
function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

// TransportPage shows vehicles by departure place, free seats and who has no transport, and lets
// any confirmed guest manage vehicles and seats (spec 005).
export default function TransportPage() {
  const { me } = useMe()
  const myId = me?.status === 'confirmed' ? me.guest.id : ''
  const [data, setData] = useState<TransportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Vehicle | 'new' | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    apiFetch<TransportResponse>('/api/transport')
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(friendlyMessage(err, 'list'))
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  // run performs one change; the state always comes back from the server.
  async function run(change: () => Promise<TransportResponse | undefined>) {
    setBusy(true)
    setError(null)
    try {
      const fresh = await change()
      if (fresh) setData(fresh)
      else reload()
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
      reload()
    } finally {
      setBusy(false)
      setDeleting(null)
    }
  }

  const reserve = (vehicleId: string, guestId: string) =>
    run(() =>
      apiFetch<TransportResponse>(`/api/transport/vehicles/${encodeURIComponent(vehicleId)}/passengers`, {
        method: 'POST',
        body: { guestId },
      }),
    )
  const release = (vehicleId: string, guestId: string) =>
    run(() =>
      apiFetch<undefined>(
        `/api/transport/vehicles/${encodeURIComponent(vehicleId)}/passengers/${encodeURIComponent(guestId)}`,
        { method: 'DELETE' },
      ),
    )
  const remove = (vehicleId: string) =>
    run(() => apiFetch<undefined>(`/api/transport/vehicles/${encodeURIComponent(vehicleId)}`, { method: 'DELETE' }))

  if (editing) {
    const placedDrivers = editing === 'new' ? [] : [editing.driver]
    const drivers = [...placedDrivers, ...(data?.withoutTransport ?? [])]
    const iCanDrive = data?.withoutTransport.some((g) => g.id === myId)
    return (
      <Screen title="Transporte">
        <VehicleForm
          vehicle={editing === 'new' ? undefined : editing}
          drivers={drivers}
          defaultDriverId={iCanDrive ? myId : undefined}
          onSaved={(fresh) => {
            setData(fresh)
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      </Screen>
    )
  }

  const vehicles = data?.vehicles ?? []
  const iDrive = vehicles.some((v) => v.driver.id === myId)
  const myVehicle = vehicles.find((v) => v.passengers.some((p) => p.id === myId))

  return (
    <Screen title="Transporte" subtitle="¿Cómo llegamos a Acacías? Vehículos y cupos.">
      {error && <Alert>{error}</Alert>}

      {data === null && !error && (
        <p className="text-center text-stone-500" aria-busy="true">
          Cargando vehículos…
        </p>
      )}

      {data && (
        <section className="rounded-3xl bg-white/80 p-4 text-center shadow-sm ring-2 ring-orange-100">
          {data.withoutTransport.length === 0 ? (
            <p className="font-semibold text-emerald-700">¡Todos los confirmados tienen transporte!</p>
          ) : (
            <>
              <p className="text-lg font-bold text-rose-700">
                {data.withoutTransport.length}{' '}
                {data.withoutTransport.length === 1 ? 'confirmado sin transporte' : 'confirmados sin transporte'}
              </p>
              <p className="text-stone-600">{data.withoutTransport.map((g) => g.name).join(', ')}</p>
            </>
          )}
        </section>
      )}

      {data && vehicles.length === 0 && (
        <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-stone-600">
          Aún no hay vehículos. ¿Vas a manejar? Registra el primero.
        </p>
      )}

      {data && (
        <button type="button" className={primaryButton} disabled={busy} onClick={() => setEditing('new')}>
          Registrar vehículo
        </button>
      )}

      {departures.map((d) => {
        const group = vehicles.filter((v) => v.departure === d.id)
        if (group.length === 0) return null
        return (
          <section key={d.id} className="flex flex-col gap-3">
            <h2 className="text-lg font-extrabold text-orange-700">{d.label}</h2>
            {group.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                myId={myId}
                canReserveMe={!iDrive && myVehicle?.id !== v.id}
                moving={!!myVehicle && myVehicle.id !== v.id}
                withoutTransport={data?.withoutTransport ?? []}
                busy={busy}
                deleting={deleting === v.id}
                onReserve={(guestId) => void reserve(v.id, guestId)}
                onRelease={(guestId) => void release(v.id, guestId)}
                onEdit={() => setEditing(v)}
                onAskDelete={() => setDeleting(v.id)}
                onCancelDelete={() => setDeleting(null)}
                onDelete={() => void remove(v.id)}
              />
            ))}
          </section>
        )
      })}

      <Link to="/inicio" className={textLink}>
        Volver al inicio
      </Link>
    </Screen>
  )
}

interface VehicleCardProps {
  vehicle: Vehicle
  myId: string
  canReserveMe: boolean
  moving: boolean
  withoutTransport: Guest[]
  busy: boolean
  deleting: boolean
  onReserve: (guestId: string) => void
  onRelease: (guestId: string) => void
  onEdit: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}

function VehicleCard(props: VehicleCardProps) {
  const { vehicle: v, myId, busy } = props
  const [forGuest, setForGuest] = useState('')
  const others = props.withoutTransport.filter((g) => g.id !== myId)
  const full = v.free <= 0

  return (
    <article className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-md ring-2 ring-orange-100">
      <header>
        <h3 className="text-xl font-extrabold break-words">{v.name}</h3>
        <p className="text-stone-600">
          Maneja <strong>{v.driver.name || 'alguien que ya no está en la lista'}</strong>
          {v.departureTime && ` · sale ${formatClock(v.departureTime)}`}
        </p>
        {v.note && <p className="mt-1 text-stone-500 italic break-words">{v.note}</p>}
      </header>

      <p className={`font-bold ${full ? 'text-rose-700' : 'text-emerald-700'}`}>
        {full ? 'Sin cupos libres' : `${v.free} de ${v.seats} ${v.seats === 1 ? 'cupo libre' : 'cupos libres'}`}
      </p>

      {v.passengers.length > 0 && (
        <ul className="flex flex-col gap-2">
          {v.passengers.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-2xl bg-orange-50 px-3 py-1">
              <span className="font-semibold break-words">{p.id === myId ? `${p.name} (tú)` : p.name}</span>
              <button type="button" className={smallButton} disabled={busy} onClick={() => props.onRelease(p.id)}>
                Liberar
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && props.canReserveMe && (
        <button type="button" className={secondaryButton} disabled={busy} onClick={() => props.onReserve(myId)}>
          {props.moving ? 'Cambiarme a este vehículo' : 'Reservar mi cupo'}
        </button>
      )}

      {!full && others.length > 0 && (
        <div className="flex flex-col gap-2 min-[380px]:flex-row">
          <label className="sr-only" htmlFor={`for-${v.id}`}>
            Reservar para
          </label>
          <select id={`for-${v.id}`} className={fieldInput} value={forGuest} onChange={(e) => setForGuest(e.target.value)}>
            <option value="">Reservar para…</option>
            {others.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={smallButton}
            disabled={busy || forGuest === ''}
            onClick={() => {
              props.onReserve(forGuest)
              setForGuest('')
            }}
          >
            Reservar
          </button>
        </div>
      )}

      {props.deleting ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-rose-50 p-3 text-center">
          <p className="font-semibold text-rose-800">¿Eliminar? Sus pasajeros quedarán sin transporte.</p>
          <div className="flex justify-center gap-2">
            <button type="button" className={smallButton} disabled={busy} onClick={props.onDelete}>
              Sí, eliminar
            </button>
            <button type="button" className={smallButton} disabled={busy} onClick={props.onCancelDelete}>
              No
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <button type="button" className={smallButton} disabled={busy} onClick={props.onEdit}>
            Editar
          </button>
          <button type="button" className={smallButton} disabled={busy} onClick={props.onAskDelete}>
            Eliminar
          </button>
        </div>
      )}
    </article>
  )
}
