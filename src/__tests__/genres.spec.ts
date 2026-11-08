import { describe, expect, it } from 'vitest'
import samples from '../../data/sample-books.json'
import { normalizeGenres, sameGenres } from '@/lib/genres'
import { normalizeSampleBook } from '@/lib/normalize'
import type { SampleBook } from '@/types/library'

describe('normalizeGenres', () => {
  it('drops an umbrella when a specific member is present', () => {
    expect(normalizeGenres(['Sci-Fi & Fantasy', 'Science Fiction'])).toEqual(['Science Fiction'])
    expect(normalizeGenres(['Sci-Fi & Fantasy', 'Fantasy'])).toEqual(['Fantasy'])
  })

  it('expands a lone umbrella into its members', () => {
    expect(normalizeGenres(['Sci-Fi & Fantasy'])).toEqual(['Science Fiction', 'Fantasy'])
  })

  it('merges synonyms and over-specific tags', () => {
    expect(normalizeGenres(['Memoir', 'Biography'])).toEqual(['Biography & Memoir'])
    expect(normalizeGenres(['Fiction', 'Cyberpunk', 'Science Fiction'])).toEqual([
      'Fiction',
      'Science Fiction',
    ])
    expect(normalizeGenres(['Self-Improvement', 'Decision Making'])).toEqual(['Self-Improvement'])
    expect(normalizeGenres(['Tech & Programming', 'Software Engineering', 'JavaScript'])).toEqual([
      'Tech & Programming',
    ])
  })

  it('tidies case and spacing, and keeps unknown genres', () => {
    expect(normalizeGenres(['  historical   fiction ', 'FICTION', 'nonfiction'])).toEqual([
      'Historical Fiction',
      'Fiction',
      'Non-Fiction',
    ])
    expect(normalizeGenres(['Cozy Mystery'])).toEqual(['Cozy Mystery'])
  })

  it('keeps first-seen order, ignores blanks, and is idempotent', () => {
    const once = normalizeGenres(['Humour', '', 'Fiction', ' '])
    expect(once).toEqual(['Humor', 'Fiction'])
    expect(normalizeGenres(once)).toEqual(once)
  })
})

describe('sameGenres', () => {
  it('compares in order', () => {
    expect(sameGenres(['a', 'b'], ['a', 'b'])).toBe(true)
    expect(sameGenres(['a', 'b'], ['b', 'a'])).toBe(false)
    expect(sameGenres(['a'], ['a', 'b'])).toBe(false)
  })
})

describe('sample library genres', () => {
  const genres = (samples as SampleBook[]).flatMap((b) => normalizeSampleBook(b).genres)

  it('collapses the 32 raw tags into a small, non-overlapping vocabulary', () => {
    const distinct = new Set(genres)
    expect(distinct.size).toBeLessThanOrEqual(22)
    for (const overlapping of ['Sci-Fi & Fantasy', 'Memoir', 'Cyberpunk', 'Software Engineering']) {
      expect(distinct.has(overlapping)).toBe(false)
    }
  })

  it('leaves every book with at least one genre', () => {
    for (const sample of samples as SampleBook[]) {
      expect(normalizeSampleBook(sample).genres.length).toBeGreaterThan(0)
    }
  })
})
