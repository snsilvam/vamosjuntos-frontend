import { getDeviceId } from './deviceId'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly retryAfterSeconds?: number

  constructor(status: number, code: string, retryAfterSeconds?: number) {
    super(code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  // Sends X-Device-Id; required by every operation that receives a code.
  withDeviceId?: boolean
  // A 401/403 on a protected route means the session is gone: the app returns to onboarding.
  protectedRoute?: boolean
}

interface ErrorPayload {
  error?: { code?: string; retryAfterSeconds?: number }
}

let unauthorizedHandler: (() => void) | undefined

export function onUnauthorized(handler: (() => void) | undefined) {
  unauthorizedHandler = handler
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.withDeviceId) headers['X-Device-Id'] = getDeviceId()

  let response: Response
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'same-origin',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(0, 'network')
  }

  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const detail = (data as ErrorPayload | undefined)?.error
    if (options.protectedRoute && (response.status === 401 || response.status === 403)) {
      unauthorizedHandler?.()
    }
    throw new ApiError(response.status, detail?.code ?? 'unknown', detail?.retryAfterSeconds)
  }
  return data as T
}
