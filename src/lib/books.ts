import type { BookMetadata } from '@/types/library'

const list = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })

/** "David Thomas and Andrew Hunt"; "Unknown author" when missing */
export function formatAuthors(authors: string[]): string {
  return authors.length ? list.format(authors) : 'Unknown author'
}

export function primaryAuthor(book: Pick<BookMetadata, 'authors'>): string | undefined {
  return book.authors[0]
}

type Sortable = {
  addedAt: string
  finishedAt: string | null
  progress: { updatedAt: string } | null
}

const desc = (a: string | null | undefined, b: string | null | undefined) =>
  (b ?? '').localeCompare(a ?? '')

/**
 * Most relevant first: recently touched books on Currently Reading, recently
 * finished on Read, recently added everywhere else.
 */
export function sortForShelf<T extends Sortable>(books: T[], shelfId: string): T[] {
  const sorted = [...books]
  if (shelfId === 'currently-reading') {
    return sorted.sort((a, b) => desc(a.progress?.updatedAt, b.progress?.updatedAt))
  }
  if (shelfId === 'read') return sorted.sort((a, b) => desc(a.finishedAt, b.finishedAt))
  return sorted.sort((a, b) => desc(a.addedAt, b.addedAt))
}

/** Best Open Library page for a book: its work, its ISBN, or a title search. */
export function openLibraryUrl(
  book: Pick<BookMetadata, 'workKey' | 'isbn13' | 'isbn10' | 'title' | 'authors'>,
): string {
  if (book.workKey) return `https://openlibrary.org${book.workKey}`
  const isbn = book.isbn13 ?? book.isbn10
  if (isbn) return `https://openlibrary.org/isbn/${isbn}`
  const params = new URLSearchParams({ title: book.title })
  if (book.authors[0]) params.set('author', book.authors[0])
  return `https://openlibrary.org/search?${params}`
}
