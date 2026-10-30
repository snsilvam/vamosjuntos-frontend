import { createContext, useContext } from 'react'
import type { Guest } from '../api/types'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

export interface SessionContextValue {
  status: SessionStatus
  guest: Guest | null
  setGuest: (guest: Guest) => void
  clear: () => void
  refresh: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}
