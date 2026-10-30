const storageKey = 'vj.deviceId'

let memoryId: string | undefined

// getDeviceId identifies this device for the failed-attempts limit. It falls back to an
// in-memory id when localStorage is not available (private mode, blocked storage).
export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) return stored
    const id = crypto.randomUUID()
    localStorage.setItem(storageKey, id)
    return id
  } catch {
    memoryId ??= crypto.randomUUID()
    return memoryId
  }
}
