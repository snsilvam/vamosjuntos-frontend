import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import Screen from '../components/Screen'
import { Alert, fieldInput, primaryButton, secondaryButton, textLink } from '../components/ui'
import { friendlyAuthMessage } from '../messages'

type Mode = 'signin' | 'signup' | 'reset'

// SignInPage is the only screen without a session: Google, email and password, account creation
// and password reset (FR-001, FR-002).
export default function SignInPage() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
    } catch (err) {
      setError(friendlyAuthMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'reset') {
      void run(async () => {
        await auth.resetPassword(email)
        setNotice('Te enviamos un correo para cambiar tu contraseña. Revisa también la carpeta de spam.')
      })
      return
    }
    void run(() => (mode === 'signup' ? auth.signUpWithEmail(email, password) : auth.signInWithEmail(email, password)))
  }

  const titles: Record<Mode, string> = {
    signin: 'Entra para unirte al paseo.',
    signup: 'Crea tu cuenta con tu correo.',
    reset: 'Te enviaremos un correo para cambiar tu contraseña.',
  }

  return (
    <Screen title="¡Bienvenido!" subtitle={titles[mode]}>
      {mode !== 'reset' && (
        <>
          <button type="button" className={primaryButton} disabled={busy} onClick={() => void run(auth.signInWithGoogle)}>
            Entrar con Google
          </button>
          <p className="text-center text-sm font-semibold text-stone-500">o con tu correo</p>
        </>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="email" className="sr-only">
          Correo
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldInput}
          autoComplete="email"
          placeholder="Tu correo"
          required
        />
        {mode !== 'reset' && (
          <>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldInput}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={mode === 'signup' ? 'Crea una contraseña (6 o más caracteres)' : 'Tu contraseña'}
              minLength={6}
              required
            />
          </>
        )}
        {error && <Alert>{error}</Alert>}
        {notice && (
          <p role="status" className="rounded-2xl bg-emerald-100 px-4 py-3 text-center text-emerald-800">
            {notice}
          </p>
        )}
        <button type="submit" className={mode === 'reset' ? primaryButton : secondaryButton} disabled={busy}>
          {mode === 'signin' && 'Entrar con mi correo'}
          {mode === 'signup' && 'Crear mi cuenta'}
          {mode === 'reset' && 'Enviar correo'}
        </button>
      </form>

      <div className="flex flex-col items-center">
        {mode === 'signin' && (
          <>
            <button type="button" className={textLink} onClick={() => switchMode('signup')}>
              No tengo cuenta, crear una
            </button>
            <button type="button" className={textLink} onClick={() => switchMode('reset')}>
              Olvidé mi contraseña
            </button>
          </>
        )}
        {mode !== 'signin' && (
          <button type="button" className={textLink} onClick={() => switchMode('signin')}>
            Ya tengo cuenta, entrar
          </button>
        )}
      </div>
    </Screen>
  )
}
