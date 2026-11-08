import { describe, expect, it } from 'vitest'
import { findDuplicate } from '@/lib/bookIdentity'

const dune = {
  title: 'Dune',
  authors: ['Frank Herbert'],
  isbn13: '9780441013593',
  isbn10: '0441013597',
  workKey: null,
}

describe('findDuplicate', () => {
  it('matches the same edition by ISBN-10 vs ISBN-13', () => {
    const candidate = { ...dune, title: 'Dune (40th anniversary)', isbn13: null, authors: [] }
    expect(findDuplicate([dune], candidate)).toBe(dune)
  })

  it('matches different editions by title and author surname', () => {
    const candidate = {
      title: 'Dune: Deluxe Edition',
      authors: ['Herbert, Frank'],
      isbn13: '9780593099322',
      isbn10: null,
      workKey: '/works/OL893415W',
    }
    expect(findDuplicate([dune], candidate)).toBe(dune)
  })

  it('does not confuse different books with the same title', () => {
    const candidate = { ...dune, authors: ['Someone Else'], isbn13: null, isbn10: null }
    expect(findDuplicate([dune], candidate)).toBeUndefined()
  })
})
