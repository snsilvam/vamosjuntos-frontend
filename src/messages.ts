import { ApiError } from './api/client'

// Where the error happened; the same code reads differently in each flow.
export type MessageContext = 'list' | 'byCode' | 'other'

const genericMessage = 'Algo salió mal. Intenta de nuevo en un momento.'

// friendlyMessage turns an API error into the Spanish text of contracts/api.md. Technical
// details never reach the user (Principle V).
export function friendlyMessage(
  error: unknown,
  context: MessageContext,
  vars: { nombre?: string } = {},
): string {
  if (!(error instanceof ApiError)) return genericMessage

  switch (error.code) {
    case 'invalid_code':
      if (context === 'byCode') return 'No encontramos ese código. Revísalo e intenta de nuevo.'
      return 'Ese código no coincide con tu nombre. Revísalo e intenta de nuevo.'
    case 'too_many_attempts': {
      const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 900) / 60))
      return `Demasiados intentos. Espera ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} e inténtalo otra vez.`
    }
    case 'account_already_linked':
      return 'Tu cuenta ya está vinculada a otro invitado.'
    case 'guest_already_linked':
      // Confirming someone else (spec 009): that guest has an account and answers for themselves.
      if (context === 'other') return `${vars.nombre ?? 'Esa persona'} ya entró con su propia cuenta y responde desde ahí.`
      return 'Esta persona ya entró con otra cuenta. Si eres tú y perdiste esa cuenta, escríbele al organizador.'
    case 'event_not_found':
      return 'El paseo aún no está disponible. Intenta más tarde.'
    case 'guest_not_found':
      return 'No encontramos a esa persona en la lista de invitados.'
    case 'already_responded':
      return 'Esta persona ya respondió la invitación.'
    case 'already_confirmed':
      return 'Ya habías confirmado tu asistencia.'
    case 'invalid_vehicle':
      return 'Revisa los datos: nombre, lugar de salida y entre 1 y 24 cupos.'
    case 'driver_unavailable':
      return 'Esa persona ya tiene lugar en otro vehículo o no ha confirmado.'
    case 'seats_below_passengers':
      return 'No puedes dejar menos cupos que pasajeros. Libera algún cupo primero.'
    case 'vehicle_full':
      return 'Este vehículo ya no tiene cupos.'
    case 'guest_is_driver':
      return 'Esa persona va manejando su propio vehículo.'
    case 'guest_not_confirmed':
      return 'Solo se puede reservar para invitados que confirmaron.'
    case 'vehicle_not_found':
      return 'Ese vehículo ya no existe. Actualiza la página.'
    case 'passenger_not_found':
      return 'Esa persona ya no va en este vehículo.'
    case 'invalid_activity':
      return 'Revisa los datos de la actividad: el título es obligatorio y los textos no pueden ser tan largos.'
    case 'activity_time_order':
      return 'La hora de fin debe ser después de la hora de inicio.'
    case 'activity_out_of_range':
      return 'La actividad debe estar dentro de los días del paseo.'
    case 'activity_not_found':
      return 'Esa actividad ya no existe. Actualizamos el itinerario.'
    case 'invalid_item':
      return 'Revisa los datos: el nombre es obligatorio y los textos no pueden ser tan largos.'
    case 'item_taken':
      return 'Este ítem ya lo lleva otra persona.'
    case 'not_responsible':
      return 'Solo quien lleva este ítem puede cambiarlo.'
    case 'item_not_found':
      return 'Ese ítem ya no existe. Actualizamos la lista.'
    case 'not_invited':
      return 'Ya no apareces en la lista de invitados. Escríbele al organizador.'
    default:
      return genericMessage
  }
}

// friendlyAuthMessage translates the errors of the Firebase SDK (codes "auth/...") into Spanish
// (FR-016). It returns null when there is nothing to show, such as a Google window the user
// closed on purpose.
export function friendlyAuthMessage(error: unknown): string | null {
  const code = (error as { code?: unknown } | null)?.code
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'El correo o la contraseña no son correctos.'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo. Entra con tu contraseña.'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e intenta otra vez.'
    case 'auth/unauthorized-domain':
      return 'Este dominio todavía no está autorizado para iniciar sesión con Google. Escríbele al organizador.'
    case 'auth/operation-not-allowed':
      return 'El inicio de sesión con Google no está habilitado. Escríbele al organizador.'
    case 'auth/invalid-api-key':
    case 'auth/invalid-app-credential':
      return 'La configuración de inicio de sesión no es válida. Escríbele al organizador.'
    case 'auth/account-exists-with-different-credential':
      return 'Ese correo ya entró con otro método. Usa el mismo con el que entraste antes.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e inténtalo otra vez.'
    case 'auth/network-request-failed':
      return 'No hay conexión. Revisa tu internet e intenta otra vez.'
    default:
      return genericMessage
  }
}
