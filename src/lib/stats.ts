import type { LibraryBook } from '@/types/library'
import { daysBetween } from '@/lib/dates'
import { formatAuthors } from '@/lib/books'

/*
 * Year-in-review maths. Pure functions over the library: "read in year Y"
 * means finishedAt falls in Y, regardless of which shelf the book sits on now
 * (a finished book moved to "Favorites" still counts).
 */

export interface MonthStat {
  /** 0 = January */
  month: number
  count: number
  pages: number
}

export interface GenreStat {
  name: string
  count: number
}

export interface Extreme {
  book: LibraryBook
  /** Pages for longest/shortest, days for fastest/slowest */
  value: number
}

export interface YearTotals {
  booksRead: number
  pagesRead: number
}

export interface YearStats extends YearTotals {
  year: number
  /** Still in progress — the story is "so far", not "in total" */
  isCurrentYear: boolean
  books: LibraryBook[]
  /** Finished books with no page count, so excluded from `pagesRead` */
  booksWithoutPages: number
  months: MonthStat[]
  busiestMonth: MonthStat | null
  genres: GenreStat[]
  averageRating: number | null
  ratedCount: number
  longest: Extreme | null
  shortest: Extreme | null
  fastest: Extreme | null
  slowest: Extreme | null
  averageDaysToFinish: number | null
  uniqueAuthors: number
  topAuthor: { name: string; count: number } | null
  favorite: LibraryBook | null
  /** Totals for the year before, when it has any — drives "vs last year" */
  previous: YearTotals | null
}

const yearOf = (iso: string) => new Date(iso).getFullYear()

export function booksFinishedIn(books: LibraryBook[], year: number): LibraryBook[] {
  return books
    .filter((book) => book.finishedAt && yearOf(book.finishedAt) === year)
    .sort((a, b) => a.finishedAt!.localeCompare(b.finishedAt!))
}

/** Years worth reviewing, newest first. The current year is always offered. */
export function reviewableYears(books: LibraryBook[], now = new Date()): number[] {
  const years = new Set<number>([now.getFullYear()])
  for (const book of books) if (book.finishedAt) years.add(yearOf(book.finishedAt))
  return [...years].sort((a, b) => b - a)
}

function totals(finished: LibraryBook[]): YearTotals {
  return {
    booksRead: finished.length,
    pagesRead: finished.reduce((sum, book) => sum + (book.pageCount ?? 0), 0),
  }
}

function extremes<T>(items: T[], pick: (item: T) => number, direction: 'max' | 'min') {
  let best: T | null = null
  for (const item of items) {
    if (best === null) best = item
    else if (direction === 'max' ? pick(item) > pick(best) : pick(item) < pick(best)) best = item
  }
  return best
}

