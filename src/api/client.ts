import { getIdToken } from '../auth/firebase'

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
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

interface ErrorPayload {
  error?: { code?: string; retryAfterSeconds?: number }
}

// Handlers the app registers once: a 401 means the Firebase session is gone; a 403 means the
// account is not linked, or its guest is no longer invited or confirmed.
let unauthenticatedHandler: (() => void) | undefined
let forbiddenHandler: ((code: string, path: string) => void) | undefined

export function onUnauthenticated(handler: (() => void) | undefined) {
  unauthenticatedHandler = handler
}

export function onForbidden(handler: ((code: string, path: string) => void) | undefined) {
  forbiddenHandler = handler
}

async function send(path: string, options: RequestOptions, forceRefresh: boolean): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = await getIdToken(forceRefresh)
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(0, 'network')
  }
}

// apiFetch calls the API with the Firebase ID token in Authorization. On a 401 it retries once
// with a fresh token before giving up on the session.
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, false)
  if (response.status === 401) response = await send(path, options, true)

  const data: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const detail = (data as ErrorPayload | undefined)?.error
    const code = detail?.code ?? 'unknown'
    if (response.status === 401) unauthenticatedHandler?.()
    if (response.status === 403) forbiddenHandler?.(code, path)
    throw new ApiError(response.status, code, detail?.retryAfterSeconds)
  }
  return data as T
}
