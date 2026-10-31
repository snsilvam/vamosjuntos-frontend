import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { onForbidden, onUnauthenticated } from './api/client'
import AuthProvider from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { Loading } from './components/ui'
import CodePage from './pages/CodePage'
import ConfirmOtherPage from './pages/ConfirmOtherPage'
import ConfirmPage from './pages/ConfirmPage'
import ErrorPage from './pages/ErrorPage'
import GuestListPage from './pages/GuestListPage'
import HomePage from './pages/HomePage'
import ItineraryPage from './pages/ItineraryPage'
import LinkByCodePage from './pages/LinkByCodePage'
import PurchasesPage from './pages/PurchasesPage'
import SignInPage from './pages/SignInPage'
import TransportPage from './pages/TransportPage'
import MeProvider from './session/MeProvider'
import { useMe } from './session/useMe'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MeProvider>
          <AppRoutes />
        </MeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

// AppRoutes shows only the screens that the state of the account allows (FR-002, FR-010):
// protection lives in the routes, and the backend checks every request anyway.
function AppRoutes() {
  const { signOut } = useAuth()
  const { status, refresh } = useMe()

  useEffect(() => {
    // A 401 that survives a fresh token means the session is gone.
    onUnauthenticated(() => void signOut())
    // A 403 elsewhere means the link or the invitation changed: ask the backend again. /api/me
    // is excluded so its own 403 does not trigger an endless refresh.
    onForbidden((_code, path) => {
      if (path !== '/api/me') refresh()
    })
    return () => {
      onUnauthenticated(undefined)
      onForbidden(undefined)
    }
  }, [signOut, refresh])

  switch (status) {
    case 'loading':
      return <Loading />
    case 'signedOut':
      return <SignInPage />
    case 'error':
      return <ErrorPage />
    case 'pending':
    case 'declined':
      return <ConfirmPage />
    case 'unlinked':
      return (
        <Routes>
          <Route path="/" element={<GuestListPage />} />
          <Route path="/codigo" element={<CodePage />} />
          <Route path="/mi-codigo" element={<LinkByCodePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )
    case 'confirmed':
      return (
        <Routes>
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/confirmar-otro" element={<ConfirmOtherPage />} />
          <Route path="/transporte" element={<TransportPage />} />
          <Route path="/itinerario" element={<ItineraryPage />} />
          <Route path="/compras" element={<PurchasesPage />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      )
  }
}
