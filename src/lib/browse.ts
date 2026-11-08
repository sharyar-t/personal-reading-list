import type { LibraryBook } from '@/types/library'
import { sortForShelf } from '@/lib/books'
import { foldText } from '@/lib/text'

export const SORT_OPTIONS = [
  { value: 'default', label: 'Most relevant' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'author', label: 'Author (A–Z)' },
  { value: 'added', label: 'Recently added' },
  { value: 'read', label: 'Recently read' },
  { value: 'rating', label: 'Highest rated' },
] as const

export type SortKey = (typeof SORT_OPTIONS)[number]['value']

export function isSortKey(value: unknown): value is SortKey {
  return SORT_OPTIONS.some((option) => option.value === value)
}

export interface BookFilters {
  genre: string
  author: string
  /** Minimum rating 1–5; 0 means any (unrated books are excluded once set) */
  minRating: number
}

export const NO_FILTERS: BookFilters = { genre: '', author: '', minRating: 0 }

export function hasActiveFilters(filters: BookFilters): boolean {
  return Boolean(filters.genre || filters.author || filters.minRating)
}

const LEADING_ARTICLE = /^(the|a|an)\s+/

/** "The Great Gatsby" sorts under G, like a bookshop would file it */
function titleKey(book: LibraryBook): string {
  return foldText(book.title).replace(LEADING_ARTICLE, '')
}

/** Sorted by surname: "Frank Herbert" files under H. No author sinks to the end. */
function authorKey(book: LibraryBook): string | null {
  const first = book.authors[0]
  if (!first) return null
  const words = foldText(first).split(' ')
  return [words.at(-1), ...words.slice(0, -1)].join(' ')
}

const newestFirst = (a: string | null, b: string | null) => {
  if (a === b) return 0
  if (!a) return 1
  if (!b) return -1
  return b.localeCompare(a)
}

/**
 * Sorts a copy of `books`. Ties always fall back to title so the order is
 * stable and predictable; books missing the sort field go last.
 */
export function sortBooks(books: LibraryBook[], key: SortKey, shelfId?: string): LibraryBook[] {
  if (key === 'default') {
    return shelfId && shelfId !== 'all' ? sortForShelf(books, shelfId) : sortRecentlyAdded(books)
  }
  const byTitle = (a: LibraryBook, b: LibraryBook) => titleKey(a).localeCompare(titleKey(b))
  const compare: (a: LibraryBook, b: LibraryBook) => number = {
    title: byTitle,
    author: (a: LibraryBook, b: LibraryBook) => {
      const ka = authorKey(a)
      const kb = authorKey(b)
      if (ka === kb) return 0
      if (ka === null) return 1
      if (kb === null) return -1
      return ka.localeCompare(kb)
    },
    added: (a: LibraryBook, b: LibraryBook) => newestFirst(a.addedAt, b.addedAt),
    read: (a: LibraryBook, b: LibraryBook) => newestFirst(a.finishedAt, b.finishedAt),
    rating: (a: LibraryBook, b: LibraryBook) => (b.rating ?? 0) - (a.rating ?? 0),
  }[key]
  return [...books].sort((a, b) => compare(a, b) || byTitle(a, b))
}

function sortRecentlyAdded(books: LibraryBook[]): LibraryBook[] {
  return [...books].sort((a, b) => newestFirst(a.addedAt, b.addedAt))
}

export function filterBooks(books: LibraryBook[], filters: BookFilters): LibraryBook[] {
  return books.filter(
    (book) =>
      (!filters.genre || book.genres.includes(filters.genre)) &&
      (!filters.author || book.authors.includes(filters.author)) &&
      (!filters.minRating || (book.rating ?? 0) >= filters.minRating),
  )
}

export interface Facet {
  name: string
  count: number
}

/** Genres (most common first) and authors (A–Z by surname) present in `books` */
export function browseFacets(books: LibraryBook[]): { genres: Facet[]; authors: Facet[] } {
  const genres = new Map<string, number>()
  const authors = new Map<string, number>()
  for (const book of books) {
    for (const genre of new Set(book.genres)) genres.set(genre, (genres.get(genre) ?? 0) + 1)
    for (const author of new Set(book.authors)) authors.set(author, (authors.get(author) ?? 0) + 1)
  }
  const surname = (name: string) => {
    const words = foldText(name).split(' ')
    return [words.at(-1), ...words.slice(0, -1)].join(' ')
  }
  return {
    genres: [...genres]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    authors: [...authors]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => surname(a.name).localeCompare(surname(b.name))),
  }
}
