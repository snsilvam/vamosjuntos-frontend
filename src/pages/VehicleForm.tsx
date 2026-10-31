import { useState, type FormEvent } from 'react'
import { apiFetch } from '../api/client'
import type { Departure, Guest, TransportResponse, Vehicle } from '../api/types'
import { Alert, fieldInput, primaryButton, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'

interface VehicleFormProps {
  // The vehicle to edit; undefined registers a new one.
  vehicle?: Vehicle
  // Guests who can drive: confirmed without a place, plus the current driver when editing.
  drivers: Guest[]
  defaultDriverId?: string
  onSaved: (data: TransportResponse) => void
  onCancel: () => void
}

// VehicleForm registers or edits a vehicle (spec 005, US2 and US4).
export default function VehicleForm({ vehicle, drivers, defaultDriverId, onSaved, onCancel }: VehicleFormProps) {
  const [name, setName] = useState(vehicle?.name ?? '')
  const [driverId, setDriverId] = useState(vehicle?.driver.id ?? defaultDriverId ?? drivers[0]?.id ?? '')
  const [departure, setDeparture] = useState<Departure>(vehicle?.departure ?? 'bogota')
  const [seats, setSeats] = useState(String(vehicle?.seats ?? 4))
  const [departureTime, setDepartureTime] = useState(vehicle?.departureTime ?? '')
  const [note, setNote] = useState(vehicle?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = { name, driverId, departure, seats: Number(seats), departureTime, note }
      const data = vehicle
        ? await apiFetch<TransportResponse>(`/api/transport/vehicles/${encodeURIComponent(vehicle.id)}`, { method: 'PUT', body })
        : await apiFetch<TransportResponse>('/api/transport/vehicles', { method: 'POST', body })
      onSaved(data)
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-md ring-2 ring-orange-100">
      <h2 className="text-xl font-extrabold text-orange-700">{vehicle ? 'Editar vehículo' : 'Registrar vehículo'}</h2>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Nombre
        <input className={fieldInput} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="La camioneta de Orlando" required />
      </label>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Conductor
        <select className={fieldInput} value={driverId} onChange={(e) => setDriverId(e.target.value)} required>
          {drivers.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className="font-semibold text-stone-600">Sale de</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['bogota', 'tocancipa'] as const).map((d) => (
            <label key={d} className={`flex min-h-12 items-center justify-center rounded-2xl border-2 font-semibold ${departure === d ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-orange-200 bg-white'}`}>
              <input type="radio" name="departure" value={d} checked={departure === d} onChange={() => setDeparture(d)} className="sr-only" />
              {d === 'bogota' ? 'Bogotá' : 'Tocancipá'}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Cupos para pasajeros (sin contar al conductor)
        <input className={fieldInput} type="number" inputMode="numeric" min={1} max={24} value={seats} onChange={(e) => setSeats(e.target.value)} required />
      </label>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Hora estimada de salida (opcional)
        <input className={fieldInput} type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1 font-semibold text-stone-600">
        Nota (opcional)
        <textarea className={fieldInput} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2} placeholder="Punto de encuentro, espacio para maletas…" />
      </label>

      {error && <Alert>{error}</Alert>}
      <button type="submit" className={primaryButton} disabled={saving || drivers.length === 0}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
      <button type="button" className={textLink} onClick={onCancel}>
        Cancelar
      </button>
    </form>
  )
}
