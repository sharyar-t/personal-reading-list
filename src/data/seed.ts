import type {
  LibraryBook,
  LibrarySnapshot,
  ProgressEntry,
  ReadingGoal,
  SampleBook,
  Shelf,
} from '@/types/library'
import { hashString } from '@/lib/hash'
import { normalizeSampleBook } from '@/lib/normalize'
import { computeProgress } from '@/lib/progress'
import { slugify } from '@/lib/text'

/*
 * The sample library a new visitor starts with.
 *
 * Shelf placement, ratings and notes are hand-authored; every date is generated
 * relative to "now" so the demo never goes stale — the current year always has
 * finished books, a goal that's slightly ahead of pace, and recent progress.
 */

type ShelfId = 'currently-reading' | 'want-to-read' | 'read' | 'favorites' | 'book-club'

interface SeedPlan {
  shelf: ShelfId
  rating?: number
  notes?: string
  /** Which year the book was finished in */
  finished?: 'this-year' | 'last-year'
  /** Currently reading: page reached, or percent for books without a page count */
  page?: number
  percent?: number
}

const PLAN: Record<string, SeedPlan> = {
  // Fiction
  'The Great Gatsby': {
    shelf: 'favorites',
    rating: 5,
    finished: 'last-year',
    notes: 'A perfect novel. Every sentence earns its place. Great for re-reading.',
  },
  'To Kill a Mockingbird': {
    shelf: 'read',
    rating: 5,
    finished: 'last-year',
    notes: 'Timeless and devastating.',
  },
  '1984': { shelf: 'read', rating: 4, finished: 'this-year', notes: 'More relevant than ever.' },
  'Pride and Prejudice': {
    shelf: 'read',
    rating: 4,
    finished: 'this-year',
    notes: 'Witty and surprisingly modern.',
  },
  'The Catcher in the Rye': { shelf: 'want-to-read' },
  Beloved: { shelf: 'read', rating: 5, finished: 'last-year' },
  'The Road': {
    shelf: 'read',
    rating: 4,
    finished: 'this-year',
    notes: 'Bleak but beautiful. Read it in two sittings.',
  },
  'Normal People': { shelf: 'book-club', notes: 'Book club pick — meeting on the first Thursday.' },
  'A Gentleman in Moscow': {
    shelf: 'favorites',
    rating: 5,
    finished: 'this-year',
    notes:
      'Charming, witty and deeply humane. One of those books I wish I could read for the first time again.',
  },
  Circe: { shelf: 'currently-reading', page: 212 },

  // Non-Fiction
  'Sapiens: A Brief History of Humankind': {
    shelf: 'read',
    rating: 4,
    finished: 'last-year',
    notes: 'Changed how I think about history.',
  },
  Educated: {
    shelf: 'favorites',
    rating: 5,
    finished: 'last-year',
    notes: "Incredible memoir. Couldn't put it down.",
  },
  'The Immortal Life of Henrietta Lacks': { shelf: 'want-to-read' },
  'Thinking, Fast and Slow': { shelf: 'want-to-read' },
  'Born a Crime': {
    shelf: 'read',
    rating: 5,
    finished: 'this-year',
    notes: 'Funny and heartbreaking. The audiobook, read by the author, is worth it.',
  },
  'Atomic Habits': { shelf: 'read', rating: 4, finished: 'this-year' },
  'The Body: A Guide for Occupants': { shelf: 'want-to-read' },
  "Quiet: The Power of Introverts in a World That Can't Stop Talking": {
    shelf: 'read',
    rating: 4,
    finished: 'last-year',
  },
  'Range: Why Generalists Triumph in a Specialized World': { shelf: 'want-to-read' },
  'Say Nothing: A True Story of Murder and Memory in Northern Ireland': { shelf: 'book-club' },

  // Sci-Fi & Fantasy
  Dune: {
    shelf: 'read',
    rating: 5,
    finished: 'this-year',
    notes: 'Epic worldbuilding, deeply philosophical. The appendices are worth it too.',
  },
  'The Left Hand of Darkness': { shelf: 'read', rating: 4, finished: 'this-year' },
  Neuromancer: { shelf: 'want-to-read' },
  'The Name of the Wind': { shelf: 'currently-reading', page: 148 },
  'Project Hail Mary': {
    shelf: 'favorites',
    rating: 5,
    finished: 'this-year',
    notes: "Best sci-fi I've read in years. Funny, smart, and that friendship…",
  },
  'The Fifth Season': {
    shelf: 'read',
    rating: 4,
    finished: 'this-year',
    notes: 'Second-person POV was jarring at first but it pays off brilliantly.',
  },
  Piranesi: {
    shelf: 'read',
    rating: 4,
    finished: 'this-year',
    notes: 'Dreamlike and mysterious. Short, but it lingers.',
  },
  'Children of Time': { shelf: 'book-club' },
  'The Dispossessed': { shelf: 'want-to-read' },
  'Ancillary Justice': { shelf: 'want-to-read' },

  // Self-Improvement
  'Deep Work': { shelf: 'read', rating: 4, finished: 'last-year' },
  'The Psychology of Money': {
    shelf: 'read',
    rating: 4,
    finished: 'this-year',
    notes: 'Short chapters that each land a punch.',
  },
  'Digital Minimalism': { shelf: 'want-to-read' },
  'Four Thousand Weeks: Time Management for Mortals': { shelf: 'currently-reading', page: 96 },
  'Essentialism: The Disciplined Pursuit of Less': { shelf: 'want-to-read' },
  'Thinking in Bets': { shelf: 'want-to-read' },
  'The Obstacle Is the Way': { shelf: 'want-to-read' },

  // Tech & Programming
  'The Pragmatic Programmer': {
    shelf: 'read',
    rating: 5,
    finished: 'last-year',
    notes: 'Every developer should read this. The 20th anniversary edition is the one to get.',
  },
  'Clean Code': {
    shelf: 'read',
    rating: 3,
    finished: 'this-year',
    notes: 'Some good principles, but very Java-centric. Treat the rules as suggestions.',
  },
  'Designing Data-Intensive Applications': {
    shelf: 'favorites',
    rating: 5,
    finished: 'this-year',
    notes: "The best technical book I've ever read. Chapter 9 deserves a second pass.",
  },
  'A Philosophy of Software Design': { shelf: 'read', rating: 4, finished: 'this-year' },
  'Refactoring: Improving the Design of Existing Code': { shelf: 'want-to-read' },
  'The Mythical Man-Month': {
    shelf: 'read',
    rating: 4,
    finished: 'this-year',
    notes: 'Still relevant after 50 years.',
  },
  "Don't Make Me Think": { shelf: 'currently-reading', page: 141 },
  'Eloquent JavaScript': {
    shelf: 'currently-reading',
    percent: 35,
    notes: 'Reading the free online edition and doing the exercises as I go.',
  },
}

