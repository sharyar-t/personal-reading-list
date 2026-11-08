import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectIsbn, searchBooks } from '@/services/openLibrary/api'
import { OpenLibraryError, resetOpenLibraryClient } from '@/services/openLibrary/client'

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  resetOpenLibraryClient({ minIntervalMs: 0 })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchBooks', () => {
  it('builds the query, skips malformed docs and reports pagination', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        numFound: 100,
        docs: [{ key: '/works/OL1W', title: 'Dune' }, { title: 'no key' }, { key: '/works/OL2W' }],
      }),
    )

    const page = await searchBooks('frank herbert', { scope: 'author', page: 2 })

    const url = new URL(String(fetchMock.mock.calls[0]![0]))
    expect(url.pathname).toBe('/search.json')
    expect(url.searchParams.get('author')).toBe('frank herbert')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('limit')).toBe('24')
    expect(page.results.map((r) => r.metadata.title)).toEqual(['Dune'])
    expect(page).toMatchObject({ total: 100, page: 2, hasMore: true })
  })

  it('searches by ISBN when the query looks like one', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ numFound: 0, docs: [] }))
    await searchBooks('978-0-441-01359-3')
    const url = new URL(String(fetchMock.mock.calls[0]![0]))
    expect(url.searchParams.get('isbn')).toBe('9780441013593')
    expect(url.searchParams.has('q')).toBe(false)
  })

  it('caches identical requests', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ numFound: 0, docs: [] }))
    await searchBooks('piranesi')
    await searchBooks('piranesi')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    [429, 'rate-limited'],
    [500, 'unavailable'],
    [503, 'unavailable'],
  ])('maps HTTP %i to a %s error', async (status, kind) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, status))
    await expect(searchBooks('dune')).rejects.toMatchObject({ kind })
  })

  it('rejects malformed JSON and unexpected shapes', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>oops</html>', { status: 200 }))
    await expect(searchBooks('dune')).rejects.toMatchObject({ kind: 'invalid-response' })

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'nope' }))
    await expect(searchBooks('dune 2')).rejects.toBeInstanceOf(OpenLibraryError)
  })

  it('turns network failures into a friendly error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(searchBooks('dune')).rejects.toMatchObject({ kind: 'unavailable' })
  })

  it('passes aborts through untouched', async () => {
    const controller = new AbortController()
    fetchMock.mockImplementationOnce(async () => {
      controller.abort()
      throw new DOMException('Aborted', 'AbortError')
    })
    await expect(searchBooks('dune', { signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})

describe('detectIsbn', () => {
  it('recognises ISBN-like queries only', () => {
    expect(detectIsbn('0441013597')).toBe('0441013597')
    expect(detectIsbn('978 0 441 01359 3')).toBe('9780441013593')
    expect(detectIsbn('1984')).toBeNull()
    expect(detectIsbn('dune')).toBeNull()
  })
})
