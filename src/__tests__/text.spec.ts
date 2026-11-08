import { describe, expect, it } from 'vitest'
import { parseAuthors, parseYear, slugify, splitTitle } from '@/lib/text'
import { cleanIsbn, toIsbn13 } from '@/lib/isbn'

describe('parseAuthors', () => {
  it.each([
    ['Frank Herbert', ['Frank Herbert']],
    ['David Thomas, Andrew Hunt', ['David Thomas', 'Andrew Hunt']],
    ['Herbert, Frank', ['Frank Herbert']],
    ['Tolkien, J.R.R.', ['J.R.R. Tolkien']],
    ['Le Guin, Ursula K.', ['Ursula K. Le Guin']],
    ['Neil Gaiman & Terry Pratchett', ['Neil Gaiman', 'Terry Pratchett']],
    ['  ', []],
    [null, []],
  ])('%s', (raw, expected) => {
    expect(parseAuthors(raw)).toEqual(expected)
  })
})

describe('splitTitle', () => {
  it('separates subtitles', () => {
    expect(splitTitle('Sapiens: A Brief History of Humankind')).toEqual({
      title: 'Sapiens',
      subtitle: 'A Brief History of Humankind',
    })
    expect(splitTitle('Dune')).toEqual({ title: 'Dune', subtitle: null })
  })
})

describe('parseYear / slugify', () => {
  it('extracts years from varied formats', () => {
    expect(parseYear('1925')).toBe(1925)
    expect(parseYear('May 2004')).toBe(2004)
    expect(parseYear('2004-05-01')).toBe(2004)
    expect(parseYear('')).toBeNull()
  })

  it('makes URL-safe ids', () => {
    expect(slugify("Don't Make Me Think")).toBe('don-t-make-me-think')
    expect(slugify('Café & Crème')).toBe('cafe-and-creme')
  })
})

describe('ISBN', () => {
  it('cleans formatting, including Goodreads wrapping', () => {
    expect(cleanIsbn('="0441013597"')).toBe('0441013597')
    expect(cleanIsbn('978-0-441-01359-3')).toBe('9780441013593')
    expect(cleanIsbn('031624662x')).toBe('031624662X')
    expect(cleanIsbn('12345')).toBeNull()
  })

  it('converts ISBN-10 to ISBN-13', () => {
    expect(toIsbn13('0441013597')).toBe('9780441013593')
    expect(toIsbn13('031624662X')).toBe('9780316246620')
  })
})
