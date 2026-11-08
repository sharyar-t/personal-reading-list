import type { BookMetadata } from '@/types/library'
import { toIsbn13 } from './isbn'
import { foldText } from './text'

export type IdentitySource = Pick<
  BookMetadata,
  'title' | 'authors' | 'isbn13' | 'isbn10' | 'workKey'
> & {
  /** Extra edition ISBNs (e.g. from a search result) that also identify the book */
  isbns?: readonly string[]
}

const LEADING_ARTICLE = /^(the|a|an) /

function titleKey(title: string): string {
  // Ignore subtitles and edition notes: "Dune (Deluxe Edition)" ≈ "Dune: A Novel" ≈ "Dune"
  const main = title.split(/[:([]/)[0] ?? title
  return foldText(main).replace(LEADING_ARTICLE, '')
}

function authorKey(authors: string[]): string {
  const first = authors[0]
  if (!first) return ''
  // Surname: before the comma for "Last, First", otherwise the last word
  const surname = first.includes(',')
    ? first.split(',')[0]!
    : (first.trim().split(/\s+/).pop() ?? '')
  return foldText(surname)
}

/**
 * Every key that can identify "the same book" across editions and sources.
 * Two books sharing any key are treated as duplicates.
 */
export function identityKeys(book: IdentitySource): string[] {
  const keys = new Set<string>()
  for (const isbn of [book.isbn13, book.isbn10, ...(book.isbns ?? [])]) {
    const normalized = toIsbn13(isbn)
    if (normalized) keys.add(`isbn:${normalized}`)
  }
  if (book.workKey) keys.add(`work:${book.workKey}`)
  const title = titleKey(book.title)
  if (title) keys.add(`title:${title}|${authorKey(book.authors)}`)
  return [...keys]
}

export function findDuplicate<T extends IdentitySource>(books: T[], candidate: IdentitySource) {
  const wanted = new Set(identityKeys(candidate))
  return books.find((book) => identityKeys(book).some((key) => wanted.has(key)))
}
