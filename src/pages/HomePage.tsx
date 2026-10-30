import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../api/client'
import Screen from '../components/Screen'
import { Alert, secondaryButton, textLink } from '../components/ui'
import { friendlyMessage } from '../messages'
import { useSession } from '../session/useSession'

export default function HomePage() {
  const navigate = useNavigate()
  const { guest, clear } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  async function logout() {
    setLeaving(true)
    setError(null)
    try {
      await apiFetch<void>('/api/session', { method: 'DELETE' })
      clear()
      navigate('/', { replace: true })
    } catch (err) {
      setError(friendlyMessage(err, 'list'))
      setLeaving(false)
    }
  }

  return (
    <Screen title={`¡Hola, ${guest?.name ?? ''}!`}>
      {/* Specs 003 (card "Próximo viaje") and 004 (countdown banner) fill this page. */}
      <section className="rounded-3xl border-2 border-dashed border-orange-200 bg-white/60 px-4 py-8 text-center text-stone-500">
        Muy pronto verás aquí la cuenta regresiva y los datos del paseo.
      </section>

      <Link to="/confirmar-otro" className={textLink}>
        Confirmar a otro invitado
      </Link>

      {error && <Alert>{error}</Alert>}
      <button type="button" className={secondaryButton} disabled={leaving} onClick={logout}>
        Cerrar sesión
      </button>
    </Screen>
  )
}
