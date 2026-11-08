import { fetchOpenLibrary } from './client'
import { searchDocToResult, type SearchDoc, type SearchResult } from './normalize'

export type TrendingPeriod = 'daily' | 'weekly' | 'monthly'

export const TRENDING_PERIODS: { value: TrendingPeriod; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This week' },
  { value: 'monthly', label: 'This month' },
]

export const TRENDING_LIMIT = 24

interface TrendingResponse {
  works: unknown[]
}

function isTrendingResponse(data: unknown): data is TrendingResponse {
  return Array.isArray((data as TrendingResponse | null)?.works)
}

function isValidDoc(doc: unknown): doc is SearchDoc {
  const value = doc as SearchDoc
  return (
    typeof value?.key === 'string' && typeof value.title === 'string' && value.title.trim() !== ''
  )
}

/**
 * What readers are picking up on Open Library right now. Trending works carry
 * no ISBNs or page counts — enough to browse and add; the works endpoint
 * fills in the description and genres after a book is added.
 */
export async function fetchTrending(
  period: TrendingPeriod,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const data = await fetchOpenLibrary(
    `/trending/${period}.json?limit=${TRENDING_LIMIT}`,
    isTrendingResponse,
    { signal },
  )
  // Several editions can surface as one work twice; keep the first of each
  const seen = new Set<string>()
  return data.works
    .filter(isValidDoc)
    .filter((doc) => (seen.has(doc.key) ? false : (seen.add(doc.key), true)))
    .map(searchDocToResult)
}
