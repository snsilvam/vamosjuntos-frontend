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

// GET /api/countdown, described in specs/004-banner-cuenta-regresiva/contracts/api.md.
export type CountdownPhase = 'far' | 'near' | 'lastWeek' | 'tomorrow' | 'today' | 'ongoing' | 'finished'

export interface Countdown {
  phase: CountdownPhase
  daysLeft: number
  // Absent once the trip is over: nothing changes again.
  secondsToNextChange?: number
  // Relative to the backend clock; absent once the trip has started.
  secondsToStart?: number
}

// GET /api/event, described in specs/003-card-proximo-viaje/contracts/api.md: only counts.
export interface AttendanceSummary {
  invited: number
  confirmed: number
  declined: number
  pending: number
}

export interface EventResponse {
  event: EventSummary
  attendance: AttendanceSummary
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

// Transport module (specs/005-modulo-transporte/contracts/api.md).

export type Departure = 'bogota' | 'tocancipa'

export interface Vehicle {
  id: string
  name: string
  driver: Guest
  departure: Departure
  seats: number
  free: number
  passengers: Guest[]
  departureTime?: string
  note?: string
}

export interface TransportResponse {
  vehicles: Vehicle[]
  withoutTransport: Guest[]
  confirmed: Guest[]
}

export interface VehicleInput {
  name: string
  driverId: string
  departure: Departure
  seats: number
  departureTime: string
  note: string
}

// Itinerary module (specs/006-modulo-itinerario/contracts/api.md). Day and times are Colombia
// wall-clock text.

export interface ActivityInput {
  title: string
  date: string
  startTime: string
  endTime: string
  endsNextDay: boolean
  place: string
  description: string
}

export interface Activity {
  id: string
  title: string
  date: string
  startTime: string
  endTime?: string
  endsNextDay?: boolean
  place?: string
  description?: string
}

export interface Itinerary {
  days: string[]
  activities: Activity[]
}
