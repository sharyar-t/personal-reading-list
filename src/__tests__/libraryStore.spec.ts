import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLibraryStore } from '@/stores/library'
import { createIndexedDbStorage } from '@/services/storage/indexeddb'
import type { BookMetadata } from '@/types/library'

const newBook: BookMetadata = {
  source: 'openlibrary',
  workKey: '/works/OL1W',
  title: 'The Hobbit',
  subtitle: null,
  authors: ['J.R.R. Tolkien'],
  coverUrl: null,
  isbn13: '9780547928227',
  isbn10: null,
  pageCount: 300,
  publishYear: 1937,
  publisher: null,
  description: null,
  genres: ['Fantasy'],
}

let dbCounter = 0

async function freshStore() {
  setActivePinia(createPinia())
  const storage = await createIndexedDbStorage(`test-${++dbCounter}`)
  const library = useLibraryStore()
  await library.init(storage)
  return { library, storage }
}

describe('library store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('seeds the sample library on first load and persists it', async () => {
    const { library, storage } = await freshStore()
    expect(library.status).toBe('ready')
    expect(library.books).toHaveLength(45)
    const stored = await storage.load()
    expect(stored?.books).toHaveLength(45)
    expect(stored?.shelves).toHaveLength(5)
  })

  it('normalises genres saved by an older version, in memory and in storage', async () => {
    setActivePinia(createPinia())
    const storage = await createIndexedDbStorage(`test-${++dbCounter}`)
    const seeded = await useLibraryStore()
      .init(storage)
      .then(() => storage.load())
    const [first, second] = seeded!.books
    await storage.putBooks([
      { ...first!, genres: ['Sci-Fi & Fantasy', 'Science Fiction', 'Cyberpunk'] },
      { ...second!, genres: ['Memoir', 'Biography'] },
    ])

    setActivePinia(createPinia())
    const library = useLibraryStore()
    await library.init(storage)

    expect(library.getBook(first!.id)?.genres).toEqual(['Science Fiction'])
    expect(library.getBook(second!.id)?.genres).toEqual(['Biography & Memoir'])
    const stored = (await storage.load())!.books
    expect(stored.find((b) => b.id === first!.id)?.genres).toEqual(['Science Fiction'])
  })

  it('starts fresh: empty library, default shelves only, and it stays empty after a reload', async () => {
    const { library, storage } = await freshStore()
    await library.startFresh()
    expect(library.books).toHaveLength(0)
    expect(library.sortedShelves.map((s) => s.id)).toEqual([
      'currently-reading',
      'want-to-read',
      'read',
    ])
    expect(library.goals).toHaveLength(0)
    expect(library.progressLog).toHaveLength(0)

    setActivePinia(createPinia())
    const reloaded = useLibraryStore()
    await reloaded.init(storage)
    expect(reloaded.books).toHaveLength(0)
    expect(reloaded.status).toBe('ready')
  })

  it('restores the sample library after starting fresh', async () => {
    const { library, storage } = await freshStore()
    await library.startFresh()
    await library.resetToSample()
    expect(library.books).toHaveLength(45)
    expect(library.sortedShelves).toHaveLength(5)
    expect(library.currentGoal).toBeDefined()
    expect((await storage.load())?.books).toHaveLength(45)
  })

  it('adds books and refuses duplicates', async () => {
    const { library, storage } = await freshStore()
    const first = await library.addBook(newBook)
    expect(first.added).toBe(true)
    expect(first.book.shelfId).toBe('want-to-read')

    const again = await library.addBook({ ...newBook, isbn13: null, workKey: null })
    expect(again).toEqual({ added: false, book: first.book })
    expect((await storage.load())?.books).toHaveLength(46)
  })

  it('tracks progress and logs pages read', async () => {
    const { library, storage } = await freshStore()
    const { book } = await library.addBook(newBook, 'currently-reading')
    await library.updateProgress(book.id, { page: 120 })
    await library.updateProgress(book.id, { page: 150 })

    expect(library.getBook(book.id)?.progress).toMatchObject({ currentPage: 150, percent: 50 })
    // IndexedDB returns entries in key order (random ids), so order by page
    const entries = (await storage.load())!.progress
      .filter((e) => e.bookId === book.id)
      .sort((a, b) => a.currentPage! - b.currentPage!)
    expect(entries.map((e) => [e.currentPage, e.pagesRead])).toEqual([
      [120, 120],
      [150, 30],
    ])
  })

  it('moving to Read finishes the book', async () => {
    const { library } = await freshStore()
    await library.moveBook('circe', 'read')
    const circe = library.getBook('circe')!
    expect(circe.finishedAt).not.toBeNull()
    expect(circe.progress?.percent).toBe(100)
  })

  it('deleting a custom shelf moves its books to Want to Read', async () => {
    const { library, storage } = await freshStore()
    const bookClub = library.booksOn('book-club').map((b) => b.id)
    await library.deleteShelf('book-club')

    expect(library.getShelf('book-club')).toBeUndefined()
    const stored = await storage.load()
    for (const id of bookClub) {
      expect(stored!.books.find((b) => b.id === id)?.shelfId).toBe('want-to-read')
    }
  })

  it('protects default shelves and validates names', async () => {
    const { library } = await freshStore()
    expect(() => library.deleteShelf('read')).toThrow(/can’t be deleted/)
    await expect(library.createShelf('favorites')).rejects.toThrow(/already have/)
    await expect(library.createShelf('   ')).rejects.toThrow(/name/)
    const shelf = await library.createShelf('Lent Out')
    expect(shelf).toMatchObject({ id: 'lent-out', position: 5, isDefault: false })
  })
})
