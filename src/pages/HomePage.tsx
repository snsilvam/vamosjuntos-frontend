import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import CountdownBanner from '../components/CountdownBanner'
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
    <Screen>
      {/* The banner is the first element and carries the greeting (spec 004, FR-001). */}
      <CountdownBanner name={name} />

      <TripCard />

      <Link to="/transporte" className={`${secondaryButton} flex items-center justify-center text-center`}>
        Transporte: vehículos y cupos
      </Link>

      <Link to="/itinerario" className={`${secondaryButton} flex items-center justify-center text-center`}>
        Itinerario: actividades y horarios
      </Link>

      <Link to="/confirmar-otro" className={textLink}>
        Confirmar a otro invitado
      </Link>

      <button type="button" className={secondaryButton} disabled={leaving} onClick={() => void logout()}>
        Cerrar sesión
      </button>
    </Screen>
  )
}
