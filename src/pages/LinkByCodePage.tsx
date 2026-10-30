import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../api/client'
import type { Me } from '../api/types'
import Screen from '../components/Screen'
import { Alert, primaryButton, textInput, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useMe } from '../session/useMe'

// LinkByCodePage links the account using only the code, for guests who are no longer in the
// pending list because someone else confirmed them (US4).
export default function LinkByCodePage() {
  const { setMe } = useMe()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      setMe(await apiFetch<Me>('/api/onboarding/link', { method: 'POST', body: { code } }))
    } catch (err) {
      setError(friendlyMessage(err, 'byCode'))
      setSubmitting(false)
    }
  }

  return (
    <Screen title="Entrar con mi código" subtitle="Si alguien ya te confirmó, escribe tu código de invitación.">
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
