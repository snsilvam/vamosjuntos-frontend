import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import Screen from '../components/Screen'
import TripCard from '../components/TripCard'
import { secondaryButton, textLink } from '../components/ui'
import { useMe } from '../session/useMe'

export default function HomePage() {
  const navigate = useNavigate()
  const { me } = useMe()
  const { signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const name = me?.status === 'confirmed' ? me.guest.name : ''

  // Signing out is the SDK's job (US7); with no user the app shows the sign-in screen.
  async function logout() {
    setLeaving(true)
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <Screen title={`¡Hola, ${name}!`}>
      {/* Spec 004 (countdown banner) takes this place: it must be the first element. */}
      <section className="rounded-3xl border-2 border-dashed border-orange-200 bg-white/60 px-4 py-8 text-center text-stone-500">
        Muy pronto verás aquí la cuenta regresiva.
      </section>

      <TripCard />

      <Link to="/confirmar-otro" className={textLink}>
        Confirmar a otro invitado
      </Link>

      <button type="button" className={secondaryButton} disabled={leaving} onClick={() => void logout()}>
        Cerrar sesión
      </button>
    </Screen>
  )
}
