const cache = new Map<string, { data: unknown; expiry: number }>()

export function clearCache(key: string) {
  cache.delete(key)
}

export function getCached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const entry = cache.get(key)
  if (entry && entry.expiry > now) {
    return Promise.resolve(entry.data as T)
  }
  return fn().then((data) => {
    cache.set(key, { data, expiry: now + ttlMs })
    return data
  }).catch((err) => {
    // Return stale data if available, otherwise rethrow
    if (entry) return entry.data as T
    throw err
  })
}
