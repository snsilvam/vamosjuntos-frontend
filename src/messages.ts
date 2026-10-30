import { ApiError } from './api/client'

// Where the error happened; the same code reads differently in each flow.
export type MessageContext = 'list' | 'reentry' | 'other'

const genericMessage = 'Algo salió mal. Intenta de nuevo en un momento.'

// friendlyMessage turns any error into the Spanish text of contracts/api.md. Technical details
// never reach the user (Principle V).
export function friendlyMessage(
  error: unknown,
  context: MessageContext,
  vars: { nombre?: string } = {},
): string {
  if (!(error instanceof ApiError)) return genericMessage

  switch (error.code) {
    case 'invalid_code':
      if (context === 'reentry') return 'No encontramos ese código. Revísalo e intenta de nuevo.'
      if (context === 'other') return `Ese código no corresponde a ${vars.nombre ?? 'esa persona'}.`
      return 'Ese código no coincide con tu nombre. Revísalo e intenta de nuevo.'
    case 'too_many_attempts': {
      const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 900) / 60))
      return `Demasiados intentos. Espera ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} e inténtalo otra vez.`
    }
    case 'event_not_found':
      return 'El paseo aún no está disponible. Intenta más tarde.'
    case 'guest_not_found':
      return 'No encontramos a esa persona en la lista de invitados.'
    case 'already_responded':
      return 'Esta persona ya respondió la invitación.'
    case 'already_confirmed':
      return 'Ya habías confirmado tu asistencia.'
    case 'pending_use_list':
      return 'Aún no has confirmado. Busca tu nombre en la lista.'
    default:
      return genericMessage
  }
}
