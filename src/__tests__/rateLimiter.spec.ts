import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRateLimiter } from '@/lib/rateLimiter'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('createRateLimiter', () => {
  it('spaces calls at least the interval apart', async () => {
    const schedule = createRateLimiter(1000)
    const started: number[] = []
    const t0 = Date.now()
    const calls = [1, 2, 3].map(() => schedule().then(() => started.push(Date.now() - t0)))
    await vi.advanceTimersByTimeAsync(2500)
    await Promise.all(calls)
    expect(started).toEqual([0, 1000, 2000])
  })

  it('lets a cancelled caller give up its slot', async () => {
    const schedule = createRateLimiter(1000)
    await schedule()
    const controller = new AbortController()
    const waiting = schedule(controller.signal)
    controller.abort()
    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' })

    let resolvedAt = -1
    const t0 = Date.now()
    const next = schedule().then(() => (resolvedAt = Date.now() - t0))
    await vi.advanceTimersByTimeAsync(1000)
    await next
    expect(resolvedAt).toBeLessThanOrEqual(1000)
  })
})
