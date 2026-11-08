import { useLibraryStore } from '@/stores/library'
import { fetchWorkDetails } from '@/services/openLibrary/api'
import type { SearchResult } from '@/services/openLibrary/normalize'

/**
 * Adds a search result to the library right away, then quietly fetches the
 * description and fuller subjects from the works endpoint and fills them in.
 */
export function useAddFromSearch() {
  const library = useLibraryStore()

  async function addFromSearch(result: SearchResult, shelfId: string) {
    const outcome = await library.addBook(result.metadata, shelfId)
    const { book } = outcome
    if (outcome.added && book.workKey && !book.description) {
      fetchWorkDetails(book.workKey)
        .then((details) => library.fillMissingMetadata(book.id, details))
        .catch((error) => console.warn('[bookshelf] Could not load book details', error))
    }
    return outcome
  }

  return { addFromSearch }
}
