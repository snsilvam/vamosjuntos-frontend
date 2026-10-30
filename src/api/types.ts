// Shapes of the API described in specs/001-onboarding-sesion/contracts/api.md.

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

export interface GuestsResponse {
  guests: Guest[]
}

export interface VerifyResponse {
  event: EventSummary
}

export type RespondResponse =
  | { status: 'confirmed'; guest: Guest }
  | { status: 'declined' }

export type ReentryResponse =
  | { status: 'confirmed'; guest: Guest }
  | { status: 'declined'; guest: Guest; event: EventSummary }

export interface ConfirmOtherResponse {
  status: 'confirmed'
  guest: Guest
}

export interface SessionResponse {
  guest: Guest
}
