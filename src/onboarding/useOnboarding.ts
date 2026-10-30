import { createContext, useContext } from 'react'
import type { EventSummary, Guest } from '../api/types'
import type { MessageContext } from '../messages'

// OnboardingState carries data between the onboarding steps. It lives only in memory: the
// code is never written to localStorage or the URL.
export interface OnboardingState {
  guest: Guest | null
  code: string
  event: EventSummary | null
  // Where the guest came from, to pick the right error messages.
  mode: Extract<MessageContext, 'list' | 'reentry'>
}

export const emptyOnboarding: OnboardingState = { guest: null, code: '', event: null, mode: 'list' }

export interface OnboardingContextValue {
  state: OnboardingState
  update: (changes: Partial<OnboardingState>) => void
  reset: () => void
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext)
  if (!value) throw new Error('useOnboarding must be used inside OnboardingProvider')
  return value
}
