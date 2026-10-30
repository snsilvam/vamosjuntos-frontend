import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '../api/client'
import type { Me } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { friendlyMessage } from '../messages'
import { MeContext, type MeStatus } from './useMe'

// Loaded remembers which account the answer belongs to, so a new sign-in never shows the state
// of the previous one.
interface Loaded {
  uid: string
  me: Me | null
  error: string | null
}

// MeProvider asks the backend where the signed-in account belongs (FR-003, FR-007, FR-009).
export default function MeProvider({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    apiFetch<Me>('/api/me')
      .then((me) => {
        if (!cancelled) setLoaded({ uid: user.uid, me, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ uid: user.uid, me: null, error: friendlyMessage(err, 'list') })
      })
    return () => {
      cancelled = true
    }
  }, [user, version])

  const uid = user?.uid
  const setMe = useCallback((me: Me) => {
    if (uid) setLoaded({ uid, me, error: null })
  }, [uid])
  const refresh = useCallback(() => setVersion((v) => v + 1), [])

  const value = useMemo(() => {
    let status: MeStatus
    if (loading) status = 'loading'
    else if (!user) status = 'signedOut'
    else if (!loaded || loaded.uid !== user.uid) status = 'loading'
    else if (loaded.error || !loaded.me) status = 'error'
    else status = loaded.me.status

    const current = user && loaded?.uid === user.uid ? loaded : null
    return {
      status,
      me: current?.me ?? null,
      errorMessage: current?.error ?? null,
      setMe,
      refresh,
    }
  }, [loading, user, loaded, setMe, refresh])

  return <MeContext value={value}>{children}</MeContext>
}