export function computeYearStats(
  library: LibraryBook[],
  year: number,
  now = new Date(),
): YearStats {
  const finished = booksFinishedIn(library, year)
  const { booksRead, pagesRead } = totals(finished)

  const months: MonthStat[] = Array.from({ length: 12 }, (_, month) => ({
    month,
    count: 0,
    pages: 0,
  }))
  for (const book of finished) {
    const slot = months[new Date(book.finishedAt!).getMonth()]!
    slot.count += 1
    slot.pages += book.pageCount ?? 0
  }
  // First of equals wins, so ties favour the earlier month
  const busiestMonth = extremes(
    months.filter((m) => m.count > 0),
    (m) => m.count,
    'max',
  )

  const genreCounts = new Map<string, number>()
  for (const book of finished) {
    for (const genre of new Set(book.genres)) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    }
  }
  const genres = [...genreCounts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const rated = finished.filter((book) => book.rating !== null)
  const averageRating = rated.length
    ? rated.reduce((sum, book) => sum + book.rating!, 0) / rated.length
    : null

  // Superlatives need something to compare against: one book can't be "the longest"
  const withPages = finished.filter((book) => book.pageCount)
  const longest = withPages.length > 1 ? extremes(withPages, (b) => b.pageCount!, 'max') : null
  const shortest = withPages.length > 1 ? extremes(withPages, (b) => b.pageCount!, 'min') : null

  const timed = finished
    .filter((book) => book.startedAt)
    .map((book) => ({ book, days: daysBetween(book.startedAt!, book.finishedAt!) }))
  const fastest = timed.length > 1 ? extremes(timed, (t) => t.days, 'min') : null
  const slowest = timed.length > 1 ? extremes(timed, (t) => t.days, 'max') : null
  const averageDaysToFinish = timed.length
    ? Math.round(timed.reduce((sum, t) => sum + t.days, 0) / timed.length)
    : null

  const authorCounts = new Map<string, number>()
  for (const book of finished) {
    for (const author of new Set(book.authors)) {
      authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1)
    }
  }
  const [topName, topCount] = [...authorCounts].sort((a, b) => b[1] - a[1])[0] ?? []
  const topAuthor = topName && topCount && topCount > 1 ? { name: topName, count: topCount } : null

  // Highest rated; among equals, the one finished most recently
  const favorite = extremes([...rated].reverse(), (book) => book.rating!, 'max')

  const previousFinished = booksFinishedIn(library, year - 1)

  return {
    year,
    isCurrentYear: year === now.getFullYear(),
    books: finished,
    booksRead,
    pagesRead,
    booksWithoutPages: finished.length - withPages.length,
    months,
    busiestMonth,
    genres,
    averageRating,
    ratedCount: rated.length,
    longest: longest && { book: longest, value: longest.pageCount! },
    shortest: shortest && { book: shortest, value: shortest.pageCount! },
    fastest: fastest && { book: fastest.book, value: fastest.days },
    slowest: slowest && { book: slowest.book, value: slowest.days },
    averageDaysToFinish,
    uniqueAuthors: authorCounts.size,
    topAuthor,
    favorite: favorite && favorite.rating! >= 4 ? favorite : null,
    previous: previousFinished.length ? totals(previousFinished) : null,
  }
}

export const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1).toLocaleString('en', { month: 'long' }),
)

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/**
 * A headline that reads well at any scale: celebratory for a big year, warm
 * and specific for a light one — never a number that looks small next to a
 * benchmark.
 */
export function describeYear(stats: YearStats): { title: string; subtitle: string } {
  const { booksRead: n, year, isCurrentYear } = stats
  const when = isCurrentYear ? `so far in ${year}` : `in ${year}`

  if (n === 0) {
    return {
      title: isCurrentYear
        ? `Your ${year} chapter is just beginning`
        : `No finished books in ${year}`,
      subtitle: isCurrentYear
        ? 'Finish a book and it will show up here.'
        : 'Nothing was marked as finished that year.',
    }
  }

  const title = `${plural(n, 'book')} read ${when}`
  let subtitle: string
  if (n === 1) subtitle = 'Every reading year starts with one good book.'
  else if (n < 6) subtitle = 'Slow and steady — each one got your full attention.'
  else if (n < 15) subtitle = 'A real reading habit, and it shows.'
  else if (n < 30) subtitle = 'That is a serious year of reading.'
  else subtitle = 'An astonishing year — a book every week or so.'
  return { title, subtitle }
}

/** "+3 books vs 2025" — null when there is nothing to compare or it is a partial year */
export function compareWithPrevious(
  stats: YearStats,
): { label: string; direction: 'up' | 'down' | 'same' } | null {
  if (!stats.previous) return null
  const diff = stats.booksRead - stats.previous.booksRead
  const vs = `vs ${stats.year - 1}`
  if (diff === 0) return { label: `Same as ${stats.year - 1}`, direction: 'same' }
  const label = `${diff > 0 ? '+' : '−'}${plural(Math.abs(diff), 'book')} ${vs}`
  return { label, direction: diff > 0 ? 'up' : 'down' }
}

/** Plain-text recap for the clipboard — no screenshot tooling needed to share */
export function shareSummary(stats: YearStats): string {
  const { title } = describeYear(stats)
  const lines = [`📚 ${title}`]
  if (stats.pagesRead) lines.push(`${stats.pagesRead.toLocaleString('en')} pages`)
  if (stats.genres[0]) lines.push(`Most read genre: ${stats.genres[0].name}`)
  if (stats.favorite) {
    lines.push(`Favorite: ${stats.favorite.title} by ${formatAuthors(stats.favorite.authors)}`)
  }
  if (stats.busiestMonth) {
    lines.push(`Busiest month: ${MONTH_NAMES[stats.busiestMonth.month]}`)
  }
  return lines.join('\n')
}
