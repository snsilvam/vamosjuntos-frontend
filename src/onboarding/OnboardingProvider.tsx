import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { emptyOnboarding, OnboardingContext, type OnboardingState } from './useOnboarding'

export default function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(emptyOnboarding)

  const update = useCallback(
    (changes: Partial<OnboardingState>) => setState((current) => ({ ...current, ...changes })),
    [],
  )
  const reset = useCallback(() => setState(emptyOnboarding), [])

  const value = useMemo(() => ({ state, update, reset }), [state, update, reset])

  return <OnboardingContext value={value}>{children}</OnboardingContext>
}