const DAY = 24 * 60 * 60 * 1000

/** Deterministic pseudo-random integer in [min, max] derived from a string */
function vary(seed: string, min: number, max: number): number {
  return min + (hashString(seed) % (max - min + 1))
}

/** An evening reading time on the given day, varied per seed */
function atEvening(date: Date, seed: string): Date {
  const result = new Date(date)
  result.setHours(vary(`${seed}:h`, 19, 22), vary(`${seed}:m`, 0, 59), 0, 0)
  return result
}

function iso(date: Date): string {
  return date.toISOString()
}

export function buildSeedShelves(now: Date): Shelf[] {
  const createdAt = iso(new Date(now.getTime() - 365 * DAY))
  return [
    { id: 'currently-reading', name: 'Currently Reading', isDefault: true, position: 0, createdAt },
    { id: 'want-to-read', name: 'Want to Read', isDefault: true, position: 1, createdAt },
    { id: 'read', name: 'Read', isDefault: true, position: 2, createdAt },
    { id: 'favorites', name: 'Favorites', isDefault: false, position: 3, createdAt },
    { id: 'book-club', name: 'Book Club', isDefault: false, position: 4, createdAt },
  ]
}

/**
 * Splits reading between `from` and `to` into a few sessions and returns the
 * progress log, ending at `targetPage` / `targetPercent`.
 */
function buildSessions(
  book: LibraryBook,
  from: Date,
  to: Date,
  target: { page: number } | { percent: number },
): ProgressEntry[] {
  const sessions = vary(`${book.id}:sessions`, 3, 6)
  const entries: ProgressEntry[] = []
  let previousPage = 0

  for (let i = 1; i <= sessions; i++) {
    const fraction = i / sessions
    const at = atEvening(
      new Date(from.getTime() + (to.getTime() - from.getTime()) * fraction),
      `${book.id}:${i}`,
    )
    const input =
      'page' in target
        ? { page: Math.round(target.page * fraction) }
        : { percent: target.percent * fraction }
    const progress = computeProgress(input, book.pageCount, iso(at))
    entries.push({
      id: `${book.id}:seed-${i}`,
      bookId: book.id,
      currentPage: progress.currentPage,
      percent: progress.percent,
      pagesRead: progress.currentPage === null ? null : progress.currentPage - previousPage,
      at: progress.updatedAt,
    })
    previousPage = progress.currentPage ?? previousPage
  }
  return entries
}

/**
 * Picks a yearly goal the sample reader is slightly ahead of, whatever the
 * date: "on pace" means target × elapsed share of the year.
 */
