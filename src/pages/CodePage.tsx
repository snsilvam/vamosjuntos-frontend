import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { apiFetch } from '../api/client'
import type { VerifyResponse } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, textInput, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useOnboarding } from '../onboarding/useOnboarding'

export default function CodePage() {
  const navigate = useNavigate()
  const { state, update } = useOnboarding()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!state.guest) return <Navigate to="/" replace />
  const guest = state.guest

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const data = await apiFetch<VerifyResponse>('/api/onboarding/verify', {
        method: 'POST',
        body: { guestId: guest.id, code },
        withDeviceId: true,
      })
      update({ code, event: data.event })
      navigate('/confirmar')
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen title={`¡Hola, ${guest.name}!`} subtitle="Escribe el código de invitación que te enviaron.">
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
          {submitting ? 'Revisando…' : 'Continuar'}
        </button>
      </form>
      <Link to="/" className={textLink}>
        No soy {guest.name}
      </Link>
    </Screen>
  )
}
