import { describe, expect, it } from 'vitest'
import samples from '../../data/sample-books.json'
import { buildSeedLibrary, seedGoalTarget } from '@/data/seed'
import type { SampleBook } from '@/types/library'

const now = new Date(2026, 10, 4, 12) // 4 Nov 2026
const seed = buildSeedLibrary(samples as SampleBook[], now)

const count = (shelfId: string) => seed.books.filter((b) => b.shelfId === shelfId).length

describe('seed library', () => {
  it('places all 45 sample books on shelves', () => {
    expect(seed.books).toHaveLength(45)
    expect(new Set(seed.books.map((b) => b.id)).size).toBe(45)
    expect(count('read')).toBe(19)
    expect(count('currently-reading')).toBe(5)
    expect(count('want-to-read')).toBe(13)
    expect(count('favorites')).toBe(5)
    expect(count('book-club')).toBe(3)
  })

  it('never puts dates in the future and keeps them ordered', () => {
    const problems = seed.books.flatMap((book) => {
      const issues: string[] = []
      if (book.addedAt >= now.toISOString()) issues.push('added in the future')
      if (book.startedAt && book.startedAt < book.addedAt) issues.push('started before added')
      if (book.finishedAt && book.finishedAt >= now.toISOString()) issues.push('finished in future')
      if (book.finishedAt && (!book.startedAt || book.finishedAt <= book.startedAt)) {
        issues.push('finished before started')
      }
      return issues.map((issue) => `${book.id}: ${issue}`)
    })
    expect(problems).toEqual([])
  })

  it('gives currently-reading books progress, including percent-only ones', () => {
    const reading = seed.books.filter((b) => b.shelfId === 'currently-reading')
    for (const book of reading) {
      expect(book.progress!.percent).toBeGreaterThan(0)
      expect(book.progress!.percent).toBeLessThan(100)
    }
    const eloquent = reading.find((b) => b.id === 'eloquent-javascript')!
    expect(eloquent.progress).toMatchObject({ currentPage: null, percent: 35 })
  })

  it('logs progress history that adds up to the pages read', () => {
    const dune = seed.books.find((b) => b.id === 'dune')!
    const entries = seed.progress.filter((e) => e.bookId === 'dune')
    expect(entries.reduce((sum, e) => sum + (e.pagesRead ?? 0), 0)).toBe(dune.pageCount)
  })

  it('sets a goal the sample reader is slightly ahead of', () => {
    const finished = seed.books.filter((b) => b.finishedAt?.startsWith('2026')).length
    expect(finished).toBe(16)
    const goal = seed.goals[0]!
    const expectedByNow = goal.target * (308 / 365)
    expect(finished).toBeGreaterThan(expectedByNow)
    expect(finished).toBeLessThan(goal.target)
  })

  it('keeps the goal sensible early in the year', () => {
    expect(seedGoalTarget(16, new Date(2026, 0, 10))).toBe(40)
    expect(seedGoalTarget(16, new Date(2026, 6, 1))).toBeGreaterThan(16)
  })
})
