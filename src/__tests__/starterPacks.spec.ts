import { describe, expect, it } from 'vitest'
import { STARTER_PACKS, loadCatalog, loadPackBooks } from '@/data/starterPacks'

describe('starter packs', () => {
  it('only reference titles that exist in the catalog', async () => {
    const catalog = await loadCatalog()
    for (const pack of STARTER_PACKS) {
      for (const title of pack.titles) {
        expect(catalog.has(title), `${pack.id}: "${title}"`).toBe(true)
      }
    }
  })

  it('are small enough to add in one click and have no repeated titles', () => {
    for (const pack of STARTER_PACKS) {
      expect(pack.titles.length).toBeGreaterThanOrEqual(5)
      expect(pack.titles.length).toBeLessThanOrEqual(8)
      expect(new Set(pack.titles).size).toBe(pack.titles.length)
    }
    expect(new Set(STARTER_PACKS.map((p) => p.id)).size).toBe(STARTER_PACKS.length)
  })

  it('load books with covers in pack order', async () => {
    const [first] = STARTER_PACKS
    const books = await loadPackBooks(first!)
    expect(books.map((b) => b.title)).toEqual(first!.titles.map((t) => t.split(': ')[0]))
    expect(books.every((b) => b.coverUrl)).toBe(true)
  })

  it('keeps the "short" pack under 300 pages', async () => {
    const pack = STARTER_PACKS.find((p) => p.id === 'short-and-satisfying')!
    const books = await loadPackBooks(pack)
    expect(books.every((b) => b.pageCount === null || b.pageCount < 300)).toBe(true)
  })
})
