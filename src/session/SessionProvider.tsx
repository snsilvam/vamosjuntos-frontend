import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '../api/client'
import type { Guest, SessionResponse } from '../api/types'
import { SessionContext, type SessionStatus } from './useSession'

interface SessionState {
  status: SessionStatus
  guest: Guest | null
}

async function fetchSession(): Promise<SessionState> {
  try {
    const data = await apiFetch<SessionResponse>('/api/session')
    return { status: 'authenticated', guest: data.guest }
  } catch {
    return { status: 'anonymous', guest: null }
  }
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading', guest: null })

  const refresh = useCallback(async () => setState(await fetchSession()), [])

  useEffect(() => {
    let cancelled = false
    fetchSession().then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setGuest = useCallback((guest: Guest) => setState({ status: 'authenticated', guest }), [])
  const clear = useCallback(() => setState({ status: 'anonymous', guest: null }), [])

  const value = useMemo(
    () => ({ ...state, setGuest, clear, refresh }),
    [state, setGuest, clear, refresh],
  )

  return <SessionContext value={value}>{children}</SessionContext>
}
