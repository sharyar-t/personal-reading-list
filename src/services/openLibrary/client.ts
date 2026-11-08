import { LruCache } from '@/lib/lruCache'
import { createRateLimiter } from '@/lib/rateLimiter'

export const OPEN_LIBRARY_ORIGIN = 'https://openlibrary.org'

export type OpenLibraryErrorKind =
  'offline' | 'timeout' | 'rate-limited' | 'unavailable' | 'not-found' | 'invalid-response'

/** A failure we can explain to the user — never shown raw. */
export class OpenLibraryError extends Error {
  constructor(
    readonly kind: OpenLibraryErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'OpenLibraryError'
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

const REQUEST_TIMEOUT_MS = 10_000
let schedule = createRateLimiter(1000)
const cache = new LruCache<unknown>(150, 15 * 60 * 1000)

interface FetchOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * GET a JSON resource from Open Library with caching, polite rate limiting,
 * a timeout and typed errors. Aborts (user typed again) reject with AbortError.
 */
export async function fetchOpenLibrary<T>(
  path: string,
  validate: (data: unknown) => data is T,
  { signal, timeoutMs = REQUEST_TIMEOUT_MS }: FetchOptions = {},
): Promise<T> {
  const url = `${OPEN_LIBRARY_ORIGIN}${path}`
  const cached = cache.get(url)
  if (cached !== undefined) return cached as T

  await schedule(signal)

  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response: Response
  try {
    response = await fetch(url, { signal: combined, headers: { Accept: 'application/json' } })
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted) {
      throw new OpenLibraryError('timeout', 'Open Library took too long to respond')
    }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new OpenLibraryError('offline', 'You appear to be offline')
    }
    throw new OpenLibraryError('unavailable', 'Could not reach Open Library')
  }

  if (response.status === 429) {
    throw new OpenLibraryError('rate-limited', 'Too many requests to Open Library', 429)
  }
  if (response.status === 404) {
    throw new OpenLibraryError('not-found', 'Not found on Open Library', 404)
  }
  if (!response.ok) {
    throw new OpenLibraryError(
      'unavailable',
      `Open Library error ${response.status}`,
      response.status,
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new OpenLibraryError('invalid-response', 'Open Library sent an unreadable response')
  }
  if (!validate(data)) {
    throw new OpenLibraryError('invalid-response', 'Open Library sent an unexpected response')
  }

  cache.set(url, data)
  return data
}

/** Test hook: reset the cache and optionally change request spacing */
export function resetOpenLibraryClient({ minIntervalMs = 1000 } = {}) {
  cache.clear()
  schedule = createRateLimiter(minIntervalMs)
}
