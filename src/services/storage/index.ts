import { createIndexedDbStorage } from './indexeddb'
import { createMemoryStorage } from './memory'
import type { LibraryStorage } from './types'

export type { LibraryStorage } from './types'
export { createMemoryStorage } from './memory'

/** Opens IndexedDB, falling back to in-memory storage if it isn't available. */
export async function openLibraryStorage(): Promise<LibraryStorage> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is not available')
    return await createIndexedDbStorage()
  } catch (error) {
    console.warn('[bookshelf] Falling back to in-memory storage:', error)
    return createMemoryStorage()
  }
}
