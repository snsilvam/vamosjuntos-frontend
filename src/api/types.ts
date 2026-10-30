// Shapes of the API described in specs/008-autenticacion-firebase/contracts/api.md.

export interface Guest {
  id: string
  name: string
}

export interface EventSummary {
  name: string
  startsAt: string
  endsAt: string
  destination: string
  departurePlaces: string[]
}

// Me is the state of the signed-in account (GET /api/me and POST /api/onboarding/link).
export type Me =
  | { status: 'unlinked' }
  | { status: 'pending' | 'declined'; guest: Guest; event: EventSummary }
  | { status: 'confirmed'; guest: Guest }

export interface GuestsResponse {
  guests: Guest[]
}

export interface RespondResponse {
  status: 'confirmed' | 'declined'
  guest: Guest
}

export interface ConfirmOtherResponse {
  status: 'confirmed'
  guest: Guest
}
