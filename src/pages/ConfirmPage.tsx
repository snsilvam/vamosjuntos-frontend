import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { apiFetch } from '../api/client'
import type { RespondResponse } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, secondaryButton } from '../components/ui'
import { formatEventDate } from '../format'
import { friendlyMessage } from '../messages'
import { useOnboarding } from '../onboarding/useOnboarding'
import { useSession } from '../session/useSession'

export default function ConfirmPage() {
  const navigate = useNavigate()
  const { state, reset } = useOnboarding()
  const { setGuest } = useSession()
  const [declined, setDeclined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (declined) {
    return (
      <Screen title="¡Te vamos a extrañar!" subtitle="Si cambias de opinión, entra con tu código.">
        <button
          type="button"
          className={secondaryButton}
          onClick={() => {
            reset()
            navigate('/', { replace: true })
          }}
        >
          Volver al inicio
        </button>
      </Screen>
    )
  }

  if (!state.guest || !state.event) return <Navigate to="/" replace />
  const { guest, event, code, mode } = state

  async function respond(attending: boolean) {
    setSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<RespondResponse>('/api/onboarding/respond', {
        method: 'POST',
        body: { guestId: guest.id, code, attending },
        withDeviceId: true,
      })
      if (data.status === 'confirmed') {
        setGuest(data.guest)
        navigate('/inicio', { replace: true })
      } else {
        setDeclined(true)
      }
    } catch (err) {
      setError(friendlyMessage(err, mode))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen title="¿Confirmas tu asistencia?" subtitle={`${guest.name}, este es el plan:`}>
      <section className="rounded-3xl bg-white p-5 shadow-md ring-2 ring-orange-100">
        <h2 className="text-xl font-extrabold text-orange-700">{event.name}</h2>
        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-sm font-semibold text-stone-500">Destino</dt>
            <dd className="text-lg">{event.destination}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-stone-500">Salida desde</dt>
            <dd className="text-lg">{event.departurePlaces.join(' · ')}</dd>
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
      </section>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-col gap-3">
        <button type="button" className={primaryButton} disabled={submitting} onClick={() => respond(true)}>
          ¡Sí, voy!
        </button>
        <button type="button" className={secondaryButton} disabled={submitting} onClick={() => respond(false)}>
          No, esta vez no
        </button>
      </div>
    </Screen>
  )
}
