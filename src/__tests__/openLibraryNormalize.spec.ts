import { describe, expect, it } from 'vitest'
import {
  normalizeDescription,
  searchDocToResult,
  subjectsToGenres,
} from '@/services/openLibrary/normalize'

describe('normalizeDescription', () => {
  it('accepts both string and { value } shapes', () => {
    expect(normalizeDescription('A book.')).toBe('A book.')
    expect(normalizeDescription({ type: '/type/text', value: 'A book.' })).toBe('A book.')
    expect(normalizeDescription(undefined)).toBeNull()
    expect(normalizeDescription({ value: 42 })).toBeNull()
    expect(normalizeDescription('   ')).toBeNull()
  })

  it('strips HTML, entities, markdown links and source sections', () => {
    const raw =
      '<p>Paul &amp; the <i>spice</i>&#8230;</p><p>See [Wikipedia][1].</p>\r\n----------\r\nContains:\r\n- Book 1\n\n[1]: https://en.wikipedia.org'
    expect(normalizeDescription(raw)).toBe('Paul & the spice…\n\nSee Wikipedia.')
  })
})

describe('normalizeDescription markdown', () => {
  it('removes markdown emphasis', () => {
    expect(normalizeDescription('**Book Two in the _Dune_ Chronicles** is here')).toBe(
      'Book Two in the Dune Chronicles is here',
    )
  })
})

describe('subjectsToGenres', () => {
  it('maps messy subjects to a small genre list and drops noise', () => {
    const subjects = [
      'Dune (Imaginary place)',
      'Fiction',
      'Fiction, science fiction, general',
      'New York Times reviewed',
      'Science fiction',
      'nyt:mass-market-monthly=2021-11-07',
      'Accessible book',
      'Fantasy fiction',
    ]
    expect(subjectsToGenres(subjects)).toEqual(['Fiction', 'Science Fiction', 'Fantasy'])
  })

  it('labels non-fiction and keeps History for it', () => {
    expect(subjectsToGenres(['Nonfiction', 'World history', 'Civilization'])).toEqual([
      'Non-Fiction',
      'History',
    ])
  })

  it('handles missing subjects', () => {
    expect(subjectsToGenres(undefined)).toEqual([])
  })
})

describe('searchDocToResult', () => {
  it('normalizes a full search doc', () => {
    const { metadata, isbns, editionCount } = searchDocToResult({
      key: '/works/OL893414W',
      title: 'Dune',
      author_name: ['Frank Herbert'],
      first_publish_year: 1965,
      number_of_pages_median: 608,
      cover_i: 11481354,
      isbn: ['8466372015', '9788466372015', '0441013597', '9780441013593', 'garbage'],
      publisher: ['  ', 'Ace'],
      subject: ['Science fiction'],
      edition_count: 155,
    })
    expect(metadata).toMatchObject({
      source: 'openlibrary',
      workKey: '/works/OL893414W',
      title: 'Dune',
      subtitle: null,
      authors: ['Frank Herbert'],
      coverUrl: 'https://covers.openlibrary.org/b/id/11481354-L.jpg',
      isbn13: '9780441013593',
      isbn10: '0441013597',
      pageCount: 608,
      publishYear: 1965,
      publisher: 'Ace',
    })
    expect(isbns).toEqual(['8466372015', '9788466372015', '0441013597', '9780441013593'])
    expect(editionCount).toBe(155)
  })

  it('tolerates a doc with almost nothing in it', () => {
    const { metadata } = searchDocToResult({
      key: '/works/OL1W',
      title: 'Sapiens: A Brief History of Humankind',
      cover_i: -1,
    })
    expect(metadata).toMatchObject({
      title: 'Sapiens',
      subtitle: 'A Brief History of Humankind',
      authors: [],
      coverUrl: null,
      pageCount: null,
      publishYear: null,
      isbn13: null,
      genres: [],
    })
  })
})
