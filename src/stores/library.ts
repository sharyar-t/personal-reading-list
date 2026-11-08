import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type {
  BookMetadata,
  LibraryBook,
  LibrarySnapshot,
  ProgressEntry,
  ReadingGoal,
  Shelf,
} from '@/types/library'
import { findDuplicate, type IdentitySource } from '@/lib/bookIdentity'
import { computeProgress, type ProgressInput } from '@/lib/progress'
import { foldText, slugify } from '@/lib/text'
import { loadSeedLibrary } from '@/data/seed'
import { openLibraryStorage, type LibraryStorage } from '@/services/storage'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

/** Where books go when their custom shelf is deleted */
export const FALLBACK_SHELF_ID = 'want-to-read'

export class LibraryError extends Error {}

/** Strip Vue proxies so values can be structured-cloned into IndexedDB */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function nowIso() {
  return new Date().toISOString()
}

export const useLibraryStore = defineStore('library', () => {
  const status = ref<LoadStatus>('idle')
  const loadError = ref<string | null>(null)
  /** Last failed background write — surfaced to the user by the UI */
  const saveError = ref<string | null>(null)
  const storage = shallowRef<LibraryStorage | null>(null)

  const books = ref<LibraryBook[]>([])
  const shelves = ref<Shelf[]>([])
  const progressLog = ref<ProgressEntry[]>([])
  const goals = ref<ReadingGoal[]>([])

  // ── Getters ────────────────────────────────────────────────────────────

  const isPersistent = computed(() => storage.value?.kind === 'indexeddb')

  const bookMap = computed(() => new Map(books.value.map((book) => [book.id, book])))

  const sortedShelves = computed(() => [...shelves.value].sort((a, b) => a.position - b.position))

  const booksByShelf = computed(() => {
    const map = new Map<string, LibraryBook[]>()
    for (const book of books.value) {
      const list = map.get(book.shelfId)
      if (list) list.push(book)
      else map.set(book.shelfId, [book])
    }
    return map
  })

  const currentYear = computed(() => new Date().getFullYear())
  const currentGoal = computed(() => goals.value.find((goal) => goal.year === currentYear.value))

  /** Finished this calendar year — by date, regardless of the shelf the book sits on */
  const finishedThisYear = computed(() =>
    books.value.filter(
      (book) => book.finishedAt && new Date(book.finishedAt).getFullYear() === currentYear.value,
    ),
  )

  function getBook(id: string) {
    return bookMap.value.get(id)
  }

  function getShelf(id: string) {
    return shelves.value.find((shelf) => shelf.id === id)
  }

  function booksOn(shelfId: string) {
    return booksByShelf.value.get(shelfId) ?? []
  }

  function countFor(shelfId: string) {
    return booksOn(shelfId).length
  }

  function findInLibrary(candidate: IdentitySource) {
    return findDuplicate(books.value, candidate)
  }

  // ── Loading ────────────────────────────────────────────────────────────

  function hydrate(snapshot: LibrarySnapshot) {
    books.value = snapshot.books
    shelves.value = snapshot.shelves
    progressLog.value = snapshot.progress
    goals.value = snapshot.goals
  }

  let initPromise: Promise<void> | null = null

  /** Loads the library once; seeds the sample library on the very first visit. */
  function init(injected?: LibraryStorage): Promise<void> {
    initPromise ??= (async () => {
      status.value = 'loading'
      try {
        storage.value = injected ?? (await openLibraryStorage())
        let snapshot = await storage.value.load()
        if (!snapshot) {
          snapshot = await loadSeedLibrary()
          await storage.value.replaceAll(snapshot)
        }
        hydrate(snapshot)
        status.value = 'ready'
      } catch (error) {
        console.error('[bookshelf] Failed to load library', error)
        loadError.value = "We couldn't open your library."
        status.value = 'error'
        initPromise = null
      }
    })()
    return initPromise
  }

  async function resetToSample() {
    const snapshot = await loadSeedLibrary()
    await storage.value?.replaceAll(snapshot)
    hydrate(snapshot)
  }

  /**
   * Optimistic write: the in-memory change has already been applied; if the
   * storage write fails we roll it back and report it.
   */
  async function persist(write: (db: LibraryStorage) => Promise<void>, rollback: () => void) {
    if (!storage.value) return
    try {
      await write(storage.value)
      saveError.value = null
    } catch (error) {
      console.error('[bookshelf] Failed to save change', error)
      rollback()
      saveError.value = "Couldn't save your last change. Please try again."
    }
  }

  function replaceBook(next: LibraryBook) {
    const index = books.value.findIndex((book) => book.id === next.id)
    const previous = books.value[index]
    if (index === -1 || !previous) throw new LibraryError('Book not found')
    books.value[index] = next
    return persist(
      (db) => db.putBook(plain(next)),
      () => {
        const i = books.value.findIndex((book) => book.id === next.id)
        if (i !== -1) books.value[i] = previous
      },
    )
  }

  function requireBook(id: string): LibraryBook {
    const book = getBook(id)
    if (!book) throw new LibraryError('Book not found')
    return book
  }

  // ── Books ──────────────────────────────────────────────────────────────

  function uniqueBookId(title: string) {
    const base = slugify(title) || 'book'
    let id = base
    for (let n = 2; bookMap.value.has(id); n++) id = `${base}-${n}`
    return id
  }

  /**
   * Adds a book unless an edition of it is already in the library, in which
   * case the existing book is returned untouched.
   */
  async function addBook(metadata: BookMetadata, shelfId = FALLBACK_SHELF_ID) {
    const existing = findInLibrary(metadata)
    if (existing) return { added: false as const, book: existing }
    if (!getShelf(shelfId)) throw new LibraryError('Shelf not found')

    const at = nowIso()
    const book: LibraryBook = {
      ...metadata,
      id: uniqueBookId(metadata.title),
      shelfId,
      rating: null,
      notes: '',
      addedAt: at,
      startedAt: null,
      finishedAt: null,
      progress: null,
    }
    applyShelfTransition(book, shelfId, at)
    books.value.push(book)
    await persist(
      (db) => db.putBook(plain(book)),
      () => {
        books.value = books.value.filter((b) => b.id !== book.id)
      },
    )
    return { added: true as const, book }
  }

  /**
   * Keeps reading dates consistent with the default shelves:
   * - Currently Reading: has a start date and progress, isn't finished
   * - Read: has a finish date and 100% progress
   * - Want to Read: not started
   * Custom shelves leave the reading state alone.
   */
  function applyShelfTransition(book: LibraryBook, shelfId: string, at: string) {
    if (shelfId === 'currently-reading') {
      book.startedAt ??= at
      book.finishedAt = null
      book.progress ??= computeProgress({ percent: 0 }, book.pageCount, at)
    } else if (shelfId === 'read') {
      book.startedAt ??= at
      book.finishedAt ??= at
      book.progress = computeProgress({ percent: 100 }, book.pageCount, at)
    } else if (shelfId === 'want-to-read') {
      book.startedAt = null
      book.finishedAt = null
      book.progress = null
    }
  }

  function moveBook(id: string, shelfId: string) {
    const book = requireBook(id)
    if (!getShelf(shelfId)) throw new LibraryError('Shelf not found')
    if (book.shelfId === shelfId) return Promise.resolve()
    const next = { ...book, shelfId }
    applyShelfTransition(next, shelfId, nowIso())
    return replaceBook(next)
  }

  async function updateProgress(id: string, input: ProgressInput) {
    const book = requireBook(id)
    const at = nowIso()
    const progress = computeProgress(input, book.pageCount, at)
    const previousPage = book.progress?.currentPage ?? 0
    const entry: ProgressEntry = {
      id: crypto.randomUUID(),
      bookId: id,
      currentPage: progress.currentPage,
      percent: progress.percent,
      pagesRead:
        progress.currentPage === null ? null : Math.max(0, progress.currentPage - previousPage),
      at,
    }

    progressLog.value.push(entry)
    await replaceBook({ ...book, progress, startedAt: book.startedAt ?? at })
    await persist(
      (db) => db.addProgress(plain(entry)),
      () => {
        progressLog.value = progressLog.value.filter((e) => e.id !== entry.id)
      },
    )
    return progress
  }

  /**
   * Fills in metadata that arrived after the book was added (e.g. the
   * description from Open Library's works endpoint). Never overwrites data
   * the book already has.
   */
  function fillMissingMetadata(
    id: string,
    details: Partial<Pick<BookMetadata, 'description' | 'genres'>>,
  ) {
    const book = getBook(id)
    if (!book) return Promise.resolve()
    const patch: Partial<LibraryBook> = {}
    if (!book.description && details.description) patch.description = details.description
    if (!book.genres.length && details.genres?.length) patch.genres = details.genres
    if (!Object.keys(patch).length) return Promise.resolve()
    return replaceBook({ ...book, ...patch })
  }

  function setRating(id: string, rating: number | null) {
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      throw new LibraryError('Rating must be between 1 and 5')
    }
    return replaceBook({ ...requireBook(id), rating })
  }

  function setNotes(id: string, notes: string) {
    return replaceBook({ ...requireBook(id), notes })
  }

  function removeBook(id: string) {
    const book = requireBook(id)
    const removedEntries = progressLog.value.filter((entry) => entry.bookId === id)
    books.value = books.value.filter((b) => b.id !== id)
    progressLog.value = progressLog.value.filter((entry) => entry.bookId !== id)
    return persist(
      (db) => db.deleteBook(id),
      () => {
        books.value.push(book)
        progressLog.value.push(...removedEntries)
      },
    )
  }

  // ── Shelves ────────────────────────────────────────────────────────────

  function validateShelfName(name: string, exceptId?: string) {
    const trimmed = name.replace(/\s+/g, ' ').trim()
    if (!trimmed) throw new LibraryError('Give your shelf a name')
    if (trimmed.length > 40) throw new LibraryError('Keep shelf names under 40 characters')
    const folded = foldText(trimmed)
    if (shelves.value.some((shelf) => shelf.id !== exceptId && foldText(shelf.name) === folded)) {
      throw new LibraryError(`You already have a shelf called “${trimmed}”`)
    }
    return trimmed
  }

  async function createShelf(name: string) {
    const trimmed = validateShelfName(name)
    const base = slugify(trimmed) || 'shelf'
    let id = base
    for (let n = 2; getShelf(id); n++) id = `${base}-${n}`
    const shelf: Shelf = {
      id,
      name: trimmed,
      isDefault: false,
      position: Math.max(-1, ...shelves.value.map((s) => s.position)) + 1,
      createdAt: nowIso(),
    }
    shelves.value.push(shelf)
    await persist(
      (db) => db.putShelf(plain(shelf)),
      () => {
        shelves.value = shelves.value.filter((s) => s.id !== id)
      },
    )
    return shelf
  }

  function renameShelf(id: string, name: string) {
    const shelf = getShelf(id)
    if (!shelf) throw new LibraryError('Shelf not found')
    if (shelf.isDefault) throw new LibraryError('Default shelves can’t be renamed')
    const previous = shelf.name
    shelf.name = validateShelfName(name, id)
    return persist(
      (db) => db.putShelf(plain(shelf)),
      () => {
        shelf.name = previous
      },
    )
  }

  /** Deletes a custom shelf; its books move to "Want to Read" so nothing is lost. */
  function deleteShelf(id: string) {
    const shelf = getShelf(id)
    if (!shelf) throw new LibraryError('Shelf not found')
    if (shelf.isDefault) throw new LibraryError('Default shelves can’t be deleted')

    const previousBooks = books.value
    const moved = booksOn(id).map((book) => ({ ...book, shelfId: FALLBACK_SHELF_ID }))
    const movedIds = new Set(moved.map((book) => book.id))
    books.value = books.value.map((book) =>
      movedIds.has(book.id) ? moved.find((m) => m.id === book.id)! : book,
    )
    shelves.value = shelves.value.filter((s) => s.id !== id)

    return persist(
      async (db) => {
        await db.putBooks(plain(moved))
        await db.deleteShelf(id)
      },
      () => {
        books.value = previousBooks
        shelves.value.push(shelf)
      },
    )
  }

  /** Persists a new shelf order given the full list of shelf ids. */
  function reorderShelves(orderedIds: string[]) {
    const previous = shelves.value.map((shelf) => ({ id: shelf.id, position: shelf.position }))
    orderedIds.forEach((id, position) => {
      const shelf = getShelf(id)
      if (shelf) shelf.position = position
    })
    return persist(
      (db) => db.putShelves(plain(shelves.value)),
      () => {
        for (const { id, position } of previous) {
          const shelf = getShelf(id)
          if (shelf) shelf.position = position
        }
      },
    )
  }

  // ── Goals ──────────────────────────────────────────────────────────────

  function setGoal(target: number, year = currentYear.value) {
    if (!Number.isInteger(target) || target < 1 || target > 999) {
      throw new LibraryError('Choose a goal between 1 and 999 books')
    }
    const goal: ReadingGoal = { year, target, updatedAt: nowIso() }
    const previous = goals.value
    goals.value = [...goals.value.filter((g) => g.year !== year), goal]
    return persist(
      (db) => db.putGoal(plain(goal)),
      () => {
        goals.value = previous
      },
    )
  }

  return {
    // state
    status,
    loadError,
    saveError,
    books,
    shelves,
    progressLog,
    goals,
    // getters
    isPersistent,
    sortedShelves,
    booksByShelf,
    currentGoal,
    finishedThisYear,
    getBook,
    getShelf,
    booksOn,
    countFor,
    findInLibrary,
    // actions
    init,
    resetToSample,
    addBook,
    moveBook,
    updateProgress,
    fillMissingMetadata,
    setRating,
    setNotes,
    removeBook,
    createShelf,
    renameShelf,
    deleteShelf,
    reorderShelves,
    setGoal,
  }
})
