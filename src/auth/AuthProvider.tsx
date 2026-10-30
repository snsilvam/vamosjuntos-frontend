import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  watchAuth,
  type AuthUser,
} from './firebase'
import { AuthContext } from './useAuth'

interface AuthState {
  loading: boolean
  user: AuthUser | null
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ loading: true, user: null })

  useEffect(() => watchAuth((user) => setState({ loading: false, user })), [])

  const value = useMemo(
    () => ({ ...state, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signOut }),
    [state],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
