import { useAuth } from '../auth/useAuth'
import Screen from '../components/Screen'
import { Alert, primaryButton, secondaryButton } from '../components/ui'
import { useMe } from '../session/useMe'

// ErrorPage shows why the account cannot go on (event not available, guest no longer invited,
// network) and lets the user retry or switch accounts.
export default function ErrorPage() {
  const { errorMessage, refresh } = useMe()
  const { signOut } = useAuth()

  return (
    <Screen title="Un momento">
      <Alert>{errorMessage ?? 'Algo salió mal. Intenta de nuevo en un momento.'}</Alert>
      <button type="button" className={primaryButton} onClick={refresh}>
        Intentar de nuevo
      </button>
      <button type="button" className={secondaryButton} onClick={() => void signOut()}>
        Cerrar sesión
      </button>
    </Screen>
  )
}
