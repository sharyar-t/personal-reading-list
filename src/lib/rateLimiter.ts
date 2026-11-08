function abortError(signal: AbortSignal) {
  return signal.reason instanceof Error ? signal.reason : new DOMException('Aborted', 'AbortError')
}

/**
 * Spaces out calls so they start at least `intervalMs` apart — Open Library
 * asks clients to stay around 1 request per second. Waiting callers can be
 * cancelled with an AbortSignal (e.g. when the user keeps typing).
 */
export function createRateLimiter(intervalMs: number) {
  let nextSlot = 0

  return function schedule(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.reject(abortError(signal))
    const now = Date.now()
    const start = Math.max(now, nextSlot)
    nextSlot = start + intervalMs
    const wait = start - now
    if (wait <= 0) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort)
        resolve()
      }, wait)
      function onAbort() {
        clearTimeout(timer)
        // Give the slot back so a cancelled request doesn't delay the next one
        if (nextSlot === start + intervalMs) nextSlot = Math.max(Date.now(), start)
        reject(abortError(signal!))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
    })
  }
}
