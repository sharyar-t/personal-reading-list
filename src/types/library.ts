/** Raw shape of a book in data/sample-books.json */
export interface SampleBook {
  title: string
  author: string
  isbn13: string | null
  isbn10: string | null
  coverUrl: string | null
  pageCount: number | null
  publishedDate: string | null
  genres: string[]
  description: string | null
  publisher: string | null
}

export type BookSource = 'sample' | 'openlibrary'

/** Bibliographic data — what we know about the book itself */
export interface BookMetadata {
  source: BookSource
  /** Open Library work key, e.g. "/works/OL45883W" */
  workKey: string | null
  title: string
  subtitle: string | null
  authors: string[]
  coverUrl: string | null
  isbn13: string | null
  isbn10: string | null
  pageCount: number | null
  publishYear: number | null
  publisher: string | null
  description: string | null
  genres: string[]
}

export interface ReadingProgress {
  /** Null when the book has no page count and is tracked by percentage */
  currentPage: number | null
  percent: number
  updatedAt: string
}

/** A book in the user's library: metadata + the user's relationship to it */
export interface LibraryBook extends BookMetadata {
  id: string
  shelfId: string
  /** 1–5, null when unrated */
  rating: number | null
  notes: string
  addedAt: string
  startedAt: string | null
  finishedAt: string | null
  progress: ReadingProgress | null
}

/** One progress update — the history behind "pages read per week" style stats */
export interface ProgressEntry {
  id: string
  bookId: string
  currentPage: number | null
  percent: number
  /** Pages read since the previous entry (null for percentage-only books) */
  pagesRead: number | null
  at: string
}

export const DEFAULT_SHELF_IDS = ['currently-reading', 'want-to-read', 'read'] as const
export type DefaultShelfId = (typeof DEFAULT_SHELF_IDS)[number]

export interface Shelf {
  id: string
  name: string
  isDefault: boolean
  position: number
  createdAt: string
}

export interface ReadingGoal {
  year: number
  target: number
  updatedAt: string
}

export interface LibrarySnapshot {
  books: LibraryBook[]
  shelves: Shelf[]
  progress: ProgressEntry[]
  goals: ReadingGoal[]
}
