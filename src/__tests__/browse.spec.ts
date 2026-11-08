import { describe, expect, it } from 'vitest'
import type { LibraryBook } from '@/types/library'
import {
  NO_FILTERS,
  browseFacets,
  filterBooks,
  hasActiveFilters,
  isSortKey,
  sortBooks,
} from '@/lib/browse'

let seq = 0
function book(overrides: Partial<LibraryBook> = {}): LibraryBook {
  seq += 1
  return {
    id: `b${seq}`,
    source: 'sample',
    workKey: null,
    title: `Book ${seq}`,
    subtitle: null,
    authors: [],
    coverUrl: null,
    isbn13: null,
    isbn10: null,
    pageCount: 300,
    publishYear: null,
    publisher: null,
    description: null,
    genres: [],
    shelfId: 'read',
    rating: null,
    notes: '',
    addedAt: '2026-01-01T10:00:00.000Z',
    startedAt: null,
    finishedAt: null,
    progress: null,
    ...overrides,
  }
}

const titles = (books: LibraryBook[]) => books.map((b) => b.title)

describe('sortBooks', () => {
  it('sorts titles A–Z ignoring a leading article and without mutating', () => {
    const input = [
      book({ title: 'The Road' }),
      book({ title: 'Atomic Habits' }),
      book({ title: 'A Gentleman in Moscow' }),
    ]
    expect(titles(sortBooks(input, 'title'))).toEqual([
      'Atomic Habits',
      'A Gentleman in Moscow',
      'The Road',
    ])
    expect(titles(input)[0]).toBe('The Road')
  })

  it('sorts authors by surname and puts missing authors last', () => {
    const input = [
      book({ title: 'None' }),
      book({ title: 'Dune', authors: ['Frank Herbert'] }),
      book({ title: 'Emma', authors: ['Jane Austen'] }),
    ]
    expect(titles(sortBooks(input, 'author'))).toEqual(['Emma', 'Dune', 'None'])
  })

  it('puts the newest first for added and read, with unfinished books last', () => {
    const input = [
      book({
        title: 'Old',
        addedAt: '2025-01-01T00:00:00.000Z',
        finishedAt: '2025-02-01T00:00:00.000Z',
      }),
      book({
        title: 'New',
        addedAt: '2026-05-01T00:00:00.000Z',
        finishedAt: '2026-06-01T00:00:00.000Z',
      }),
      book({ title: 'Unread', addedAt: '2026-01-01T00:00:00.000Z' }),
    ]
    expect(titles(sortBooks(input, 'added'))).toEqual(['New', 'Unread', 'Old'])
    expect(titles(sortBooks(input, 'read'))).toEqual(['New', 'Old', 'Unread'])
  })

  it('sorts by rating, unrated last, ties by title', () => {
    const input = [
      book({ title: 'B', rating: 4 }),
      book({ title: 'Z' }),
      book({ title: 'A', rating: 4 }),
      book({ title: 'C', rating: 5 }),
    ]
    expect(titles(sortBooks(input, 'rating'))).toEqual(['C', 'A', 'B', 'Z'])
  })

  it('uses the shelf-specific order by default', () => {
    const input = [
      book({ title: 'First', finishedAt: '2026-01-01T00:00:00.000Z' }),
      book({ title: 'Second', finishedAt: '2026-03-01T00:00:00.000Z' }),
    ]
    expect(titles(sortBooks(input, 'default', 'read'))).toEqual(['Second', 'First'])
  })
})

describe('filterBooks', () => {
  const library = [
    book({ title: 'A', genres: ['Fiction'], authors: ['X'], rating: 5 }),
    book({ title: 'B', genres: ['Fiction', 'Sci-Fi'], authors: ['Y'], rating: 3 }),
    book({ title: 'C', genres: ['Tech'], authors: ['X'] }),
  ]

  it('returns everything with no filters', () => {
    expect(filterBooks(library, NO_FILTERS)).toHaveLength(3)
    expect(hasActiveFilters(NO_FILTERS)).toBe(false)
  })

  it('filters by genre, author and minimum rating, combining with AND', () => {
    expect(titles(filterBooks(library, { ...NO_FILTERS, genre: 'Fiction' }))).toEqual(['A', 'B'])
    expect(titles(filterBooks(library, { ...NO_FILTERS, author: 'X' }))).toEqual(['A', 'C'])
    expect(titles(filterBooks(library, { ...NO_FILTERS, minRating: 4 }))).toEqual(['A'])
    expect(titles(filterBooks(library, { genre: 'Fiction', author: 'X', minRating: 0 }))).toEqual([
      'A',
    ])
    expect(hasActiveFilters({ ...NO_FILTERS, minRating: 4 })).toBe(true)
  })
})

describe('browseFacets', () => {
  it('counts genres by popularity and lists authors by surname', () => {
    const { genres, authors } = browseFacets([
      book({ genres: ['Fiction', 'Fiction'], authors: ['Frank Herbert'] }),
      book({ genres: ['Fiction', 'Tech'], authors: ['Jane Austen', 'Frank Herbert'] }),
    ])
    expect(genres).toEqual([
      { name: 'Fiction', count: 2 },
      { name: 'Tech', count: 1 },
    ])
    expect(authors.map((a) => a.name)).toEqual(['Jane Austen', 'Frank Herbert'])
    expect(authors[1]!.count).toBe(2)
  })
})

describe('isSortKey', () => {
  it('accepts only known keys', () => {
    expect(isSortKey('title')).toBe(true)
    expect(isSortKey('nope')).toBe(false)
    expect(isSortKey(undefined)).toBe(false)
  })
})