export function seedGoalTarget(finishedThisYear: number, now: Date): number {
  const start = new Date(now.getFullYear(), 0, 1).getTime()
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime()
  const elapsed = Math.max(0.05, (now.getTime() - start) / (end - start))
  const target = Math.round((finishedThisYear - 1.5) / elapsed)
  return Math.min(40, Math.max(finishedThisYear + 2, target))
}

export function buildSeedLibrary(samples: SampleBook[], now = new Date()): LibrarySnapshot {
  const shelves = buildSeedShelves(now)
  const books: LibraryBook[] = []
  const progress: ProgressEntry[] = []

  const yearStart = new Date(now.getFullYear(), 0, 1)
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)

  const planned = samples.map((sample) => {
    const plan = PLAN[sample.title]
    if (!plan) throw new Error(`No seed plan for sample book "${sample.title}"`)
    const metadata = normalizeSampleBook(sample)
    const book: LibraryBook = {
      ...metadata,
      id: slugify(metadata.title),
      shelfId: plan.shelf,
      rating: plan.rating ?? null,
      notes: plan.notes ?? '',
      addedAt: '',
      startedAt: null,
      finishedAt: null,
      progress: null,
    }
    return { book, plan }
  })

  // Spread finished books evenly through their year, in a shuffled (but stable) order
  const byFinish = (year: 'this-year' | 'last-year') =>
    planned
      .filter(({ plan }) => plan.finished === year)
      .sort((a, b) => hashString(a.book.id) - hashString(b.book.id))

  const thisYear = byFinish('this-year')
  const lastYear = byFinish('last-year')
  const thisYearSpan = Math.max(DAY, now.getTime() - yearStart.getTime() - 2 * DAY)
  const lastYearSpan = yearStart.getTime() - lastYearStart.getTime() - 20 * DAY

  const finishDate = new Map<string, Date>()
  thisYear.forEach(({ book }, i) => {
    const t = yearStart.getTime() + (thisYearSpan * (i + 0.7)) / thisYear.length
    finishDate.set(book.id, atEvening(new Date(Math.min(t, now.getTime() - DAY)), book.id))
  })
  lastYear.forEach(({ book }, i) => {
    const t = lastYearStart.getTime() + 20 * DAY + (lastYearSpan * (i + 0.5)) / lastYear.length
    finishDate.set(book.id, atEvening(new Date(t), book.id))
  })

  for (const { book, plan } of planned) {
    const finished = finishDate.get(book.id)

    if (finished) {
      const pages = book.pageCount ?? 300
      const readingDays = Math.min(24, Math.max(4, Math.round(pages / 30))) + vary(book.id, 0, 4)
      const started = new Date(finished.getTime() - readingDays * DAY)
      book.startedAt = iso(atEvening(started, `${book.id}:start`))
      book.finishedAt = iso(finished)
      book.addedAt = iso(new Date(started.getTime() - vary(`${book.id}:added`, 7, 60) * DAY))
      const sessions = buildSessions(
        book,
        started,
        finished,
        book.pageCount ? { page: book.pageCount } : { percent: 100 },
      )
      progress.push(...sessions)
      book.progress = computeProgress({ percent: 100 }, book.pageCount, book.finishedAt)
    } else if (plan.shelf === 'currently-reading') {
      const started = new Date(now.getTime() - vary(`${book.id}:start`, 8, 28) * DAY)
      const lastRead = new Date(now.getTime() - vary(`${book.id}:last`, 1, 4) * DAY)
      book.startedAt = iso(atEvening(started, `${book.id}:start`))
      book.addedAt = iso(new Date(started.getTime() - vary(`${book.id}:added`, 5, 90) * DAY))
      const target = plan.page !== undefined ? { page: plan.page } : { percent: plan.percent ?? 0 }
      const sessions = buildSessions(book, started, lastRead, target)
      progress.push(...sessions)
      const last = sessions[sessions.length - 1]!
      book.progress = { currentPage: last.currentPage, percent: last.percent, updatedAt: last.at }
    } else {
      book.addedAt = iso(
        atEvening(new Date(now.getTime() - vary(`${book.id}:added`, 3, 220) * DAY), book.id),
      )
    }

    books.push(book)
  }

  const goal: ReadingGoal = {
    year: now.getFullYear(),
    target: seedGoalTarget(thisYear.length, now),
    updatedAt: iso(yearStart),
  }

  return { books, shelves, progress, goals: [goal] }
}

/** Loads the sample JSON lazily so it stays out of the main bundle. */
export async function loadSeedLibrary(now = new Date()): Promise<LibrarySnapshot> {
  const { default: samples } = await import('../../data/sample-books.json')
  return buildSeedLibrary(samples as SampleBook[], now)
}
