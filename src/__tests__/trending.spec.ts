import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetOpenLibraryClient } from '@/services/openLibrary/client'
import { fetchTrending } from '@/services/openLibrary/trending'

const work = (key: string, title: string, extra = {}) => ({
  key,
  title,
  author_name: ['Someone'],
  cover_i: 123,
  first_publish_year: 2020,
  edition_count: 4,
  ...extra,
})

beforeEach(() => resetOpenLibraryClient({ minIntervalMs: 0 }))
afterEach(() => vi.unstubAllGlobals())

function stubFetch(body: unknown, ok = true) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('fetchTrending', () => {
  it('requests the chosen period and maps works to results', async () => {
    const fetchMock = stubFetch({ works: [work('/works/OL1W', 'Atomic Habits: Tiny Changes')] })
    const [result] = await fetchTrending('weekly')
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/trending/weekly.json?limit=24')
    expect(result!.metadata).toMatchObject({
      title: 'Atomic Habits',
      workKey: '/works/OL1W',
      authors: ['Someone'],
      publishYear: 2020,
    })
    expect(result!.metadata.coverUrl).toContain('123')
  })

  it('skips malformed and repeated works instead of failing', async () => {
    stubFetch({
      works: [work('/works/OL2W', 'Dune'), { title: 'No key' }, work('/works/OL2W', 'Dune'), null],
    })
    const results = await fetchTrending('daily')
    expect(results.map((r) => r.metadata.title)).toEqual(['Dune'])
  })

  it('rejects an unexpected response shape', async () => {
    stubFetch({ nope: true })
    await expect(fetchTrending('monthly')).rejects.toMatchObject({ kind: 'invalid-response' })
  })
})
