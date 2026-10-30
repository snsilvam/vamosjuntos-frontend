import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Loading } from '../components/ui'
import { useSession } from './useSession'

// RequireSession shows its children only to a guest with an active session (FR-008).
export default function RequireSession({ children }: { children: ReactNode }) {
  const { status } = useSession()
  if (status === 'loading') return <Loading />
  if (status === 'anonymous') return <Navigate to="/" replace />
  return children
}
