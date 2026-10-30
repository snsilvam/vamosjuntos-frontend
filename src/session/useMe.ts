import { createContext, useContext } from 'react'
import type { Me } from '../api/types'

// MeStatus is where the app should be: the account states of GET /api/me plus the moments
// before knowing them.
export type MeStatus = 'loading' | 'signedOut' | 'error' | Me['status']

export interface MeContextValue {
  status: MeStatus
  me: Me | null
  // Friendly message when status is "error" (for example, a guest no longer invited).
  errorMessage: string | null
  setMe: (me: Me) => void
  refresh: () => void
}

export const MeContext = createContext<MeContextValue | null>(null)

export function useMe(): MeContextValue {
  const value = useContext(MeContext)
  if (!value) throw new Error('useMe must be used inside MeProvider')
  return value
}
