import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import { onUnauthorized } from './api/client'
import { Loading } from './components/ui'
import OnboardingProvider from './onboarding/OnboardingProvider'
import CodePage from './pages/CodePage'
import ConfirmOtherPage from './pages/ConfirmOtherPage'
import ConfirmPage from './pages/ConfirmPage'
import GuestListPage from './pages/GuestListPage'
import HomePage from './pages/HomePage'
import ReentryPage from './pages/ReentryPage'
import RequireSession from './session/RequireSession'
import SessionProvider from './session/SessionProvider'
import { useSession } from './session/useSession'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <OnboardingProvider>
          <AppRoutes />
        </OnboardingProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}

function AppRoutes() {
  const navigate = useNavigate()
  const { status, clear } = useSession()

  // Any 401/403 on a protected route means the session is gone: back to onboarding (FR-008).
  useEffect(() => {
    onUnauthorized(() => {
      clear()
      navigate('/', { replace: true })
    })
    return () => onUnauthorized(undefined)
  }, [clear, navigate])

  if (status === 'loading') return <Loading />

  return (
    <Routes>
      <Route
        path="/"
        element={status === 'authenticated' ? <Navigate to="/inicio" replace /> : <GuestListPage />}
      />
      <Route path="/codigo" element={<CodePage />} />
      <Route path="/confirmar" element={<ConfirmPage />} />
      <Route path="/ya-confirme" element={<ReentryPage />} />
      <Route
        path="/inicio"
        element={
          <RequireSession>
            <HomePage />
          </RequireSession>
        }
      />
      <Route
        path="/confirmar-otro"
        element={
          <RequireSession>
            <ConfirmOtherPage />
          </RequireSession>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
