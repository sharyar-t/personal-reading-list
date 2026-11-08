import type { LibrarySnapshot } from '@/types/library'
import type { LibraryStorage } from './types'

/**
 * Fallback when IndexedDB is unavailable (some private-browsing modes, blocked
 * storage). The app keeps working; changes just don't survive a reload.
 */
export function createMemoryStorage(): LibraryStorage {
  let snapshot: LibrarySnapshot | null = null
  const data = () => (snapshot ??= { books: [], shelves: [], progress: [], goals: [] })
  const upsert = <T>(list: T[], item: T, same: (a: T) => boolean) => {
    const index = list.findIndex(same)
    if (index === -1) list.push(item)
    else list[index] = item
  }

  return {
    kind: 'memory',
    async load() {
      return snapshot ? structuredClone(snapshot) : null
    },
    async replaceAll(next) {
      snapshot = structuredClone(next)
    },
    async putBook(book) {
      upsert(data().books, structuredClone(book), (b) => b.id === book.id)
    },
    async putBooks(books) {
      for (const book of books) upsert(data().books, structuredClone(book), (b) => b.id === book.id)
    },
    async deleteBook(id) {
      data().books = data().books.filter((book) => book.id !== id)
      data().progress = data().progress.filter((entry) => entry.bookId !== id)
    },
    async putShelf(shelf) {
      upsert(data().shelves, { ...shelf }, (s) => s.id === shelf.id)
    },
    async putShelves(shelves) {
      for (const shelf of shelves) upsert(data().shelves, { ...shelf }, (s) => s.id === shelf.id)
    },
    async deleteShelf(id) {
      data().shelves = data().shelves.filter((shelf) => shelf.id !== id)
    },
    async addProgress(entry) {
      data().progress.push({ ...entry })
    },
    async putGoal(goal) {
      upsert(data().goals, { ...goal }, (g) => g.year === goal.year)
    },
  }
}
