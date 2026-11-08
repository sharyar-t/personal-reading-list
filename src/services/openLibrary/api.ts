import { fetchOpenLibrary } from './client'
import {
  normalizeDescription,
  searchDocToResult,
  subjectsToGenres,
  type SearchDoc,
  type SearchResult,
} from './normalize'
import { cleanIsbn } from '@/lib/isbn'

export type SearchScope = 'all' | 'title' | 'author'

export const SEARCH_PAGE_SIZE = 24

const FIELDS = [
  'key',
  'title',
  'subtitle',
  'author_name',
  'first_publish_year',
  'number_of_pages_median',
  'cover_i',
  'isbn',
  'publisher',
  'subject',
  'edition_count',
].join(',')

interface SearchResponse {
  numFound: number
  docs: SearchDoc[]
}

function isSearchResponse(data: unknown): data is SearchResponse {
  const value = data as SearchResponse
  return typeof value?.numFound === 'number' && Array.isArray(value.docs)
}

function isValidDoc(doc: unknown): doc is SearchDoc {
  const value = doc as SearchDoc
  return (
    typeof value?.key === 'string' && typeof value.title === 'string' && value.title.trim() !== ''
  )
}

export interface SearchPage {
  results: SearchResult[]
  total: number
  page: number
  hasMore: boolean
}

/** Treats a query as an ISBN when it's 10 or 13 digits (ignoring hyphens/spaces). */
export function detectIsbn(query: string): string | null {
  return /^[\d\s-]+[\dXx]$/.test(query.trim()) ? cleanIsbn(query) : null
}

export async function searchBooks(
  query: string,
  {
    scope = 'all',
    page = 1,
    signal,
  }: { scope?: SearchScope; page?: number; signal?: AbortSignal } = {},
): Promise<SearchPage> {
  const params = new URLSearchParams({
    fields: FIELDS,
    limit: String(SEARCH_PAGE_SIZE),
    page: String(page),
  })
  const isbn = detectIsbn(query)
  if (isbn) params.set('isbn', isbn)
  else if (scope === 'title') params.set('title', query.trim())
  else if (scope === 'author') params.set('author', query.trim())
  else params.set('q', query.trim())

  const data = await fetchOpenLibrary(`/search.json?${params}`, isSearchResponse, { signal })

  // One malformed doc shouldn't break the whole page of results
  const results = data.docs.filter(isValidDoc).map(searchDocToResult)
  return {
    results,
    total: data.numFound,
    page,
    hasMore: page * SEARCH_PAGE_SIZE < data.numFound,
  }
}

interface WorkResponse {
  description?: unknown
  subjects?: unknown
}

function isWork(data: unknown): data is WorkResponse {
  return typeof data === 'object' && data !== null
}

/** Extra details only the works endpoint has: description and full subject list. */
export async function fetchWorkDetails(workKey: string, signal?: AbortSignal) {
  if (!/^\/works\/OL\d+W$/.test(workKey)) return { description: null, genres: [] }
  const work = await fetchOpenLibrary(`${workKey}.json`, isWork, { signal })
  const subjects = Array.isArray(work.subjects)
    ? work.subjects.filter((s): s is string => typeof s === 'string')
    : []
  return {
    description: normalizeDescription(work.description),
    genres: subjectsToGenres(subjects),
  }
}
