import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { LibraryBook, ProgressEntry, ReadingGoal, Shelf } from '@/types/library'
import type { LibraryStorage } from './types'

const DB_NAME = 'bookshelf'
const DB_VERSION = 1

interface BookshelfDB extends DBSchema {
  books: { key: string; value: LibraryBook; indexes: { shelfId: string } }
  shelves: { key: string; value: Shelf }
  progress: { key: string; value: ProgressEntry; indexes: { bookId: string } }
  goals: { key: number; value: ReadingGoal }
  meta: { key: string; value: string }
}

const STORES = ['books', 'shelves', 'progress', 'goals', 'meta'] as const
const INITIALIZED_KEY = 'initializedAt'

export async function createIndexedDbStorage(name = DB_NAME): Promise<LibraryStorage> {
  const db: IDBPDatabase<BookshelfDB> = await openDB<BookshelfDB>(name, DB_VERSION, {
    upgrade(database) {
      const books = database.createObjectStore('books', { keyPath: 'id' })
      books.createIndex('shelfId', 'shelfId')
      database.createObjectStore('shelves', { keyPath: 'id' })
      const progress = database.createObjectStore('progress', { keyPath: 'id' })
      progress.createIndex('bookId', 'bookId')
      database.createObjectStore('goals', { keyPath: 'year' })
      database.createObjectStore('meta')
    },
  })

  return {
    kind: 'indexeddb',

    async load() {
      const tx = db.transaction(STORES, 'readonly')
      const initialized = await tx.objectStore('meta').get(INITIALIZED_KEY)
      if (!initialized) return null
      const [books, shelves, progress, goals] = await Promise.all([
        tx.objectStore('books').getAll(),
        tx.objectStore('shelves').getAll(),
        tx.objectStore('progress').getAll(),
        tx.objectStore('goals').getAll(),
      ])
      await tx.done
      return { books, shelves, progress, goals }
    },

    async replaceAll(snapshot) {
      const tx = db.transaction(STORES, 'readwrite')
      await Promise.all(STORES.map((store) => tx.objectStore(store).clear()))
      await Promise.all([
        ...snapshot.books.map((book) => tx.objectStore('books').put(book)),
        ...snapshot.shelves.map((shelf) => tx.objectStore('shelves').put(shelf)),
        ...snapshot.progress.map((entry) => tx.objectStore('progress').put(entry)),
        ...snapshot.goals.map((goal) => tx.objectStore('goals').put(goal)),
        tx.objectStore('meta').put(new Date().toISOString(), INITIALIZED_KEY),
      ])
      await tx.done
    },

    async putBook(book) {
      await db.put('books', book)
    },

    async putBooks(books) {
      const tx = db.transaction('books', 'readwrite')
      await Promise.all(books.map((book) => tx.store.put(book)))
      await tx.done
    },

    async deleteBook(id) {
      // A book's progress history goes with it
      const tx = db.transaction(['books', 'progress'], 'readwrite')
      const entryKeys = await tx.objectStore('progress').index('bookId').getAllKeys(id)
      await Promise.all([
        tx.objectStore('books').delete(id),
        ...entryKeys.map((key) => tx.objectStore('progress').delete(key)),
      ])
      await tx.done
    },

    async putShelf(shelf) {
      await db.put('shelves', shelf)
    },

    async putShelves(shelves) {
      const tx = db.transaction('shelves', 'readwrite')
      await Promise.all(shelves.map((shelf) => tx.store.put(shelf)))
      await tx.done
    },

    async deleteShelf(id) {
      await db.delete('shelves', id)
    },

    async addProgress(entry) {
      await db.put('progress', entry)
    },

    async putGoal(goal) {
      await db.put('goals', goal)
    },
  }
}
