import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../api/client'
import type { ReentryResponse } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, textInput, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useOnboarding } from '../onboarding/useOnboarding'
import { useSession } from '../session/useSession'

export default function ReentryPage() {
  const navigate = useNavigate()
  const { update } = useOnboarding()
  const { setGuest } = useSession()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<ReentryResponse>('/api/session/reentry', {
        method: 'POST',
        body: { code },
        withDeviceId: true,
      })
      if (data.status === 'confirmed') {
        setGuest(data.guest)
        navigate('/inicio', { replace: true })
        return
      }
      // A guest who said "No" can change their mind: ask again (FR-011).
      update({ guest: data.guest, code, event: data.event, mode: 'reentry' })
      navigate('/confirmar')
    } catch (err) {
      setError(friendlyMessage(err, 'reentry'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen title="¡Qué bueno verte!" subtitle="Escribe tu código de invitación para entrar.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label htmlFor="code" className="sr-only">
          Código de invitación
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
          placeholder="Tu código"
          autoFocus
        />
        {error && <Alert>{error}</Alert>}
        <button type="submit" className={primaryButton} disabled={submitting || code.trim() === ''}>
          {submitting ? 'Revisando…' : 'Entrar'}
        </button>
      </form>
      <Link to="/" className={textLink}>
        Volver a la lista
      </Link>
    </Screen>
  )
}
