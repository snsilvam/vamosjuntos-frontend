import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'

// The only file that knows the Firebase SDK, as in kaizen-app. The rest of the app works through
// AuthProvider / useAuth.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

// Fail early with a clear message instead of an opaque SDK error.
if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
  throw new Error('Falta configurar las variables VITE_FIREBASE_* (ver .env.example)')
}

const auth = getAuth(initializeApp(config))
const google = new GoogleAuthProvider()

export interface AuthUser {
  uid: string
  email: string | null
}

// watchAuth listens to sign-in, sign-out and the session restored on load. It returns the
// function that stops listening.
export function watchAuth(onChange: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => onChange(user ? { uid: user.uid, email: user.email } : null))
}

export function signInWithGoogle(): Promise<void> {
  return signInWithPopup(auth, google).then(() => undefined)
}

export function signInWithEmail(email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(auth, email.trim(), password).then(() => undefined)
}

export function signUpWithEmail(email: string, password: string): Promise<void> {
  return createUserWithEmailAndPassword(auth, email.trim(), password).then(() => undefined)
}

export function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email.trim())
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth)
}

// getIdToken returns the ID token of the signed-in user, refreshed by the SDK when it is about to
// expire, or null without a session. forceRefresh asks Firebase for a new one.
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  return (await auth.currentUser?.getIdToken(forceRefresh)) ?? null
}
