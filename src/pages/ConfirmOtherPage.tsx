import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../api/client'
import type { ConfirmOtherResponse, Guest, GuestsResponse } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, textInput, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'

export default function ConfirmOtherPage() {
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [selected, setSelected] = useState<Guest | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadGuests = useCallback(
    () =>
      apiFetch<GuestsResponse>('/api/onboarding/guests')
        .then((data) => setGuests(data.guests))
        .catch((err: unknown) => setError(friendlyMessage(err, 'other'))),
    [],
  )

  useEffect(() => {
    let cancelled = false
    apiFetch<GuestsResponse>('/api/onboarding/guests')
      .then((data) => {
        if (!cancelled) setGuests(data.guests)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(friendlyMessage(err, 'other'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  function choose(guest: Guest) {
    setSelected(guest)
    setCode('')
    setError(null)
    setSuccess(null)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<ConfirmOtherResponse>(
        `/api/guests/${encodeURIComponent(selected.id)}/confirmation`,
        { method: 'POST', body: { code }, withDeviceId: true, protectedRoute: true },
      )
      // Drop the confirmed guest right away so the list never shows them as pending.
      setGuests((current) => current?.filter((g) => g.id !== data.guest.id) ?? null)
      setSuccess(`¡${data.guest.name} quedó confirmado!`)
      setSelected(null)
      setCode('')
      await loadGuests()
    } catch (err) {
      setError(friendlyMessage(err, 'other', { nombre: selected.name }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen
      title="Confirmar a otro invitado"
      subtitle="Para quien no usa la app: elige su nombre y escribe su código."
    >
      {success && (
        <p role="status" className="rounded-2xl bg-emerald-100 px-4 py-3 text-center font-semibold text-emerald-800">
          {success}
        </p>
      )}

      {selected ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-center text-lg">
            Código de <strong>{selected.name}</strong>
          </p>
          <label htmlFor="code" className="sr-only">
            Código de invitación de {selected.name}
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={textInput}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Su código"
            autoFocus
          />
          {error && <Alert>{error}</Alert>}
          <button type="submit" className={primaryButton} disabled={submitting || code.trim() === ''}>
            {submitting ? 'Confirmando…' : `Confirmar a ${selected.name}`}
          </button>
          <button type="button" className={textLink} onClick={() => setSelected(null)}>
            Elegir a otra persona
          </button>
        </form>
      ) : (
        <>
          {error && <Alert>{error}</Alert>}
          {guests !== null && guests.length === 0 && (
            <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-stone-600">
              No hay invitados pendientes por confirmar.
            </p>
          )}
          {guests !== null && guests.length > 0 && (
            <ul className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              {guests.map((guest) => (
                <li key={guest.id}>
                  <button
                    type="button"
                    onClick={() => choose(guest)}
                    className="min-h-14 w-full rounded-2xl bg-white px-4 py-3 text-lg font-semibold break-words shadow-sm ring-2 ring-orange-100 transition hover:ring-orange-400 active:scale-[0.98]"
                  >
                    {guest.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Link to="/inicio" className={textLink}>
        Volver al inicio
      </Link>
    </Screen>
  )
}
