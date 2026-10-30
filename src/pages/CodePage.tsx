import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { apiFetch } from '../api/client'
import type { Guest, Me } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, textInput, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useMe } from '../session/useMe'

// CodePage links the account with the guest chosen from the list (FR-004). The code lives only
// in this form: it is never written to storage or the URL.
export default function CodePage() {
  const location = useLocation()
  const { setMe } = useMe()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const guest = (location.state as { guest?: Guest } | null)?.guest
  if (!guest) return <Navigate to="/" replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!guest) return
    setSubmitting(true)
    setError(null)
    try {
      setMe(await apiFetch<Me>('/api/onboarding/link', { method: 'POST', body: { guestId: guest.id, code } }))
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
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
