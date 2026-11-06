import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ApiError, apiFetch } from '../api/client'
import type { ConfirmOtherResponse, Guest, GuestsResponse } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, secondaryButton, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'

// Pending guests without an account, the only ones another guest may confirm (spec 009, FR-002).
const confirmablePath = '/api/guests/confirmable'

// After a 404 or 409 the list is stale: the guest left the catalog, already answered or now has
// an account. The page shows why and reloads it (FR-008).
function listIsStale(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.status === 409)
}

export default function ConfirmOtherPage() {
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [selected, setSelected] = useState<Guest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadGuests = useCallback(
    () =>
      apiFetch<GuestsResponse>(confirmablePath)
        .then((data) => setGuests(data.guests))
        .catch((err: unknown) => setError(friendlyMessage(err, 'other'))),
    [],
  )

  useEffect(() => {
    let cancelled = false
    apiFetch<GuestsResponse>(confirmablePath)
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

  // Choosing a name only asks; nothing is recorded until the answer is yes (FR-003).
  function choose(guest: Guest) {
    setSelected(guest)
    setError(null)
    setSuccess(null)
  }

  async function confirm() {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      // No body: the guest's code is no longer needed (FR-001).
      const data = await apiFetch<ConfirmOtherResponse>(
        `/api/guests/${encodeURIComponent(selected.id)}/confirmation`,
        { method: 'POST' },
      )
      // Drop the confirmed guest right away so the list never shows them as pending.
      setGuests((current) => current?.filter((g) => g.id !== data.guest.id) ?? null)
      setSuccess(`¡${data.guest.name} quedó confirmado!`)
      setSelected(null)
      await loadGuests()
    } catch (err) {
      setError(friendlyMessage(err, 'other', { nombre: selected.name }))
      if (listIsStale(err)) {
        setSelected(null)
        await loadGuests()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen
      title="Confirmar a otro invitado"
      subtitle="Para quien no usa la app, como un niño o un abuelo: toca su nombre para confirmarlo."
    >
      {success && (
        <p role="status" className="rounded-2xl bg-emerald-100 px-4 py-3 text-center font-semibold text-emerald-800">
          {success}
        </p>
      )}

      {selected ? (
        <section
          aria-labelledby="confirm-other-question"
          className="flex flex-col gap-4 rounded-3xl bg-white p-5 text-center shadow-md ring-2 ring-orange-100"
        >
          <h2 id="confirm-other-question" className="text-2xl font-extrabold break-words">
            ¿Confirmar a {selected.name}?
          </h2>
          <p className="text-stone-600">
            Quedará en la lista de confirmados del paseo. Si te equivocas, solo el organizador puede deshacerlo.
          </p>
          {error && <Alert>{error}</Alert>}
          <button type="button" className={primaryButton} disabled={submitting} onClick={() => void confirm()}>
            {submitting ? 'Confirmando…' : `Sí, confirmar a ${selected.name}`}
          </button>
          <button type="button" className={secondaryButton} disabled={submitting} onClick={() => setSelected(null)}>
            Cancelar
          </button>
        </section>
      ) : (
        <>
          {error && <Alert>{error}</Alert>}
          {guests !== null && guests.length === 0 && (
            <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-stone-600">
              No hay invitados pendientes sin cuenta. Quien ya entró con su cuenta responde desde ahí.
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
