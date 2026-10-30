import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../api/client'
import type { Guest, GuestsResponse } from '../api/types'
import Screen from '../components/Screen'
import { Alert, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useOnboarding } from '../onboarding/useOnboarding'

export default function GuestListPage() {
  const navigate = useNavigate()
  const { update, reset } = useOnboarding()
  const [guests, setGuests] = useState<Guest[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    reset()
    let cancelled = false
    apiFetch<GuestsResponse>('/api/onboarding/guests')
      .then((data) => {
        if (!cancelled) setGuests(data.guests)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(friendlyMessage(e, 'list'))
      })
    return () => {
      cancelled = true
    }
  }, [reset])

  function choose(guest: Guest) {
    update({ guest, code: '', event: null, mode: 'list' })
    navigate('/codigo')
  }

  return (
    <Screen title="¿Quién eres?" subtitle="Busca tu nombre para unirte al paseo.">
      {error && <Alert>{error}</Alert>}

      {!error && guests === null && (
        <p className="text-center text-stone-500" aria-busy="true">
          Cargando invitados…
        </p>
      )}

      {guests !== null && guests.length === 0 && (
        <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-stone-600">
          Todos los invitados ya respondieron. Si ya confirmaste, entra con tu código.
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

      <Link to="/ya-confirme" className={textLink}>
        Ya confirmé, entrar con mi código
      </Link>
    </Screen>
  )
}
