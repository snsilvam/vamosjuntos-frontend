import { useState } from 'react'
import { apiFetch } from '../api/client'
import type { RespondResponse } from '../api/types'
import { useAuth } from '../auth/useAuth'
import Screen from '../components/Screen'
import { Alert, Loading, primaryButton, secondaryButton } from '../components/ui'
import { formatEventDate } from '../format'
import { friendlyMessage } from '../messages'
import { useMe } from '../session/useMe'

// ConfirmPage asks the linked guest whether they attend (FR-007, FR-008). A guest who said no
// gets here again when they sign in, so they can change their mind (US5).
export default function ConfirmPage() {
  const { me, setMe } = useMe()
  const { signOut } = useAuth()
  const [farewell, setFarewell] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!me || (me.status !== 'pending' && me.status !== 'declined')) return <Loading />
  const { guest, event } = me

  if (farewell) {
    return (
      <Screen title="¡Te vamos a extrañar!" subtitle="Si cambias de opinión, vuelve a entrar con tu cuenta.">
        <button type="button" className={primaryButton} onClick={() => setFarewell(false)}>
          Cambié de opinión
        </button>
        <button type="button" className={secondaryButton} onClick={() => void signOut()}>
          Cerrar sesión
        </button>
      </Screen>
    )
  }

  async function respond(attending: boolean) {
    setSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<RespondResponse>('/api/onboarding/respond', {
        method: 'POST',
        body: { attending },
      })
      if (data.status === 'confirmed') {
        setMe({ status: 'confirmed', guest: data.guest })
        return
      }
      setMe({ status: 'declined', guest: data.guest, event })
      setFarewell(true)
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
    } finally {
      setSubmitting(false)
    }
  }

  const title = me.status === 'declined' ? '¿Cambiaste de opinión?' : '¿Confirmas tu asistencia?'

  return (
    <Screen title={title} subtitle={`${guest.name}, este es el plan:`}>
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
