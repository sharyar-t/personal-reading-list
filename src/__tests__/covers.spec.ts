import { describe, expect, it } from 'vitest'
import { coverUrl } from '@/lib/covers'

describe('coverUrl', () => {
  const large = 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg'

  it('resizes Open Library covers and disables the blank default image', () => {
    expect(coverUrl(large, 'M')).toBe(
      'https://covers.openlibrary.org/b/isbn/9780441013593-M.jpg?default=false',
    )
  })

  it('returns null for missing covers', () => {
    expect(coverUrl(null)).toBeNull()
    expect(coverUrl('')).toBeNull()
  })

  it('passes non Open Library URLs through untouched', () => {
    expect(coverUrl('https://example.com/cover.png')).toBe('https://example.com/cover.png')
  })
})
