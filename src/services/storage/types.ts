import type {
  LibraryBook,
  LibrarySnapshot,
  ProgressEntry,
  ReadingGoal,
  Shelf,
} from '@/types/library'

/**
 * Persistence boundary. The app keeps the whole library in memory (Pinia) and
 * writes through to this interface, so swapping IndexedDB for a remote API
 * later only means adding another implementation.
 */
export interface LibraryStorage {
  readonly kind: 'indexeddb' | 'memory'
  /** Null when nothing has ever been stored (first visit) */
  load(): Promise<LibrarySnapshot | null>
  /** Replaces everything — used for seeding and "reset to sample library" */
  replaceAll(snapshot: LibrarySnapshot): Promise<void>

  putBook(book: LibraryBook): Promise<void>
  putBooks(books: LibraryBook[]): Promise<void>
  deleteBook(id: string): Promise<void>

  putShelf(shelf: Shelf): Promise<void>
  putShelves(shelves: Shelf[]): Promise<void>
  deleteShelf(id: string): Promise<void>

  addProgress(entry: ProgressEntry): Promise<void>
  putGoal(goal: ReadingGoal): Promise<void>
}
