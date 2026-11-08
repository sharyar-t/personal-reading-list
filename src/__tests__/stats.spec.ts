import { describe, expect, it } from 'vitest'
import type { LibraryBook } from '@/types/library'
import {
  compareWithPrevious,
  computeYearStats,
  describeYear,
  reviewableYears,
  shareSummary,
} from '@/lib/stats'

const NOW = new Date(2026, 10, 4, 12)

let seq = 0
function book(overrides: Partial<LibraryBook> = {}): LibraryBook {
  seq += 1
  return {
    id: `b${seq}`,
    source: 'sample',
    workKey: null,
    title: `Book ${seq}`,
    subtitle: null,
    authors: [`Author ${seq}`],
    coverUrl: null,
    isbn13: null,
    isbn10: null,
    pageCount: 300,
    publishYear: 2000,
    publisher: null,
    description: null,
    genres: [],
    shelfId: 'read',
    rating: null,
    notes: '',
    addedAt: '2025-12-01T10:00:00.000Z',
    startedAt: null,
    finishedAt: '2026-03-10T10:00:00.000Z',
    progress: null,
    ...overrides,
  }
}

describe('computeYearStats', () => {
  it('counts only books finished in the requested year, whatever shelf they are on', () => {
    const stats = computeYearStats(
      [
        book({ finishedAt: '2026-02-01T10:00:00.000Z', shelfId: 'favorites' }),
        book({ finishedAt: '2025-02-01T10:00:00.000Z' }),
        book({ shelfId: 'want-to-read', finishedAt: null }),
      ],
      2026,
      NOW,
    )
    expect(stats.booksRead).toBe(1)
    expect(stats.isCurrentYear).toBe(true)
  })

  it('sums pages and flags books without a page count', () => {
    const stats = computeYearStats(
      [book({ pageCount: 200 }), book({ pageCount: 100 }), book({ pageCount: null })],
      2026,
      NOW,
    )
    expect(stats.pagesRead).toBe(300)
    expect(stats.booksWithoutPages).toBe(1)
  })

  it('buckets books by month and finds the busiest, earlier month winning ties', () => {
    const stats = computeYearStats(
      [
        book({ finishedAt: '2026-03-02T10:00:00.000Z' }),
        book({ finishedAt: '2026-03-20T10:00:00.000Z' }),
        book({ finishedAt: '2026-07-04T10:00:00.000Z' }),
        book({ finishedAt: '2026-07-14T10:00:00.000Z' }),
      ],
      2026,
      NOW,
    )
    expect(stats.months).toHaveLength(12)
    expect(stats.months[2]!.count).toBe(2)
    expect(stats.busiestMonth?.month).toBe(2)
  })

  it('ranks genres once per book and breaks ties alphabetically', () => {
    const stats = computeYearStats(
      [
        book({ genres: ['Sci-Fi', 'Sci-Fi', 'Fiction'] }),
        book({ genres: ['Fiction'] }),
        book({ genres: ['Tech'] }),
      ],
      2026,
      NOW,
    )
    expect(stats.genres).toEqual([
      { name: 'Fiction', count: 2 },
      { name: 'Sci-Fi', count: 1 },
      { name: 'Tech', count: 1 },
    ])
  })

  it('averages ratings over rated books only', () => {
    const stats = computeYearStats(
      [book({ rating: 5 }), book({ rating: 4 }), book({ rating: null })],
      2026,
      NOW,
    )
    expect(stats.averageRating).toBe(4.5)
    expect(stats.ratedCount).toBe(2)
  })

  it('has no superlatives for a single book', () => {
    const stats = computeYearStats([book({ startedAt: '2026-03-01T10:00:00.000Z' })], 2026, NOW)
    expect(stats.longest).toBeNull()
    expect(stats.shortest).toBeNull()
    expect(stats.fastest).toBeNull()
    expect(stats.averageDaysToFinish).toBe(9)
  })

  it('finds longest, shortest, fastest and slowest reads', () => {
    const long = book({ pageCount: 900, startedAt: '2026-01-01T10:00:00.000Z' })
    const short = book({ pageCount: 120, startedAt: '2026-03-08T10:00:00.000Z' })
    const stats = computeYearStats([long, short], 2026, NOW)
    expect(stats.longest?.book.id).toBe(long.id)
    expect(stats.shortest?.book.id).toBe(short.id)
    expect(stats.fastest).toMatchObject({ value: 2 })
    expect(stats.fastest?.book.id).toBe(short.id)
    expect(stats.slowest?.book.id).toBe(long.id)
  })

  it('names a top author only when they were read more than once', () => {
    const solo = computeYearStats([book({ authors: ['A'] }), book({ authors: ['B'] })], 2026, NOW)
    expect(solo.topAuthor).toBeNull()
    expect(solo.uniqueAuthors).toBe(2)

    const repeat = computeYearStats(
      [book({ authors: ['A'] }), book({ authors: ['A', 'B'] })],
      2026,
      NOW,
    )
    expect(repeat.topAuthor).toEqual({ name: 'A', count: 2 })
  })

  it('picks the most recently finished book among the top rated, and only if it earned 4+', () => {
    const early = book({ rating: 5, finishedAt: '2026-01-10T10:00:00.000Z' })
    const late = book({ rating: 5, finishedAt: '2026-06-10T10:00:00.000Z' })
    expect(computeYearStats([early, late], 2026, NOW).favorite?.id).toBe(late.id)
    expect(computeYearStats([book({ rating: 3 })], 2026, NOW).favorite).toBeNull()
  })

  it('carries last year totals only when last year has books', () => {
    const none = computeYearStats([book()], 2026, NOW)
    expect(none.previous).toBeNull()

    const some = computeYearStats(
      [book(), book({ finishedAt: '2025-05-01T10:00:00.000Z', pageCount: 250 })],
      2026,
      NOW,
    )
    expect(some.previous).toEqual({ booksRead: 1, pagesRead: 250 })
  })

  it('copes with an empty library', () => {
    const stats = computeYearStats([], 2026, NOW)
    expect(stats.booksRead).toBe(0)
    expect(stats.busiestMonth).toBeNull()
    expect(stats.averageRating).toBeNull()
    expect(stats.genres).toEqual([])
  })
})

