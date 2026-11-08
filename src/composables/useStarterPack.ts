import { computed, onMounted, ref, shallowRef } from 'vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { FALLBACK_SHELF_ID, useLibraryStore } from '@/stores/library'
import { loadPackBooks, type StarterPack } from '@/data/starterPacks'
import type { BookMetadata } from '@/types/library'

/** Which of a pack's books are already in the library, and a one-click way to add the rest. */
export function useStarterPack(pack: StarterPack) {
  const library = useLibraryStore()
  const { announce } = useAnnouncer()

  const books = shallowRef<BookMetadata[]>([])
  const adding = ref(false)
  const failed = ref(false)

  onMounted(async () => {
    books.value = await loadPackBooks(pack)
  })

  const missing = computed(() => books.value.filter((book) => !library.findInLibrary(book)))
  const owned = computed(() => books.value.length - missing.value.length)

  async function addAll() {
    if (adding.value || !missing.value.length) return
    adding.value = true
    failed.value = false
    const todo = [...missing.value]
    let added = 0
    try {
      for (const book of todo) {
        const outcome = await library.addBook(book, FALLBACK_SHELF_ID)
        if (outcome.added) added++
      }
      const shelf = library.getShelf(FALLBACK_SHELF_ID)?.name ?? 'Want to Read'
      announce(`Added ${added} ${added === 1 ? 'book' : 'books'} to ${shelf}`)
    } catch (error) {
      console.error('[bookshelf] Could not add starter pack', error)
      failed.value = true
      announce(`Couldn't add all of ${pack.title}. Please try again.`)
    } finally {
      adding.value = false
    }
  }

  return { books, missing, owned, adding, failed, addAll }
}
