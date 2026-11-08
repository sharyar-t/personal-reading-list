export type CoverSize = 'S' | 'M' | 'L'

const OPEN_LIBRARY_COVER = /^(https:\/\/covers\.openlibrary\.org\/b\/[a-z]+\/[^-/]+)-[SML]\.jpg/i

/**
 * Normalizes an Open Library cover URL to the requested size and asks the API
 * to return 404 instead of a 1×1 blank image when no cover exists, so the
 * `error` event fires and we can render our styled placeholder.
 */
export function coverUrl(url: string | null | undefined, size: CoverSize = 'M'): string | null {
  if (!url) return null
  const match = url.match(OPEN_LIBRARY_COVER)
  if (!match) return url
  return `${match[1]}-${size}.jpg?default=false`
}