describe('reviewableYears', () => {
  it('always includes the current year, newest first', () => {
    const years = reviewableYears(
      [book({ finishedAt: '2024-01-01T10:00:00.000Z' }), book({ finishedAt: null })],
      NOW,
    )
    expect(years).toEqual([2026, 2024])
  })
})

describe('describeYear', () => {
  it('is warm for a light year and says "so far" for the current one', () => {
    const light = describeYear(computeYearStats([book(), book(), book()], 2026, NOW))
    expect(light.title).toBe('3 books read so far in 2026')
    expect(light.subtitle).toMatch(/steady/)
  })

  it('uses past tense wording for a finished year and singular for one book', () => {
    const past = describeYear(
      computeYearStats([book({ finishedAt: '2025-04-01T10:00:00.000Z' })], 2025, NOW),
    )
    expect(past.title).toBe('1 book read in 2025')
  })

  it('has an encouraging empty state', () => {
    expect(describeYear(computeYearStats([], 2026, NOW)).title).toMatch(/just beginning/)
    expect(describeYear(computeYearStats([], 2024, NOW)).title).toBe('No finished books in 2024')
  })
})

describe('compareWithPrevious', () => {
  it('describes the difference in books', () => {
    const books = [book(), book(), book(), book({ finishedAt: '2025-02-01T10:00:00.000Z' })]
    expect(compareWithPrevious(computeYearStats(books, 2026, NOW))).toEqual({
      label: '+2 books vs 2025',
      direction: 'up',
    })
  })

  it('is null without a previous year', () => {
    expect(compareWithPrevious(computeYearStats([book()], 2026, NOW))).toBeNull()
  })
})

describe('shareSummary', () => {
  it('lists the headline facts', () => {
    const text = shareSummary(
      computeYearStats([book({ genres: ['Fiction'], rating: 5, title: 'Dune' })], 2026, NOW),
    )
    expect(text).toContain('1 book read so far in 2026')
    expect(text).toContain('300 pages')
    expect(text).toContain('Most read genre: Fiction')
    expect(text).toContain('Favorite: Dune')
  })
})
